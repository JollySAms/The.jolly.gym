import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireTrainer } from "./lib";

// Called from the client after sign-in — now a no-op since
// Convex Auth links users directly via createOrUpdateUser callback.
// Kept for backwards compatibility with existing client code.
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return userId;
  },
});

// Trainer only — list all client accounts
export const listClients = query({
  args: {},
  handler: async (ctx) => {
    await requireTrainer(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "client"))
      .take(200);
  },
});

// Returns the current user's record
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
