import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuth, requireTrainer } from "./lib";

// Returns all "coming" attendees for a session (for the attendee list in detail view)
export const getForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "coming")
      )
      .take(30); // fetch extra to account for deleted records
    return records.filter((a) => !a.deleted).slice(0, 14);
  },
});

// Returns the current user's attendance record for a session (to show RSVP state)
export const getMyStatus = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const record = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    // Soft-deleted record = no response
    if (!record || record.deleted) return null;
    return record;
  },
});

// Returns all attendees for a session structured for the client view:
// - Group members always appear, each with status: "coming" | "cancelled" | "no_response"
// - Non-group members who said "coming" appear as cross-group guests
// - isCurrentUserGroupMember: true if the viewing client belongs to this session's group
export const getSessionWithAttendees = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const group = await ctx.db.get(session.groupId);
    if (!group) return null;

    const memberIds = group.memberIds ?? [];

    // Look up current user to determine group membership
    const currentUser = await ctx.db.get(userId);
    const isCurrentUserGroupMember = !!(currentUser && memberIds.includes(currentUser._id));

    // Fetch each group member and their attendance record
    const members = await Promise.all(
      memberIds.map(async (memberId) => {
        const user = await ctx.db.get(memberId);
        if (!user) return null;

        const attendance = await ctx.db
          .query("attendance")
          .withIndex("by_session_and_user", (q) =>
            q.eq("sessionId", args.sessionId).eq("userId", memberId)
          )
          .unique();

        // Soft-deleted record = no response
        const status = (!attendance || attendance.deleted)
          ? "no_response"
          : attendance.status === "coming"
          ? "coming"
          : "cancelled";

        return {
          userId: memberId,
          name: user.name ?? "",
          status: status as "coming" | "cancelled" | "no_response",
          isGroupMember: true,
        };
      })
    );

    // All "coming" attendees for this session — to find cross-group people
    const allComing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "coming")
      )
      .take(14);

    // Build set of group member IDs for fast lookup
    const groupMemberIdSet = new Set(
      members.filter(Boolean).map((m) => m!.userId)
    );

    const crossGroupComers = allComing
      .filter((a) => !groupMemberIdSet.has(a.userId as Id<"users">) && !a.deleted)
      .map((a) => ({
        userId: a.userId,
        name: a.userName,
        status: "coming" as const,
        isGroupMember: false,
      }));

    return {
      members: members.filter(Boolean),
      crossGroupComers,
      isCurrentUserGroupMember,
    };
  },
});

// Sign up for a session — creates or updates the attendance record
export const rsvp = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Trainers manage sessions, they don't attend them
    const user = await ctx.db.get(userId);
    if (user?.role === "trainer") throw new Error("Trainers cannot RSVP to sessions");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.cancelled) throw new Error("Session not found");

    // Check capacity — count current attendees
    const coming = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "coming")
      )
      .take(session.capacity + 1);

    // Check for existing record (re-signing up after cancelling)
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (existing?.status === "coming") return; // already signed up, do nothing

    if (coming.length >= session.capacity) throw new Error("Session is full");

    if (existing) {
      // Previously cancelled or soft-deleted (niet aanwezig) — reactivate
      await ctx.db.patch(existing._id, {
        status: "coming",
        signedUpAt: Date.now(),
        deleted: false,
      });
    } else {
      await ctx.db.insert("attendance", {
        sessionId: args.sessionId,
        userId,
        userName: user?.name ?? "Unknown",
        status: "coming",
        signedUpAt: Date.now(),
      });
    }
  },
});

// Trainer only — per-client attendance stats grouped by group.
// Counts past non-cancelled sessions and how many each client RSVPd "coming" to.
export const getClientAttendanceOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainer(ctx);
    const today = new Date().toISOString().slice(0, 10);

    // All non-cancelled sessions up to today
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).lte("date", today)
      )
      .take(500);

    // Group sessions by groupId in JS
    const sessionsByGroup = new Map<Id<"groups">, Doc<"sessions">[]>();
    for (const s of allSessions) {
      const arr = sessionsByGroup.get(s.groupId) ?? [];
      arr.push(s);
      sessionsByGroup.set(s.groupId, arr);
    }

    // All groups — small table, safe to take all and filter in JS
    const allGroups = await ctx.db.query("groups").take(20);
    const activeGroups = allGroups.filter((g) => !g.cancelled);

    return await Promise.all(
      activeGroups.map(async (group) => {
        const groupSessions = sessionsByGroup.get(group._id) ?? [];
        const sessionIdSet = new Set(groupSessions.map((s) => s._id));

        const members = await Promise.all(
          (group.memberIds ?? []).map(async (memberId) => {
            const user = await ctx.db.get(memberId);
            if (!user) return null;

            // Get all attendance records for this user, then count by sessionId in JS
            const myAttendance = await ctx.db
              .query("attendance")
              .withIndex("by_user", (q) => q.eq("userId", memberId))
              .take(500);

            const attended = myAttendance.filter(
              (a) => a.status === "coming" && !a.deleted && sessionIdSet.has(a.sessionId)
            ).length;

            return {
              name: user.name ?? user.email ?? "Onbekend",
              totalSessions: groupSessions.length,
              attended,
            };
          })
        );

        return {
          group: { _id: group._id, name: group.name, color: group.color },
          totalSessions: groupSessions.length,
          members: members.filter((m): m is NonNullable<typeof m> => m !== null),
        };
      })
    );
  },
});

// Mark yourself as not attending — only for clients in the session's own group.
// Creates a cancelled record if none exists, so push notifications are suppressed.
export const markAbsent = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const user = await ctx.db.get(userId);
    if (user?.role === "trainer") throw new Error("Trainers cannot mark absence");

    // Only group members may use this — cross-group visitors use RSVP only
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.cancelled) throw new Error("Session not found");
    const group = await ctx.db.get(session.groupId);
    if (!group) throw new Error("Group not found");
    if (!(group.memberIds ?? []).includes(userId)) {
      throw new Error("Not a member of this group");
    }

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { status: "cancelled", deleted: false });
    } else {
      await ctx.db.insert("attendance", {
        sessionId: args.sessionId,
        userId,
        userName: user?.name ?? "Unknown",
        status: "cancelled",
        signedUpAt: Date.now(),
      });
    }
  },
});

// Undo a "niet aanwezig" — soft-deletes the cancelled record, returning client to no_response
export const undoAbsent = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (!existing || existing.status !== "cancelled" || existing.deleted) return;
    await ctx.db.patch(existing._id, { deleted: true });
  },
});

// Trainer — manually set a client's attendance status
export const trainerSetAttendance = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    status: v.union(v.literal("coming"), v.literal("cancelled"), v.literal("no_response")),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.cancelled) throw new Error("Sessie niet gevonden");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Gebruiker niet gevonden");

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", args.userId)
      )
      .unique();

    if (args.status === "no_response") {
      // Soft-delete the record → returns to "no response"
      if (existing && !existing.deleted) {
        await ctx.db.patch(existing._id, { deleted: true });
      }
      return;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        deleted: false,
      });
    } else {
      await ctx.db.insert("attendance", {
        sessionId: args.sessionId,
        userId: args.userId,
        userName: user?.name ?? "Onbekend",
        status: args.status,
        signedUpAt: Date.now(),
      });
    }
  },
});

// Cancel your RSVP for a session
export const cancelRsvp = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (!existing || existing.deleted) return; // nothing to cancel

    await ctx.db.patch(existing._id, { deleted: true });
  },
});
