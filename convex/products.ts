import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { productSlug, products as catalog } from "../lib/catalog";
import { hasAbility } from "../lib/roles";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";

const productCategory = v.union(
  v.literal("Tailoring"),
  v.literal("Evening"),
  v.literal("Knitwear"),
  v.literal("Accessories"),
);

const listedProduct = v.object({
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  category: productCategory,
  image: v.string(),
  images: v.array(v.string()),
});

const productDetail = listedProduct.extend({
  _id: v.id("products"),
});

export const list = query({
  args: {},
  returns: v.array(listedProduct),
  handler: async (ctx) => {
    const products = await ctx.db.query("products").take(40);
    return products.map((product) => presentProduct(product));
  },
});

export const manageList = query({
  args: {},
  returns: v.array(productDetail),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").withIndex("by_name").take(40);
    return products.map((product) => ({
      _id: product._id,
      ...presentProduct(product),
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    category: productCategory,
    images: v.array(v.string()),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = productName(args.name);
    const slug = productSlug(name);
    await assertSlugAvailable(ctx, slug);
    const images = productImages(args.images);
    return await ctx.db.insert("products", {
      name,
      slug,
      price: productPrice(args.price),
      category: args.category,
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
    category: productCategory,
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
    const images = productImages(args.images);
    await ctx.db.patch("products", product._id, {
      name,
      slug,
      price: productPrice(args.price),
      category: args.category,
      image: images[0] ?? product.image,
      images,
    });
    return null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(productDetail, v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (product === null) {
      return null;
    }
    return {
      _id: product._id,
      ...presentProduct(product),
    };
  },
});

export const seed = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let count = 0;
    for (const item of catalog) {
      if (!isCategory(item.category)) {
        continue;
      }
      const slug = productSlug(item.name);
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      const product = {
        name: item.name,
        slug,
        price: item.price,
        category: item.category,
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

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (user === null || !hasAbility(user.role ?? "user", "admin")) {
    throw new Error("Unauthorized");
  }
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

function presentProduct(product: {
  name: string;
  slug: string;
  price: number;
  category: "Tailoring" | "Evening" | "Knitwear" | "Accessories";
  image: string;
  images?: string[];
}) {
  const images =
    product.images !== undefined && product.images.length > 0 ? product.images : [product.image];
  return {
    name: product.name,
    slug: product.slug,
    price: product.price,
    category: product.category,
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

function isCategory(
  category: string,
): category is "Tailoring" | "Evening" | "Knitwear" | "Accessories" {
  return (
    category === "Tailoring" ||
    category === "Evening" ||
    category === "Knitwear" ||
    category === "Accessories"
  );
}
