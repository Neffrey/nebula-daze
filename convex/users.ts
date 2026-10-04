import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { prepareGoogleLink as prepareGoogleLinkForUser } from "./googleAccount";

const viewerValidator = v.object({
  name: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});

const addressValidator = v.object({
  _id: v.id("addresses"),
  label: v.string(),
  addressLine: v.string(),
  city: v.string(),
  postalCode: v.string(),
  isDefault: v.boolean(),
});

const profileValidator = v.object({
  displayName: v.union(v.string(), v.null()),
  name: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  phone: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
  addresses: v.array(addressValidator),
  linkedAccounts: v.array(v.object({ provider: v.string() })),
});

const maxPhotoUrlLength = 500;

export const viewer = query({
  args: {},
  returns: v.union(viewerValidator, v.null()),
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (user === null) {
      return null;
    }

    return {
      name: user.name ?? null,
      email: user.email ?? null,
      image: await profileImage(ctx, user),
    };
  },
});

export const profile = query({
  args: {},
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (user === null) {
      return null;
    }

    const addresses = (
      await ctx.db
        .query("addresses")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .take(8)
    ).sort((left, right) => Number(right.isDefault === true) - Number(left.isDefault === true));
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
      .take(5);

    return {
      displayName: user.displayName ?? null,
      name: user.name ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      image: await profileImage(ctx, user),
      addresses: addresses.map((address) => ({
        _id: address._id,
        label: address.label,
        addressLine: address.addressLine,
        city: address.city,
        postalCode: address.postalCode,
        isDefault: address.isDefault === true,
      })),
      linkedAccounts: accounts.map((account) => ({ provider: account.provider })),
    };
  },
});

export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch("users", user._id, {
      displayName: optionalText(args.displayName, "Display name", 40),
    });
    return null;
  },
});

export const updateName = mutation({
  args: { name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch("users", user._id, {
      name: optionalText(args.name, "Name", 80),
    });
    return null;
  },
});

export const saveProfilePhoto = mutation({
  args: { url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const photoUrl = uploadthingPhotoUrl(args.url);
    if (user.imageId !== undefined) {
      await ctx.storage.delete(user.imageId);
    }
    await ctx.db.patch("users", user._id, {
      photoUrl,
      imageId: undefined,
    });
    return null;
  },
});

export const removeImage = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.imageId !== undefined) {
      await ctx.storage.delete(user.imageId);
    }
    await ctx.db.patch("users", user._id, {
      imageId: undefined,
      image: undefined,
      photoUrl: undefined,
    });
    return null;
  },
});

export const updateEmail = mutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const email = normalizeEmail(args.email);
    if (email === user.email) {
      return null;
    }
    await assertEmailAvailable(ctx, email, user._id);
    const passwordAccount = await passwordAccountFor(ctx, user._id);
    if (passwordAccount !== null && passwordAccount.providerAccountId !== email) {
      const taken = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", email),
        )
        .take(1);
      if (taken.length > 0) {
        throw new Error("Email already registered");
      }
      await ctx.db.patch("authAccounts", passwordAccount._id, {
        providerAccountId: email,
      });
    }
    await ctx.db.patch("users", user._id, {
      email,
      emailVerificationTime: undefined,
    });
    return null;
  },
});

export const updatePhone = mutation({
  args: { phone: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const phone = normalizePhone(args.phone);
    if (phone === (user.phone ?? undefined)) {
      return null;
    }
    if (phone !== undefined) {
      const matches = await ctx.db
        .query("users")
        .withIndex("phone", (q) => q.eq("phone", phone))
        .take(2);
      if (matches.some((match) => match._id !== user._id)) {
        throw new Error("Phone already registered");
      }
    }
    await ctx.db.patch("users", user._id, {
      phone,
      phoneVerificationTime: undefined,
    });
    return null;
  },
});

export const saveAddress = mutation({
  args: {
    addressId: v.optional(v.id("addresses")),
    label: v.string(),
    addressLine: v.string(),
    city: v.string(),
    postalCode: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const address = {
      label: requiredText(args.label, "Label", 40),
      addressLine: requiredText(args.addressLine, "Address", 120),
      city: requiredText(args.city, "City", 80),
      postalCode: requiredText(args.postalCode, "Postal code", 20),
    };
    if (args.addressId !== undefined) {
      const existing = await ctx.db.get("addresses", args.addressId);
      if (existing === null || existing.userId !== user._id) {
        throw new Error("Address not found");
      }
      await ctx.db.patch("addresses", args.addressId, address);
      return null;
    }
    const saved = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(8);
    if (saved.length >= 8) {
      throw new Error("Save up to 8 addresses");
    }
    const hasDefault = saved.some((item) => item.isDefault === true);
    await ctx.db.insert("addresses", {
      userId: user._id,
      ...address,
      isDefault: !hasDefault,
    });
    return null;
  },
});

