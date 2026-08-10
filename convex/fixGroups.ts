import { internalMutation } from "./_generated/server";

/**
 * One-time fix: remove duplicate memberIds from all groups.
 * Run via CLI, then delete this file.
 */
export const deduplicateMembers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    const results = [];
    for (const group of groups) {
      if (!group.memberIds) continue;
      const unique = [...new Set(group.memberIds)];
      if (unique.length < group.memberIds.length) {
        await ctx.db.patch(group._id, { memberIds: unique });
        results.push({
          group: group.name,
          before: group.memberIds.length,
          after: unique.length,
        });
      }
    }
    return results;
  },
});
