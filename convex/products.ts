import { v } from "convex/values";
import { productSlug, products as catalog } from "../lib/catalog";
import { internalMutation, query } from "./_generated/server";

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
});

const productDetail = listedProduct.extend({
  _id: v.id("products"),
});

export const list = query({
  args: {},
  returns: v.array(listedProduct),
  handler: async (ctx) => {
    const products = await ctx.db.query("products").take(40);
    return products.map((product) => ({
      name: product.name,
      slug: product.slug,
      price: product.price,
      category: product.category,
      image: product.image,
    }));
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
      name: product.name,
      slug: product.slug,
      price: product.price,
      category: product.category,
      image: product.image,
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