export const setDefaultAddress = mutation({
  args: { addressId: v.id("addresses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.get("addresses", args.addressId);
    if (existing === null || existing.userId !== user._id) {
      throw new Error("Address not found");
    }
    const saved = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(8);
    for (const address of saved) {
      const isDefault = address._id === existing._id;
      if ((address.isDefault === true) === isDefault) {
        continue;
      }
      await ctx.db.patch("addresses", address._id, { isDefault });
    }
    return null;
  },
});

export const deleteAddress = mutation({
  args: { addressId: v.id("addresses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.get("addresses", args.addressId);
    if (existing === null || existing.userId !== user._id) {
      throw new Error("Address not found");
    }
    await ctx.db.delete("addresses", args.addressId);
    if (existing.isDefault === true) {
      const remaining = await ctx.db
        .query("addresses")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .take(8);
      const next = remaining[0];
      if (next !== undefined) {
        await ctx.db.patch("addresses", next._id, { isDefault: true });
      }
    }
    return null;
  },
});

export const setPassword = mutation({
  args: { password: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.password.length < 8 || args.password.length > 128) {
      throw new Error("Password must be at least 8 characters");
    }
    const existing = await passwordAccountFor(ctx, user._id);
    if (existing !== null) {
      await ctx.runMutation(internal.auth.store, {
        args: {
          type: "modifyAccount",
          provider: "password",
          account: {
            id: existing.providerAccountId,
            secret: args.password,
          },
        },
      });
      return null;
    }
    const email = user.email;
    if (email === undefined) {
      throw new Error("Add an email before setting a password");
    }
    const taken = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .take(1);
    if (taken.length > 0) {
      throw new Error("That email is already used for a password");
    }
    await ctx.db.insert("authAccounts", {
      userId: user._id,
      provider: "password",
      providerAccountId: email,
      secret: "pending",
    });
    await ctx.runMutation(internal.auth.store, {
      args: {
        type: "modifyAccount",
        provider: "password",
        account: { id: email, secret: args.password },
      },
    });
    return null;
  },
});

export const prepareGoogleLink = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await prepareGoogleLinkForUser(ctx, user._id);
    return null;
  },
});

export const unlinkAccount = mutation({
  args: { provider: v.union(v.literal("password"), v.literal("google")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
      .take(5);
    if (accounts.length < 2) {
      throw new Error("Keep at least one way to sign in");
    }
    const account = accounts.find((entry) => entry.provider === args.provider);
    if (account === undefined) {
      throw new Error("That account is not linked");
    }
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .take(10);
    for (const code of codes) {
      await ctx.db.delete("authVerificationCodes", code._id);
    }
    await ctx.db.delete("authAccounts", account._id);
    return null;
  },
});

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get("users", userId);
}

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await currentUser(ctx);
  if (user === null) {
    throw new Error("Not authenticated");
  }
  return user;
}

async function profileImage(ctx: QueryCtx, user: Doc<"users">) {
  if (user.photoUrl !== undefined) {
    return user.photoUrl;
  }
  if (user.imageId !== undefined) {
    return (await ctx.storage.getUrl(user.imageId)) ?? user.image ?? null;
  }
  return user.image ?? null;
}

function uploadthingPhotoUrl(value: string) {
  if (value.length === 0 || value.length > maxPhotoUrlLength) {
    throw new Error("Upload the image again");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Upload the image again");
  }
  const host = url.hostname;
  if (
    url.protocol !== "https:" ||
    (host !== "utfs.io" && !host.endsWith(".ufs.sh"))
  ) {
    throw new Error("Upload the image again");
  }
  return url.toString();
}

async function passwordAccountFor(ctx: MutationCtx, userId: Id<"users">) {
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", userId).eq("provider", "password"),
    )
    .take(2);
  if (accounts.length > 1) {
    throw new Error("Password account could not be updated");
  }
  return accounts[0] ?? null;
}

async function assertEmailAvailable(
  ctx: MutationCtx,
  email: string,
  userId: Id<"users">,
) {
  const matches = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .take(2);
  if (matches.some((match) => match._id !== userId)) {
    throw new Error("Email already registered");
  }
}

function optionalText(value: string, label: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${label} is too long`);
  }
  return trimmed.length === 0 ? undefined : trimmed;
}

function requiredText(value: string, label: string, maxLength: number) {
  const trimmed = optionalText(value, label, maxLength);
  if (trimmed === undefined) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email");
  }
  return email;
}

function normalizePhone(value: string) {
  const phone = value.trim();
  if (phone.length === 0) {
    return undefined;
  }
  if (phone.length > 20 || !/^[0-9+().\-\s]+$/.test(phone)) {
    throw new Error("Enter a valid phone number");
  }
  return phone;
}
