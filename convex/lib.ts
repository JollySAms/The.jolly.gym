import { QueryCtx } from "./_generated/server";

// Shared helper — verifies the caller is the trainer.
// Can be called from both queries and mutations since MutationCtx extends QueryCtx.
export async function requireTrainer(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

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
