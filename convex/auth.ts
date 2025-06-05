import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    afterUserCreatedOrUpdated: async (ctx, args) => {
      await ctx.db.patch(args.userId, { role: "user" });
    },
  },
});
