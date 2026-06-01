import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTrainer } from "./lib";

// Called once on login to create the user record if it doesn't exist yet
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? identity.email ?? "Unknown",
      email: identity.email ?? "",
      role: "client", // default; Jolmer's role is set to "trainer" via Convex dashboard
    });
  },
});

// Trainer only — list all client accounts (for progression view, attendance, etc.)
export const listClients = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainer(ctx);
    const all = await ctx.db.query("users").take(200);
    return all.filter((u) => u.role === "client");
  },
});

// Returns the current user's record (role, name, etc.)
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
