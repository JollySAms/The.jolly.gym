import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTrainer } from "./lib";

// Called once on login to create the user record if it doesn't exist yet.
// Also handles the one-time migration from Clerk Dev → Clerk Production:
// When switching Clerk instances, user IDs change but emails stay the same.
// On first login to the new instance, we find the old record by email and
// update all tokenIdentifier references across every table.
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Normal path: already migrated or new Production user
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existing) return existing._id;

    // 2. Migration path: find old record by email (Clerk Dev → Production switch)
    const email = identity.email ?? "";
    const oldUser = email
      ? await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), email))
          .first()
      : null;

    if (oldUser) {
      const oldToken = oldUser.tokenIdentifier;
      const newToken = identity.tokenIdentifier;

      // Update users.tokenIdentifier
      await ctx.db.patch(oldUser._id, { tokenIdentifier: newToken });

      // Update attendance.userId (has by_user index)
      const attendanceRecords = await ctx.db
        .query("attendance")
        .withIndex("by_user", (q) => q.eq("userId", oldToken))
        .collect();
      for (const record of attendanceRecords) {
        await ctx.db.patch(record._id, { userId: newToken });
      }

      // Update workoutLogs.userId (full scan — small table, one-time per user)
      const allLogs = await ctx.db.query("workoutLogs").collect();
      for (const log of allLogs) {
        if (log.userId === oldToken) {
          await ctx.db.patch(log._id, { userId: newToken });
        }
      }

      // Update sessions.createdBy (trainer only — small number of records)
      const allSessions = await ctx.db.query("sessions").collect();
      for (const session of allSessions) {
        if (session.createdBy === oldToken) {
          await ctx.db.patch(session._id, { createdBy: newToken });
        }
      }

      // Update workouts.createdBy (trainer only)
      const allWorkouts = await ctx.db.query("workouts").collect();
      for (const workout of allWorkouts) {
        if (workout.createdBy === oldToken) {
          await ctx.db.patch(workout._id, { createdBy: newToken });
        }
      }

      return oldUser._id;
    }

    // 3. Brand new user: create fresh record
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? email ?? "Unknown",
      email,
      role: "client", // default; Jolmer's role is set to "trainer" via Convex dashboard
    });
  },
});

// Trainer only — list all client accounts (for progression view, attendance, etc.)
export const listClients = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainer(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "client"))
      .take(200);
  },
});

// Returns the current user's record (role, name, etc.)
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});
