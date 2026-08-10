import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuth, requireTrainer } from "./lib";

// Helper — fetch the workout and return a frozen snapshot of its exercises
async function buildSnapshot(ctx: QueryCtx, workoutId: Id<"workouts">) {
  const workout = await ctx.db.get(workoutId);
  if (!workout) throw new Error("Workout niet gevonden");
  // Return a plain copy — this freezes the exercise list at assignment time
  return workout.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    name: e.name,
    sets: e.sets,
  }));
}

// Returns all active sessions for a given month with group info + attendance count.
// Used to render calendar dots and the day session list.
export const listByMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // 1–12
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const mm = String(args.month).padStart(2, "0");
    const startDate = `${args.year}-${mm}-01`;
    const endDate = `${args.year}-${mm}-31`; // safe upper bound for any month

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).gte("date", startDate).lte("date", endDate)
      )
      .take(200);

    return await Promise.all(sessions.map((s) => enrichSession(ctx, s)));
  },
});

// Returns active sessions for a specific date with group info + attendance count.
export const listByDate = query({
  args: {
    date: v.string(), // "2026-05-20"
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).eq("date", args.date)
      )
      .take(20);

    return await Promise.all(sessions.map((s) => enrichSession(ctx, s)));
  },
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validateDateAndTime(date: string, time: string) {
  if (!DATE_RE.test(date)) throw new Error("Ongeldig datumformaat — verwacht JJJJ-MM-DD");
  if (!TIME_RE.test(time)) throw new Error("Ongeldig tijdformaat — verwacht UU:MM");
}

// Trainer only — create a session
export const create = mutation({
  args: {
    date: v.string(),
    time: v.string(),
    groupId: v.id("groups"),
    workoutId: v.optional(v.id("workouts")),
  },
  handler: async (ctx, args) => {
    validateDateAndTime(args.date, args.time);
    const trainer = await requireTrainer(ctx);
    const snapshot = args.workoutId ? await buildSnapshot(ctx as QueryCtx, args.workoutId) : undefined;
    return await ctx.db.insert("sessions", {
      date: args.date,
      time: args.time,
      groupId: args.groupId,
      capacity: 14,
      cancelled: false,
      createdBy: trainer._id,
      workoutId: args.workoutId,
      workoutSnapshot: snapshot,
    });
  },
});

// Trainer only — edit a session
export const update = mutation({
  args: {
    id: v.id("sessions"),
    date: v.string(),
    time: v.string(),
    groupId: v.id("groups"),
    workoutId: v.optional(v.id("workouts")),
  },
  handler: async (ctx, args) => {
    validateDateAndTime(args.date, args.time);
    await requireTrainer(ctx);
    const snapshot = args.workoutId ? await buildSnapshot(ctx as QueryCtx, args.workoutId) : undefined;
    await ctx.db.patch(args.id, {
      date: args.date,
      time: args.time,
      groupId: args.groupId,
      workoutId: args.workoutId,
      workoutSnapshot: snapshot,
    });
  },
});

// Trainer only — create multiple sessions on the same weekday for N consecutive weeks.
// Skips any week where a session with the same date + time + group already exists.
// Returns the number of sessions actually created.
export const createBatch = mutation({
  args: {
    date: v.string(),    // start date "YYYY-MM-DD"
    time: v.string(),
    groupId: v.id("groups"),
    weeks: v.number(),   // 1–52
    workoutId: v.optional(v.id("workouts")),
  },
  handler: async (ctx, args) => {
    validateDateAndTime(args.date, args.time);
    const trainer = await requireTrainer(ctx);

    if (args.weeks < 1 || args.weeks > 52) {
      throw new Error("Aantal weken moet tussen 1 en 52 liggen");
    }

    // Fetch snapshot once — same workout assigned to all sessions in the batch
    const snapshot = args.workoutId ? await buildSnapshot(ctx as QueryCtx, args.workoutId) : undefined;

    // Parse start date as UTC midnight to avoid timezone drift
    const [y, m, d] = args.date.split("-").map(Number);
    const start = Date.UTC(y, m - 1, d);
    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

    let created = 0;
    for (let i = 0; i < args.weeks; i++) {
      const ts = start + i * MS_PER_WEEK;
      const dateStr = new Date(ts).toISOString().slice(0, 10);

      // Skip if a session already exists for this date + time + group
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_cancelled_and_date", (q) =>
          q.eq("cancelled", false).eq("date", dateStr)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("time"), args.time),
            q.eq(q.field("groupId"), args.groupId)
          )
        )
        .first();

      if (existing) continue;

      await ctx.db.insert("sessions", {
        date: dateStr,
        time: args.time,
        groupId: args.groupId,
        capacity: 14,
        cancelled: false,
        createdBy: trainer._id,
        workoutId: args.workoutId,
        workoutSnapshot: snapshot,
      });
      created++;
    }

    return created;
  },
});

