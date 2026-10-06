import { v } from "convex/values";
import { productSlug } from "../lib/catalog";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { requireAdmin } from "./lib/admin";

export const normalizedProduct = v.object({
  printifyId: v.string(),
  title: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
  images: v.array(v.string()),
  colors: v.array(
    v.object({
      key: v.number(),
      name: v.string(),
      hex: v.string(),
      hex2: v.optional(v.string()),
    }),
  ),
  sizes: v.array(v.object({ key: v.number(), name: v.string() })),
  variants: v.array(
    v.object({
      id: v.number(),
      price: v.number(),
      sku: v.optional(v.string()),
      colorKey: v.optional(v.number()),
      sizeKey: v.optional(v.number()),
    }),
  ),
});

const fallbackCategory = "Uncategorized";

export const assertAdmin = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return null;
  },
});

export const upsertProducts = internalMutation({
  args: { products: v.array(normalizedProduct) },
  returns: v.object({ created: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    let created = 0;
    let updated = 0;
    for (const product of args.products) {
      if (await upsertProduct(ctx, product)) {
        created += 1;
      } else {
        updated += 1;
      }
    }
    return { created, updated };
  },
});

export const removeMissing = internalMutation({
  args: { keep: v.array(v.string()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const keep = new Set(args.keep);
    const products = await ctx.db.query("products").take(500);
    let removed = 0;
    for (const product of products) {
      if (product.printifyId === undefined || !keep.has(product.printifyId)) {
        await deleteProduct(ctx, product);
        removed += 1;
      }
    }
    return removed;
  },
});

export const removeByPrintifyId = internalMutation({
  args: { printifyId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_printifyId", (q) => q.eq("printifyId", args.printifyId))
      .unique();
    if (product !== null) {
      await deleteProduct(ctx, product);
    }
    return null;
  },
});

export const orderForPrintify = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.object({
      alreadySubmitted: v.boolean(),
      paid: v.boolean(),
      orderNumber: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      shipName: v.string(),
      addressLine: v.string(),
      addressLine2: v.string(),
      city: v.string(),
      region: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.string(),
      items: v.array(
        v.object({
          _id: v.id("orderItems"),
          printifyProductId: v.union(v.string(), v.null()),
          variantId: v.union(v.number(), v.null()),
          quantity: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null) {
      return null;
    }
    const user = await ctx.db.get("users", order.userId);
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .take(20);
    return {
      alreadySubmitted: order.printifyOrderId !== undefined,
      paid: order.paymentStatus === "paid",
      orderNumber: order.orderNumber ?? null,
      email: user?.email ?? null,
      shipName: order.shipName,
      addressLine: order.addressLine,
      addressLine2: order.addressLine2 ?? "",
      city: order.city,
      region: order.region ?? "",
      postalCode: order.postalCode,
      country: order.country ?? "",
      phone: order.phone ?? "",
      items: items.map((item) => ({
        _id: item._id,
        printifyProductId: item.printifyProductId ?? null,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      })),
    };
  },
});

export const recordSubmission = internalMutation({
  args: {
    orderId: v.id("orders"),
    printifyOrderId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null) {
      return null;
    }
    if (args.printifyOrderId !== undefined) {
      await ctx.db.patch("orders", order._id, {
        printifyOrderId: args.printifyOrderId,
        printifyStatus: "pending",
        printifyError: undefined,
      });
    } else if (args.error !== undefined) {
      await ctx.db.patch("orders", order._id, { printifyError: args.error.slice(0, 500) });
    }
    return null;
  },
});

export const setStatus = internalMutation({
  args: { printifyOrderId: v.string(), status: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_printifyOrderId", (q) => q.eq("printifyOrderId", args.printifyOrderId))
      .unique();
    if (order !== null) {
      await ctx.db.patch("orders", order._id, { printifyStatus: args.status.slice(0, 60) });
    }
    return null;
  },
});

export const setTracking = internalMutation({
  args: {
    printifyOrderId: v.string(),
    trackingUrl: v.string(),
    skus: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_printifyOrderId", (q) => q.eq("printifyOrderId", args.printifyOrderId))
      .unique();
    if (order === null) {
      return null;
    }
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .take(20);
    const skus = new Set(args.skus);
    const matched = items.filter((item) => item.sku !== undefined && skus.has(item.sku));
    for (const item of matched.length > 0 ? matched : items) {
      await ctx.db.patch("orderItems", item._id, { trackingUrl: args.trackingUrl });
    }
    return null;
  },
});

type Normalized = typeof normalizedProduct.type;

async function upsertProduct(ctx: MutationCtx, product: Normalized) {
  const colorIds = new Map<number, Id<"colors">>();
  for (const color of product.colors) {
    colorIds.set(color.key, await findOrCreateColor(ctx, color));
  }
  const sizeIds = new Map<number, Id<"sizes">>();
  for (const size of product.sizes) {
    sizeIds.set(size.key, await findOrCreateSize(ctx, size.name));
  }

  const printifyVariants = product.variants.map((variant) => {
    const colorId = variant.colorKey === undefined ? undefined : colorIds.get(variant.colorKey);
    const sizeId = variant.sizeKey === undefined ? undefined : sizeIds.get(variant.sizeKey);
    return {
      id: variant.id,
      price: variant.price,
      ...(variant.sku === undefined ? {} : { sku: variant.sku }),
      ...(colorId === undefined ? {} : { colorId }),
      ...(sizeId === undefined ? {} : { sizeId }),
    };
  });

  const variants: { colorId: Id<"colors">; sizeIds: Id<"sizes">[] }[] = [];
  for (const color of product.colors) {
    const colorId = colorIds.get(color.key);
    if (colorId === undefined) {
      continue;
    }
    const sizesForColor = product.sizes
      .filter((size) =>
        product.variants.some(
          (variant) => variant.colorKey === color.key && variant.sizeKey === size.key,
        ),
      )
      .flatMap((size) => {
        const sizeId = sizeIds.get(size.key);
        return sizeId === undefined ? [] : [sizeId];
      });
    variants.push({ colorId, sizeIds: sizesForColor });
  }
  const productSizeIds =
    variants.length > 0
      ? []
      : product.sizes.flatMap((size) => {
          const sizeId = sizeIds.get(size.key);
          return sizeId === undefined ? [] : [sizeId];
        });

  const lowest = Math.min(...product.variants.map((variant) => variant.price));
  const existing = await ctx.db
    .query("products")
    .withIndex("by_printifyId", (q) => q.eq("printifyId", product.printifyId))
    .unique();
  const slug = await availableSlug(ctx, product.title, product.printifyId, existing?._id);
  const fields = {
    name: product.title,
    slug,
    price: lowest / 100,
    image: product.images[0] ?? "",
    images: product.images,
    description: product.description,
    variants,
    sizeIds: productSizeIds,
    printifyVariants,
  };

  if (existing !== null) {
    await ctx.db.patch("products", existing._id, fields);
    return false;
  }
  await ctx.db.insert("products", {
    ...fields,
    printifyId: product.printifyId,
    categoryId: await categoryForTags(ctx, product.tags),
  });
  return true;
}

async function availableSlug(
  ctx: MutationCtx,
  title: string,
  printifyId: string,
  except: Id<"products"> | undefined,
) {
  const base = productSlug(title) || "product";
  for (const candidate of [base, `${base}-${printifyId.slice(-6).toLowerCase()}`]) {
    const taken = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (taken === null || taken._id === except) {
      return candidate;
    }
  }
  return `${base}-${printifyId.toLowerCase()}`;
}

async function categoryForTags(ctx: MutationCtx, tags: string[]) {
  for (const tag of tags) {
    const name = tag.trim();
    if (name.length === 0) {
      continue;
    }
    const match = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (match !== null) {
      return match._id;
    }
  }
  const fallback = await ctx.db
    .query("categories")
    .withIndex("by_name", (q) => q.eq("name", fallbackCategory))
    .first();
  return fallback?._id ?? (await ctx.db.insert("categories", { name: fallbackCategory }));
}

async function findOrCreateColor(
  ctx: MutationCtx,
  color: { name: string; hex: string; hex2?: string },
) {
  const existing = await ctx.db
    .query("colors")
    .withIndex("by_name", (q) => q.eq("name", color.name))
    .first();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("colors", {
    name: color.name,
    hex: color.hex,
    ...(color.hex2 === undefined ? {} : { hex2: color.hex2 }),
  });
}

async function findOrCreateSize(ctx: MutationCtx, name: string) {
  const existing = await ctx.db
    .query("sizes")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  return existing?._id ?? (await ctx.db.insert("sizes", { name }));
}

async function deleteProduct(ctx: MutationCtx, product: Doc<"products">) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_productId_and_createdAt", (q) => q.eq("productId", product._id))
    .take(200);
  for (const review of reviews) {
    await ctx.db.delete("reviews", review._id);
  }
  await ctx.db.delete("products", product._id);
}
