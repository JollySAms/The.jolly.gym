import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./ResendOTP";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
  session: {
    // Keep sessions alive for 1 year (default is 30 days)
    totalDurationMs: 1000 * 60 * 60 * 24 * 365,
    // Inactive sessions expire after 90 days without opening the app
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 90,
  },
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      // Returning user — already linked to an auth account
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // First-time sign-in: try to find existing user by email
      const email = ((args.profile.email as string | undefined) || undefined)?.toLowerCase()?.trim();
      if (email) {
        // Try exact match via index first
        let existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();

        // Fallback: case-insensitive scan (handles "Casper@" vs "casper@")
        if (!existingUser) {
          const allUsers = await ctx.db.query("users").collect();
          existingUser = allUsers.find(
            (u) => u.email?.toLowerCase() === email
          ) ?? null;
        }

        if (existingUser) {
          // Normalize stored email to lowercase for future lookups
          if (existingUser.email !== email) {
            await ctx.db.patch(existingUser._id, { email });
          }
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
