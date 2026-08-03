import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTrainer } from "./lib";
import { internal } from "./_generated/api";

// Internal mutation that does the actual DB writes after email is fetched from Clerk
export const migrateOrCreateUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { tokenIdentifier, email, name }) => {
    // 1. Already migrated or existing Production user
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (existing) return existing._id;

    // 2. Migration path: find old record by email
    const oldUser = email
      ? await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), email))
          .first()
      : null;

    if (oldUser) {
      const oldToken = oldUser.tokenIdentifier;
      const newToken = tokenIdentifier;

      await ctx.db.patch(oldUser._id, { tokenIdentifier: newToken });

      const attendanceRecords = await ctx.db
        .query("attendance")
        .withIndex("by_user", (q) => q.eq("userId", oldToken))
        .collect();
      for (const record of attendanceRecords) {
        await ctx.db.patch(record._id, { userId: newToken });
      }

      const allLogs = await ctx.db.query("workoutLogs").collect();
      for (const log of allLogs) {
        if (log.userId === oldToken) {
          await ctx.db.patch(log._id, { userId: newToken });
        }
      }

      const allSessions = await ctx.db.query("sessions").collect();
      for (const session of allSessions) {
        if (session.createdBy === oldToken) {
          await ctx.db.patch(session._id, { createdBy: newToken });
        }
      }

      const allWorkouts = await ctx.db.query("workouts").collect();
      for (const workout of allWorkouts) {
        if (workout.createdBy === oldToken) {
          await ctx.db.patch(workout._id, { createdBy: newToken });
        }
      }

      return oldUser._id;
    }

    // 3. Brand new user
    return await ctx.db.insert("users", {
      tokenIdentifier,
      name,
      email,
      role: "client",
    });
  },
});

// Action: fetches email from Clerk API, then calls migrateOrCreateUser
export const ensureUser = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    let email = identity.email ?? "";
    let name = identity.name ?? "";

    // If email not in token, fetch from Clerk API using the user ID
    if (!email) {
      const userId = identity.subject; // the `sub` claim = Clerk user ID
      const clerkSecret = process.env.CLERK_SECRET_KEY;
      if (clerkSecret) {
        const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          headers: { Authorization: `Bearer ${clerkSecret}` },
        });
        if (res.ok) {
          const data = await res.json();
          email = data.email_addresses?.[0]?.email_address ?? "";
          name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || email;
        }
      }
    }

    return await ctx.runMutation(internal.users.migrateOrCreateUser, {
      tokenIdentifier,
      email,
      name,
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

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});
