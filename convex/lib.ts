import { QueryCtx } from "./_generated/server";

// Shared helper — verifies the caller is the trainer.
// Can be called from both queries and mutations since MutationCtx extends QueryCtx.
export async function requireTrainer(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  // Try by tokenIdentifier first
  let user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  // Fallback: find by email (before tokenIdentifier migration runs)
  if (!user && identity.email) {
    user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
  }

  if (!user || user.role !== "trainer") {
    throw new Error("Trainer access required");
  }

  return user;
}

// Verifies any logged-in user and returns their identity.
export async function requireAuth(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}
