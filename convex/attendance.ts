import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib";

// Returns all "coming" attendees for a session (for the attendee list in detail view)
export const getForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    return await ctx.db
      .query("attendance")
      .withIndex("by_session_and_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "coming")
      )
      .take(14); // max capacity
  },
});

// Returns the current user's attendance record for a session (to show RSVP state)
export const getMyStatus = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", identity.tokenIdentifier)
      )
      .unique();
  },
});

// Sign up for a session — creates or updates the attendance record
export const rsvp = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Trainers manage sessions, they don't attend them
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
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
        q.eq("sessionId", args.sessionId).eq("userId", identity.tokenIdentifier)
      )
      .unique();

    if (existing?.status === "coming") return; // already signed up, do nothing

    if (coming.length >= session.capacity) throw new Error("Session is full");

    if (existing) {
      // Previously cancelled — reactivate
      await ctx.db.patch(existing._id, {
        status: "coming",
        signedUpAt: Date.now(),
      });
    } else {
      await ctx.db.insert("attendance", {
        sessionId: args.sessionId,
        userId: identity.tokenIdentifier,
        userName: identity.name ?? identity.email ?? "Unknown",
        status: "coming",
        signedUpAt: Date.now(),
      });
    }
  },
});

// Cancel your RSVP for a session
export const cancelRsvp = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", identity.tokenIdentifier)
      )
      .unique();

    if (!existing || existing.status === "cancelled") return; // nothing to cancel

    await ctx.db.patch(existing._id, { status: "cancelled" });
  },
});
