import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time migration: replace Clerk Dev tokenIdentifier prefix with Clerk Production prefix.
 *
 * WHY THIS EXISTS:
 * All Convex records store Clerk's tokenIdentifier as the user identity key.
 * When switching from Clerk Dev → Clerk Production, the prefix changes:
 *   Dev:  https://rested-lobster-9.clerk.accounts.dev|user_XXXXX
 *   Prod: https://<your-prod-domain>|user_XXXXX  (or https://clerk.jollygym.nl|user_XXXXX)
 *
 * Tables affected (all fields that store tokenIdentifiers as strings):
 *   - users.tokenIdentifier       (31 records — primary identity key)
 *   - attendance.userId            (58 records — RSVP records)
 *   - workoutLogs.userId           (all workout log records)
 *   - sessions.createdBy           (all trainer sessions)
 *   - workouts.createdBy           (all trainer workouts)
 *
 * HOW TO RUN (from the-jolly-gym/ directory):
 *
 *   DRY RUN (safe, read-only — do this first!):
 *   npx convex run --prod migrations:migrateTokenIdentifierPrefix \
 *     '{"oldPrefix":"https://rested-lobster-9.clerk.accounts.dev","newPrefix":"YOUR_PROD_PREFIX","dryRun":true}'
 *
 *   LIVE RUN (actually updates Convex — do ONLY after verifying dry run output):
 *   npx convex run --prod migrations:migrateTokenIdentifierPrefix \
 *     '{"oldPrefix":"https://rested-lobster-9.clerk.accounts.dev","newPrefix":"YOUR_PROD_PREFIX","dryRun":false}'
 *
 * FINDING YOUR_PROD_PREFIX:
 *   After creating your Clerk Production instance, go to:
 *   Clerk Dashboard → Configure → Domains
 *   The "Frontend API" URL shown there IS the prefix (without the |user_XXXXX part).
 *   Example: https://clerk.jollygym.nl
 *
 * SAFETY:
 *   - dryRun:true logs what WOULD change without touching anything
 *   - This is an internalMutation — only callable via CLI, never from the browser
 *   - Run dry run first, verify counts match (31 users, 58 attendance, etc), then run live
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
