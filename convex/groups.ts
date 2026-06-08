import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTrainer } from "./lib";
import { Id } from "./_generated/dataModel";

// All logged-in users can see groups (needed to show group names + colors in agenda)
// Returns only safe fields — member user documents are NOT included to avoid
// exposing client email addresses to other clients.
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const all = await ctx.db.query("groups").take(50);
    const active = all.filter((g) => !g.cancelled);
    return active.map((g) => ({ ...g, memberIds: g.memberIds ?? [] }));
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
      memberIds: [],
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

// Trainer only — add a client to a group
export const addMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Groep niet gevonden");
    const current = group.memberIds ?? [];
    if (current.includes(args.userId)) return; // already a member
    await ctx.db.patch(args.groupId, { memberIds: [...current, args.userId] });
  },
});

// Trainer only — remove a client from a group
export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Groep niet gevonden");
    const current = group.memberIds ?? [];
    await ctx.db.patch(args.groupId, {
      memberIds: current.filter((id: Id<"users">) => id !== args.userId),
    });
  },
});

// Trainer only — list all clients (role === "client"), used for member picker
export const listClients = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainer(ctx);
    const all = await ctx.db.query("users").take(100);
    return all.filter((u) => u.role === "client");
  },
});
