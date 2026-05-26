import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTrainer } from "./lib";

// All logged-in users can list active exercises (clients need this to pick substitutes)
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("exercises")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .take(500);
  },
});

// Trainer only — add a new exercise to the library
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Naam mag niet leeg zijn");
    return await ctx.db.insert("exercises", {
      name: trimmed,
      archived: false,
    });
  },
});

// Trainer only — rename an exercise
export const update = mutation({
  args: {
    id: v.id("exercises"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Naam mag niet leeg zijn");
    await ctx.db.patch(args.id, { name: trimmed });
  },
});

// Trainer only — soft-delete an exercise
export const archive = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { archived: true });
  },
});
