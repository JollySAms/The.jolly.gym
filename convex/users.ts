import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTrainer } from "./lib";

// Called from the client after sign-in to ensure the user's tokenIdentifier
// is up to date and all related records are migrated
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    const email = identity.email ?? "";
    const name = identity.name ?? "";

    // 1. Already has the correct tokenIdentifier — nothing to do
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (existing) return existing._id;

    // 2. Find by email and migrate tokenIdentifier + related records
    const oldUser = email
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first()
      : null;

    if (oldUser) {
      const oldToken = oldUser.tokenIdentifier;
      const newToken = tokenIdentifier;

      // Update user record
      await ctx.db.patch(oldUser._id, { tokenIdentifier: newToken });

      // Only migrate related records if there was an old token to replace
      if (oldToken && oldToken !== newToken) {
        // Update attendance records
        const attendanceRecords = await ctx.db
          .query("attendance")
          .withIndex("by_user", (q) => q.eq("userId", oldToken))
          .collect();
        for (const record of attendanceRecords) {
          await ctx.db.patch(record._id, { userId: newToken });
        }

        // Update workout logs
        const allLogs = await ctx.db.query("workoutLogs").collect();
        for (const log of allLogs) {
          if (log.userId === oldToken) {
            await ctx.db.patch(log._id, { userId: newToken });
          }
        }

        // Update sessions
        const allSessions = await ctx.db.query("sessions").collect();
        for (const session of allSessions) {
          if (session.createdBy === oldToken) {
            await ctx.db.patch(session._id, { createdBy: newToken });
          }
        }

        // Update workouts
        const allWorkouts = await ctx.db.query("workouts").collect();
        for (const workout of allWorkouts) {
          if (workout.createdBy === oldToken) {
            await ctx.db.patch(workout._id, { createdBy: newToken });
          }
        }
      }

      return oldUser._id;
    }

    // 3. Brand new user — shouldn't normally happen since createOrUpdateUser
    // in auth.ts handles creation, but just in case
    return await ctx.db.insert("users", {
      tokenIdentifier,
      name: name || email,
      email,
      role: "client",
    });
  },
});

// Trainer only — list all client accounts
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

// Returns the current user's record
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Try by tokenIdentifier first
    const byToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (byToken) return byToken;

    // Fallback: find by email (before tokenIdentifier migration runs)
    if (identity.email) {
      return await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email!))
        .first();
    }

    return null;
  },
});
