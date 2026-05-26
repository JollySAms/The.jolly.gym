import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireTrainer } from "./lib";

// Validator matching the schema — reused in args
const exerciseEntryValidator = v.object({
  exerciseId: v.id("exercises"),
  name: v.string(),
  sets: v.number(),
});

// Trainer only — list all active workout templates
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainer(ctx);
    return await ctx.db
      .query("workouts")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .take(200);
  },
});

// Trainer only — get a single workout (used when assigning to a session)
export const get = query({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    return await ctx.db.get(args.id);
  },
});

// Trainer only — create a new workout template
export const create = mutation({
  args: {
    name: v.string(),
    exercises: v.array(exerciseEntryValidator),
  },
  handler: async (ctx, args) => {
    const trainer = await requireTrainer(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Naam mag niet leeg zijn");
    return await ctx.db.insert("workouts", {
      name: trimmed,
      exercises: args.exercises,
      archived: false,
      createdBy: trainer.tokenIdentifier,
    });
  },
});

// Trainer only — update a workout template (does NOT affect past sessions — those use a snapshot)
export const update = mutation({
  args: {
    id: v.id("workouts"),
    name: v.string(),
    exercises: v.array(exerciseEntryValidator),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Naam mag niet leeg zijn");
    await ctx.db.patch(args.id, {
      name: trimmed,
      exercises: args.exercises,
    });
  },
});

// Trainer only — soft-delete a workout template
export const archive = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { archived: true });
  },
});
