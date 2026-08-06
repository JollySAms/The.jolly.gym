import { internalMutation } from "./_generated/server";

// One-time migration: update userId fields from Clerk tokenIdentifier format
// to Convex user _id. Run this once after deploying the Convex Auth switch.
// Usage: npx convex run migrations:migrateUserIds --prod
export const migrateUserIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Build a lookup map: old Clerk tokenIdentifier → user _id
    const allUsers = await ctx.db.query("users").collect();
    const tokenToId = new Map<string, string>();
    for (const user of allUsers) {
      if (user.tokenIdentifier && user.tokenIdentifier.includes("clerk")) {
        tokenToId.set(user.tokenIdentifier, user._id);
      }
    }

    if (tokenToId.size === 0) {
      console.log("No users with Clerk tokenIdentifiers found — nothing to migrate");
      return;
    }

    console.log(`Found ${tokenToId.size} users with Clerk tokenIdentifiers`);

    // Migrate attendance records
    let attendanceMigrated = 0;
    const allAttendance = await ctx.db.query("attendance").collect();
    for (const record of allAttendance) {
      const newUserId = tokenToId.get(record.userId);
      if (newUserId) {
        await ctx.db.patch(record._id, { userId: newUserId });
        attendanceMigrated++;
      }
    }

    // Migrate workout logs
    let logsMigrated = 0;
    const allLogs = await ctx.db.query("workoutLogs").collect();
    for (const log of allLogs) {
      const newUserId = tokenToId.get(log.userId);
      if (newUserId) {
        await ctx.db.patch(log._id, { userId: newUserId });
        logsMigrated++;
      }
    }

    // Migrate sessions (createdBy)
    let sessionsMigrated = 0;
    const allSessions = await ctx.db.query("sessions").collect();
    for (const session of allSessions) {
      const newCreatedBy = tokenToId.get(session.createdBy);
      if (newCreatedBy) {
        await ctx.db.patch(session._id, { createdBy: newCreatedBy });
        sessionsMigrated++;
      }
    }

    // Migrate workouts (createdBy)
    let workoutsMigrated = 0;
    const allWorkouts = await ctx.db.query("workouts").collect();
    for (const workout of allWorkouts) {
      const newCreatedBy = tokenToId.get(workout.createdBy);
      if (newCreatedBy) {
        await ctx.db.patch(workout._id, { createdBy: newCreatedBy });
        workoutsMigrated++;
      }
    }

    console.log(
      `Migration complete: ${attendanceMigrated} attendance, ${logsMigrated} logs, ${sessionsMigrated} sessions, ${workoutsMigrated} workouts`
    );
  },
});
