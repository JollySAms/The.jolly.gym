import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * ⚠️  DO NOT RUN THIS SCRIPT ⚠️
 *
 * This prefix-only migration was the original plan but is INCORRECT.
 * Reason: when switching Clerk instances (Dev → Production), Clerk assigns
 * BRAND NEW user IDs. So swapping only the prefix still leaves the wrong
 * user_XXXXX suffix, and no one can log in.
 *
 * THE CORRECT APPROACH is in convex/users.ts — ensureUser now automatically
 * migrates each user by email on their first login to the new Clerk Production
 * instance. No manual script needed.
 *
 * This file is kept only for reference/history. It is safe to delete.
 */
export const migrateTokenIdentifierPrefix = internalMutation({
  args: {
    oldPrefix: v.string(), // e.g. "https://rested-lobster-9.clerk.accounts.dev"
    newPrefix: v.string(), // e.g. "https://clerk.jollygym.nl"
    dryRun: v.boolean(),   // true = log only, false = actually update
  },
  handler: async (ctx, { oldPrefix, newPrefix, dryRun }) => {
    const results = {
      dryRun,
      oldPrefix,
      newPrefix,
      users: 0,
      attendance: 0,
      workoutLogs: 0,
      sessions: 0,
      workouts: 0,
      skipped: 0,
    };

    // ── 1. users.tokenIdentifier ────────────────────────────────────────
    const allUsers = await ctx.db.query("users").collect();
    for (const user of allUsers) {
      if (user.tokenIdentifier.startsWith(oldPrefix)) {
        const updated = user.tokenIdentifier.replace(oldPrefix, newPrefix);
        if (!dryRun) {
          await ctx.db.patch(user._id, { tokenIdentifier: updated });
        }
        results.users++;
        console.log(`[users] ${user.email}: ${user.tokenIdentifier} → ${updated}`);
      } else {
        results.skipped++;
      }
    }

    // ── 2. attendance.userId ────────────────────────────────────────────
    const allAttendance = await ctx.db.query("attendance").collect();
    for (const record of allAttendance) {
      if (record.userId.startsWith(oldPrefix)) {
        const updated = record.userId.replace(oldPrefix, newPrefix);
        if (!dryRun) {
          await ctx.db.patch(record._id, { userId: updated });
        }
        results.attendance++;
      } else {
        results.skipped++;
      }
    }

    // ── 3. workoutLogs.userId ────────────────────────────────────────────
    const allLogs = await ctx.db.query("workoutLogs").collect();
    for (const log of allLogs) {
      if (log.userId.startsWith(oldPrefix)) {
        const updated = log.userId.replace(oldPrefix, newPrefix);
        if (!dryRun) {
          await ctx.db.patch(log._id, { userId: updated });
        }
        results.workoutLogs++;
      } else {
        results.skipped++;
      }
    }

    // ── 4. sessions.createdBy ────────────────────────────────────────────
    const allSessions = await ctx.db.query("sessions").collect();
    for (const session of allSessions) {
      if (session.createdBy.startsWith(oldPrefix)) {
        const updated = session.createdBy.replace(oldPrefix, newPrefix);
        if (!dryRun) {
          await ctx.db.patch(session._id, { createdBy: updated });
        }
        results.sessions++;
      } else {
        results.skipped++;
      }
    }

    // ── 5. workouts.createdBy ────────────────────────────────────────────
    const allWorkouts = await ctx.db.query("workouts").collect();
    for (const workout of allWorkouts) {
      if (workout.createdBy.startsWith(oldPrefix)) {
        const updated = workout.createdBy.replace(oldPrefix, newPrefix);
        if (!dryRun) {
          await ctx.db.patch(workout._id, { createdBy: updated });
        }
        results.workouts++;
      } else {
        results.skipped++;
      }
    }

    console.log("\n=== MIGRATION SUMMARY ===");
    console.log(JSON.stringify(results, null, 2));
    console.log(dryRun ? "✅ DRY RUN COMPLETE — no data was changed" : "✅ LIVE RUN COMPLETE — data has been updated");

    return results;
  },
});
