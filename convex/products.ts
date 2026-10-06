import { v } from "convex/values";
import { productSlug, products as seedProducts } from "../lib/catalog";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin";

const listedProduct = v.object({
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  category: v.string(),
  image: v.string(),
  images: v.array(v.string()),
});

const productDetail = listedProduct.extend({
  _id: v.id("products"),
  categoryId: v.id("categories"),
});

const variant = v.object({
  colorId: v.id("colors"),
  sizeIds: v.array(v.id("sizes")),
});

const managedProduct = productDetail.extend({
  variants: v.array(variant),
  sizeIds: v.array(v.id("sizes")),
});

const productPage = productDetail.extend({
  colors: v.array(
    v.object({
      _id: v.id("colors"),
      name: v.string(),
      hex: v.string(),
      hex2: v.optional(v.string()),
      sizeIds: v.array(v.id("sizes")),
    }),
  ),
  sizes: v.array(v.object({ _id: v.id("sizes"), name: v.string() })),
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
    return products.map((product) => presentProduct(product, names));
  },
});

export const manageList = query({
  args: {},
  returns: v.array(managedProduct),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").withIndex("by_name").take(40);
    const names = await categoryNames(ctx);
    return products.map((product) => ({
      _id: product._id,
      categoryId: product.categoryId,
      variants: product.variants ?? [],
      sizeIds: product.sizeIds ?? [],
      ...presentProduct(product, names),
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    variants: v.array(variant),
    sizeIds: v.array(v.id("sizes")),
    images: v.array(v.string()),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = productName(args.name);
    const slug = productSlug(name);
    await assertSlugAvailable(ctx, slug);
    await assertCategoryExists(ctx, args.categoryId);
    const images = productImages(args.images);
    return await ctx.db.insert("products", {
      name,
      slug,
      price: productPrice(args.price),
      categoryId: args.categoryId,
      ...(await productOptions(ctx, args.variants, args.sizeIds)),
      image: images[0] ?? "",
      images,
    });
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    variants: v.array(variant),
    sizeIds: v.array(v.id("sizes")),
    images: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get("products", args.productId);
    if (product === null) {
      throw new Error("Product not found");
    }
    const name = productName(args.name);
    const slug = productSlug(name);
    await assertSlugAvailable(ctx, slug, product._id);
    await assertCategoryExists(ctx, args.categoryId);
    const images = productImages(args.images);
    await ctx.db.patch("products", product._id, {
      name,
      slug,
      price: productPrice(args.price),
      categoryId: args.categoryId,
      ...(await productOptions(ctx, args.variants, args.sizeIds)),
      image: images[0] ?? product.image,
      images,
    });
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
      ...(await productPageOptions(ctx, product)),
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

export const seed = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let count = 0;
    for (const item of seedProducts) {
      const categoryId = await findOrCreateCategory(ctx, item.category);
      const slug = productSlug(item.name);
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      const product = {
        name: item.name,
        slug,
        price: item.price,
        categoryId,
        image: item.image,
        images: [item.image],
      };
      if (existing === null) {
        await ctx.db.insert("products", product);
      } else {
        await ctx.db.patch("products", existing._id, product);
      }
      count += 1;
    }
    return count;
  },
});

async function categoryNames(ctx: QueryCtx) {
  const categories = await ctx.db.query("categories").take(100);
  return new Map(categories.map((category) => [category._id, category.name]));
}

async function findOrCreateCategory(ctx: MutationCtx, name: string) {
  const existing = await ctx.db
    .query("categories")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  return existing?._id ?? (await ctx.db.insert("categories", { name }));
}

async function assertCategoryExists(ctx: MutationCtx, categoryId: Id<"categories">) {
  if ((await ctx.db.get("categories", categoryId)) === null) {
    throw new Error("Choose a category");
  }
}

async function productOptions(
  ctx: MutationCtx,
  variants: { colorId: Id<"colors">; sizeIds: Id<"sizes">[] }[],
  sizeIds: Id<"sizes">[],
) {
  const colorIds = await existingIds(
    ctx,
    "colors",
    variants.map((entry) => entry.colorId),
  );
  if (colorIds.length === 0) {
    return { variants: [], sizeIds: await existingIds(ctx, "sizes", sizeIds) };
  }
  const resolved = [];
  for (const colorId of colorIds) {
    const entry = variants.find((candidate) => candidate.colorId === colorId);
    resolved.push({ colorId, sizeIds: await existingIds(ctx, "sizes", entry?.sizeIds ?? []) });
  }
  return { variants: resolved, sizeIds: [] };
}

async function existingIds<T extends "colors" | "sizes">(
  ctx: MutationCtx,
  table: T,
  ids: Id<T>[],
) {
  const unique = [...new Set(ids)];
  if (unique.length > 50) {
    throw new Error(`Choose up to 50 ${table}`);
  }
  for (const id of unique) {
    if ((await ctx.db.get(table, id)) === null) {
      throw new Error(`One of the chosen ${table} no longer exists`);
    }
  }
  return unique;
}

async function assertSlugAvailable(ctx: MutationCtx, slug: string, except?: Id<"products">) {
  const existing = await ctx.db
    .query("products")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing !== null && existing._id !== except) {
    throw new Error("A piece with that name already exists");
  }
}

function productName(value: string) {
  const name = value.trim();
  if (name.length === 0) {
    throw new Error("Name the piece");
  }
  if (productSlug(name).length === 0) {
    throw new Error("Name the piece");
  }
  if (name.length > 80) {
    throw new Error("Name is too long");
  }
  return name;
}

function productPrice(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 100000) {
    throw new Error("Enter a price in whole dollars");
  }
  return value;
}

const maxProductImages = 8;

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

function productImages(values: string[]) {
  const images = values.map((value) => productImage(value));
  if (images.length === 0) {
    throw new Error("Add an image");
  }
  if (images.length > maxProductImages) {
    throw new Error("Add up to 8 images");
  }
  return images;
}

function productImage(value: string) {
  const image = value.trim();
  if (image.length === 0 || image.length > 2000) {
    throw new Error("Add an image");
  }
  let url: URL;
  try {
    url = new URL(image);
  } catch {
    throw new Error("Use an image link");
  }
  if (url.protocol !== "https:") {
    throw new Error("Use an image link");
  }
  return url.toString();
}
