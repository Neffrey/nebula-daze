import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const linkWindowMs = 10 * 60 * 1000;

type AccountProfile = {
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  name?: string;
  image?: string;
};

export type CreateOrUpdateUserArgs = {
  existingUserId: Id<"users"> | null;
  sessionId?: Id<"authSessions"> | null;
  type: "oauth" | "credentials" | "email" | "phone" | "verification";
  provider: {
    id: string;
    type: string;
    allowDangerousEmailAccountLinking?: boolean;
  };
  profile: Record<string, unknown> & AccountProfile;
  shouldLinkViaEmail?: boolean;
  shouldLinkViaPhone?: boolean;
};

export async function createOrUpdateUser(
  ctx: MutationCtx,
  args: CreateOrUpdateUserArgs,
): Promise<Id<"users">> {
  const linkedUserId = await googleLinkTarget(ctx, args);
  if (linkedUserId !== null) {
    return linkedUserId;
  }
  return await upsertDefaultUser(ctx, args);
}

export async function prepareGoogleLink(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "google"))
    .take(1);
  if (existing.length > 0) {
    throw new Error("Google is already linked");
  }

  const previous = await ctx.db
    .query("googleLinkIntents")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(5);
  for (const intent of previous) {
    await ctx.db.delete("googleLinkIntents", intent._id);
  }
  await ctx.db.insert("googleLinkIntents", {
    userId,
    expiresAt: Date.now() + linkWindowMs,
  });
}

async function googleLinkTarget(ctx: MutationCtx, args: CreateOrUpdateUserArgs) {
  if (args.type !== "oauth" || args.provider.id !== "google" || args.sessionId == null) {
    return null;
  }
  const session = await ctx.db.get("authSessions", args.sessionId);
  if (session === null) {
    return null;
  }
  const intents = await ctx.db
    .query("googleLinkIntents")
    .withIndex("by_userId", (q) => q.eq("userId", session.userId))
    .take(5);
  const active = intents.find((intent) => intent.expiresAt > Date.now());
  if (active === undefined) {
    return null;
  }
  if (args.existingUserId !== null && args.existingUserId !== session.userId) {
    throw new Error("This Google account is already used by another profile");
  }
  const linked = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", session.userId).eq("provider", "google"),
    )
    .take(1);
  if (linked.length > 0 && args.existingUserId !== session.userId) {
    throw new Error("Google is already linked");
  }
  for (const intent of intents) {
    await ctx.db.delete("googleLinkIntents", intent._id);
  }
  return session.userId;
}

async function upsertDefaultUser(ctx: MutationCtx, args: CreateOrUpdateUserArgs) {
  const {
    provider,
    profile: { emailVerified: profileEmailVerified, phoneVerified: profilePhoneVerified, ...profile },
  } = args;
  const emailVerified =
    profileEmailVerified ??
    ((provider.type === "oauth" || provider.type === "oidc") &&
      provider.allowDangerousEmailAccountLinking !== false);
  const phoneVerified = profilePhoneVerified ?? false;
  const shouldLinkViaEmail = args.shouldLinkViaEmail === true || emailVerified || provider.type === "email";
  const shouldLinkViaPhone = args.shouldLinkViaPhone === true || phoneVerified || provider.type === "phone";

  let userId = args.existingUserId;
  if (userId === null) {
    const emailMatch =
      typeof profile.email === "string" && shouldLinkViaEmail
        ? await uniqueVerifiedUser(ctx, "email", profile.email)
        : null;
    const phoneMatch =
      typeof profile.phone === "string" && shouldLinkViaPhone
        ? await uniqueVerifiedUser(ctx, "phone", profile.phone)
        : null;
    if (emailMatch !== null && phoneMatch !== null && emailMatch !== phoneMatch) {
      userId = null;
    } else {
      userId = emailMatch ?? phoneMatch;
    }
  }

  const userData = profileFields(profile, emailVerified, phoneVerified);
  if (userId !== null) {
    const password = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
      .take(1);
    if (password.length === 0) {
      await ctx.db.patch("users", userId, userData);
    }
    return userId;
  }
  return await ctx.db.insert("users", userData);
}

function profileFields(
  profile: Omit<AccountProfile, "emailVerified" | "phoneVerified">,
  emailVerified: boolean,
  phoneVerified: boolean,
) {
  return {
    ...(emailVerified ? { emailVerificationTime: Date.now() } : {}),
    ...(phoneVerified ? { phoneVerificationTime: Date.now() } : {}),
    ...(typeof profile.email === "string" ? { email: profile.email } : {}),
    ...(typeof profile.name === "string" ? { name: profile.name } : {}),
    ...(typeof profile.image === "string" ? { image: profile.image } : {}),
    ...(typeof profile.phone === "string" ? { phone: profile.phone } : {}),
  };
}

async function uniqueVerifiedUser(
  ctx: MutationCtx,
  field: "email" | "phone",
  value: string,
) {
  const matches =
    field === "email"
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", value))
          .take(5)
      : await ctx.db
          .query("users")
          .withIndex("phone", (q) => q.eq("phone", value))
          .take(5);
  const verified = matches.filter((user) =>
    field === "email" ? user.emailVerificationTime !== undefined : user.phoneVerificationTime !== undefined,
  );
  const match = verified[0];
  return verified.length === 1 && match !== undefined ? match._id : null;
}