// Trainer only — soft delete a session
export const cancel = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { cancelled: true });
  },
});

// Returns all upcoming sessions (today onwards) for all groups.
// Used by the client agenda — includes each session's group, attendance count,
// workout name, and the current user's own RSVP status.
export const listUpcoming = query({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await requireAuth(ctx);
    const today = new Date().toISOString().slice(0, 10);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).gte("date", today)
      )
      .take(500);

    return await Promise.all(
      sessions.map((s) => enrichSessionForClient(ctx, s, userId))
    );
  },
});

// Returns the client's single most relevant upcoming session:
// 1. Earliest session they have RSVP'd "coming" to
// 2. Fallback: next session in their own group
export const getMyNextSession = query({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await requireAuth(ctx);
    const today = new Date().toISOString().slice(0, 10);

    // All attendance records for this user
    const myAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(200);

    const comingAttendance = myAttendance.filter((a) => a.status === "coming" && !a.deleted);

    // Fetch those sessions and keep only future, non-cancelled ones
    const rsvpdSessions = (
      await Promise.all(comingAttendance.map((a) => ctx.db.get(a.sessionId)))
    ).filter((s) => s !== null && !s.cancelled && s.date >= today);

    if (rsvpdSessions.length > 0) {
      // Sort by date then time, take the earliest
      const next = rsvpdSessions.sort(
        (a, b) => a!.date.localeCompare(b!.date) || a!.time.localeCompare(b!.time)
      )[0]!;
      const enriched = await enrichSessionForClient(ctx, next, userId);
      return enriched;
    }

    // Fallback: find this user's group and return its next session
    const me = await ctx.db.get(userId);
    if (!me) return null;

    // Scan groups to find the one this user belongs to
    const allGroups = await ctx.db.query("groups").take(100);
    const myGroup = allGroups.find((g) => g.memberIds?.includes(me._id));
    if (!myGroup) return null;

    const nextGroupSession = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).gte("date", today)
      )
      .filter((q) => q.eq(q.field("groupId"), myGroup._id))
      .first();

    if (!nextGroupSession) return null;
    return enrichSessionForClient(ctx, nextGroupSession, userId);
  },
});

// Internal helper — joins session with its group and attendance count
async function enrichSession(ctx: QueryCtx, session: Doc<"sessions">) {
  const group = await ctx.db.get(session.groupId);
  const comingRaw = await ctx.db
    .query("attendance")
    .withIndex("by_session_and_status", (q) =>
      q.eq("sessionId", session._id).eq("status", "coming")
    )
    .take(session.capacity + 10); // capacity (14) + headroom for cross-group guests

  const coming = comingRaw.filter((a) => !a.deleted);

  return {
    ...session,
    group,
    attendanceCount: coming.length,
  };
}

// Client-facing enrichment — adds workout name, the user's own RSVP status, and group membership flag
async function enrichSessionForClient(
  ctx: QueryCtx,
  session: Doc<"sessions">,
  userId: Id<"users">
) {
  const group = await ctx.db.get(session.groupId);

  const comingRaw = await ctx.db
    .query("attendance")
    .withIndex("by_session_and_status", (q) =>
      q.eq("sessionId", session._id).eq("status", "coming")
    )
    .take(session.capacity + 10); // capacity (14) + headroom for cross-group guests

  const coming = comingRaw.filter((a) => !a.deleted);

  const myAttendance = await ctx.db
    .query("attendance")
    .withIndex("by_session_and_user", (q) =>
      q.eq("sessionId", session._id).eq("userId", userId)
    )
    .unique();

  // Soft-deleted record means the client undid their "niet aanwezig" → treat as no response
  const myStatus = myAttendance?.deleted ? null : (myAttendance?.status ?? null);

  // Check group membership directly by userId
  const isGroupMember = (group?.memberIds ?? []).includes(userId);

  // Fetch workout name from the template (not the snapshot, which has no name)
  let workoutName: string | null = null;
  if (session.workoutId) {
    const workout = await ctx.db.get(session.workoutId);
    workoutName = workout?.name ?? null;
  }

  return {
    ...session,
    group,
    attendanceCount: coming.length,
    myStatus,
    workoutName,
    isGroupMember,
  };
}
