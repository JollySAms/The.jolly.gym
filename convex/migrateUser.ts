import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time migration: move all data from an old user account to a new one.
 * Migrates: attendance, workoutLogs, group memberIds.
 * Run via Convex dashboard, then delete this file.
 */
export const migrateUserData = internalMutation({
  args: {
    oldEmail: v.string(),
    newEmail: v.string(),
  },
  handler: async (ctx, { oldEmail, newEmail }) => {
    const oldUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", oldEmail))
      .first();
    const newUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", newEmail))
      .first();

    if (!oldUser) throw new Error(`Old user not found: ${oldEmail}`);
    if (!newUser) throw new Error(`New user not found: ${newEmail}`);

    const oldId = oldUser._id;
    const newId = newUser._id;

    // Migrate attendance records
    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", oldId))
      .collect();
    for (const record of attendanceRecords) {
      await ctx.db.patch(record._id, { userId: newId });
    }

    // Migrate workout logs
    const workoutLogs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_and_exercise", (q) => q.eq("userId", oldId))
      .collect();
    for (const log of workoutLogs) {
      await ctx.db.patch(log._id, { userId: newId });
    }

    // Migrate group memberships
    const groups = await ctx.db.query("groups").collect();
    for (const group of groups) {
      if (group.memberIds?.includes(oldId)) {
        const updatedMembers = group.memberIds.map((id) =>
          id === oldId ? newId : id
        );
        await ctx.db.patch(group._id, { memberIds: updatedMembers });
      }
    }

    // Copy role and name to new user if new user is still default
    if (oldUser.role && oldUser.role !== "client" && newUser.role === "client") {
      await ctx.db.patch(newId, { role: oldUser.role });
    }
    if (oldUser.name && oldUser.name !== oldEmail && (!newUser.name || newUser.name === newEmail)) {
      await ctx.db.patch(newId, { name: oldUser.name });
    }

    return {
      migratedAttendance: attendanceRecords.length,
      migratedWorkoutLogs: workoutLogs.length,
      oldId,
      newId,
    };
  },
});
