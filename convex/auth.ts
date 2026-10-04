import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { redirectDestination } from "../lib/siteUrl";
import { createOrUpdateUser, type CreateOrUpdateUserArgs } from "./googleAccount";
import type { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Google],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectDestination(redirectTo);
    },
    async createOrUpdateUser(ctx, args) {
      const linkingArgs: CreateOrUpdateUserArgs = {
        existingUserId: args.existingUserId,
        sessionId: args.sessionId ?? null,
        type: args.type,
        provider: args.provider,
        profile: args.profile,
        shouldLinkViaEmail:
          "shouldLinkViaEmail" in args && args.shouldLinkViaEmail === true ? true : undefined,
        shouldLinkViaPhone:
          "shouldLinkViaPhone" in args && args.shouldLinkViaPhone === true ? true : undefined,
      };
      return await createOrUpdateUser(ctx as MutationCtx, linkingArgs);
    },
  },
});
