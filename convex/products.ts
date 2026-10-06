import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin";

const listedProduct = v.object({
  _id: v.id("products"),
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  category: v.string(),
  image: v.string(),
  images: v.array(v.string()),
  singleVariantId: v.union(v.number(), v.null()),
});

const variant = v.object({
  colorId: v.id("colors"),
  sizeIds: v.array(v.id("sizes")),
});

const managedProduct = v.object({
  _id: v.id("products"),
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  image: v.string(),
  category: v.string(),
  categoryId: v.id("categories"),
  variantCount: v.number(),
  printifyId: v.union(v.string(), v.null()),
});

const productPage = v.object({
  _id: v.id("products"),
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  category: v.string(),
  categoryId: v.id("categories"),
  image: v.string(),
  images: v.array(v.string()),
  description: v.union(v.string(), v.null()),
  colors: v.array(
    v.object({
      _id: v.id("colors"),
      name: v.string(),
      hex: v.string(),
      hex2: v.optional(v.string()),
      sizeIds: v.array(v.id("sizes")),
      images: v.array(v.string()),
    }),
  ),
  sizes: v.array(v.object({ _id: v.id("sizes"), name: v.string() })),
  purchaseVariants: v.array(
    v.object({
      id: v.number(),
      price: v.number(),
      colorId: v.union(v.id("colors"), v.null()),
      sizeId: v.union(v.id("sizes"), v.null()),
    }),
  ),
});

const catalogProduct = v.object({
  _id: v.id("products"),
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  image: v.string(),
  category: v.string(),
  categoryId: v.id("categories"),
  variants: v.array(variant),
  sizeIds: v.array(v.id("sizes")),
});

export const catalog = query({
  args: {},
  returns: v.array(catalogProduct),
  handler: async (ctx) => {
    const products = await ctx.db.query("products").withIndex("by_name").take(200);
    const names = await categoryNames(ctx);
    return products.map((product) => {
      const presented = presentProduct(product, names);
      return {
        _id: product._id,
        name: presented.name,
        slug: presented.slug,
        price: presented.price,
        image: presented.image,
        category: presented.category,
        categoryId: product.categoryId,
        variants: product.variants ?? [],
        sizeIds: product.sizeIds ?? [],
      };
    });
  },
});

export const list = query({
  args: {},
  returns: v.array(listedProduct),
  handler: async (ctx) => {
    const products = await ctx.db.query("products").take(40);
    const names = await categoryNames(ctx);
    return products.map((product) => {
      const variants = product.printifyVariants ?? [];
      return {
        _id: product._id,
        ...presentProduct(product, names),
        singleVariantId: variants.length === 1 ? (variants[0]?.id ?? null) : null,
      };
    });
  },
});

export const manageList = query({
  args: {},
  returns: v.array(managedProduct),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").withIndex("by_name").take(200);
    const names = await categoryNames(ctx);
    return products.map((product) => {
      const presented = presentProduct(product, names);
      return {
        _id: product._id,
        name: presented.name,
        slug: presented.slug,
        price: presented.price,
        image: presented.image,
        category: presented.category,
        categoryId: product.categoryId,
        variantCount: product.printifyVariants?.length ?? 0,
        printifyId: product.printifyId ?? null,
      };
    });
  },
});

export const setCategory = mutation({
  args: { productId: v.id("products"), categoryId: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if ((await ctx.db.get("products", args.productId)) === null) {
      throw new Error("Product not found");
    }
    if ((await ctx.db.get("categories", args.categoryId)) === null) {
      throw new Error("Choose a category");
    }
    await ctx.db.patch("products", args.productId, { categoryId: args.categoryId });
    return null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(productPage, v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (product === null) {
      return null;
    }
    const category = await ctx.db.get("categories", product.categoryId);
    const names = new Map(category === null ? [] : [[category._id, category.name]]);
    return {
      _id: product._id,
      categoryId: product.categoryId,
      ...presentProduct(product, names),
      description: product.description ?? null,
      ...(await productPageOptions(ctx, product)),
      purchaseVariants: (product.printifyVariants ?? []).map((entry) => ({
        id: entry.id,
        price: entry.price / 100,
        colorId: entry.colorId ?? null,
        sizeId: entry.sizeId ?? null,
      })),
    };
  },
});

async function productPageOptions(ctx: QueryCtx, product: Doc<"products">) {
  const colors = [];
  for (const entry of product.variants ?? []) {
    const color = await ctx.db.get("colors", entry.colorId);
    if (color !== null) {
      colors.push({
        _id: color._id,
        name: color.name,
        hex: color.hex,
        ...(color.hex2 === undefined ? {} : { hex2: color.hex2 }),
        sizeIds: entry.sizeIds,
        images:
          product.colorImages?.find((images) => images.colorId === color._id)?.images ?? [],
      });
    }
  }
  const used = new Set<Id<"sizes">>(
    colors.length > 0 ? colors.flatMap((color) => color.sizeIds) : (product.sizeIds ?? []),
  );
  if (used.size === 0) {
    return { colors, sizes: [] };
  }
  const sizes = (await ctx.db.query("sizes").take(100))
    .filter((size) => used.has(size._id))
    .map((size) => ({ _id: size._id, name: size.name }));
  const known = new Set(sizes.map((size) => size._id));
  return {
    colors: colors.map((color) => ({
      ...color,
      sizeIds: color.sizeIds.filter((sizeId) => known.has(sizeId)),
    })),
    sizes,
  };
}

async function categoryNames(ctx: QueryCtx) {
  const categories = await ctx.db.query("categories").take(100);
  return new Map(categories.map((category) => [category._id, category.name]));
}

function presentProduct(product: Doc<"products">, categoryNames: Map<Id<"categories">, string>) {
  const images =
    product.images !== undefined && product.images.length > 0 ? product.images : [product.image];
  return {
    name: product.name,
    slug: product.slug,
    price: product.price,
    category: categoryNames.get(product.categoryId) ?? "",
    image: images[0] ?? product.image,
    images,
  };
}
