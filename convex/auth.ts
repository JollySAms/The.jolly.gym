import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./ResendOTP";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      // Returning user — already linked to an auth account
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // First-time sign-in: try to find existing user by email
      const email = args.profile.email;
      if (email) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();

        if (existingUser) {
          // Link existing user to new auth account — preserves role and all data
          return existingUser._id;
        }
      }

      // Brand new user — default to client role
      return await ctx.db.insert("users", {
        email: email ?? undefined,
        name: email ?? "Nieuw lid",
        role: "client",
      });
    },
  },
});
