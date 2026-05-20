import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTrainer } from "./lib";

// All logged-in users can see groups (needed to show group names + colors in agenda)
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const all = await ctx.db.query("groups").take(50);
    return all.filter((g) => !g.cancelled);
  },
});

// Trainer only — create a group
export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    return await ctx.db.insert("groups", {
      name: args.name,
      color: args.color,
      cancelled: false,
    });
  },
});

// Trainer only — update group name or color
export const update = mutation({
  args: {
    id: v.id("groups"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { name: args.name, color: args.color });
  },
});

// Trainer only — soft delete a group
export const remove = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { cancelled: true });
  },
});
