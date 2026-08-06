import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx } from "./_generated/server";

// Shared helper — verifies the caller is the trainer.
// Can be called from both queries and mutations since MutationCtx extends QueryCtx.
export async function requireTrainer(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const user = await ctx.db.get(userId);
  if (!user || user.role !== "trainer") {
    throw new Error("Trainer access required");
  }

  return user;
}

// Verifies any logged-in user and returns their user ID (from Convex Auth).
export async function requireAuth(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
