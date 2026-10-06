import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { hasAbility } from "../lib/roles";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { profileImage, uploadthingPhotoUrl } from "./users";

const maxReviewLength = 2000;
const maxImages = 4;

const rating = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
);

const listedReview = v.object({
  _id: v.id("reviews"),
  productId: v.id("products"),
  text: v.string(),
  images: v.array(v.string()),
  rating,
  createdAt: v.number(),
  authorName: v.union(v.string(), v.null()),
  authorImage: v.union(v.string(), v.null()),
  mine: v.boolean(),
});

export const listByProduct = query({
  args: { productId: v.id("products") },
  returns: v.array(listedReview),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId_and_createdAt", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(40);

    return await Promise.all(
      reviews.map(async (review) => {
        const author = await ctx.db.get("users", review.userId);
        return {
          _id: review._id,
          productId: review.productId,
          text: review.text,
          images: review.images ?? [],
          rating: review.rating,
          createdAt: review.createdAt,
          authorName: author?.displayName ?? author?.name ?? null,
          authorImage: author === null ? null : await profileImage(ctx, author),
          mine: userId !== null && review.userId === userId,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    text: v.string(),
    rating,
    images: v.optional(v.array(v.string())),
  },
  returns: v.id("reviews"),
  handler: async (ctx, args) => {
    const user = await requireReviewer(ctx);
    const product = await ctx.db.get("products", args.productId);
    if (product === null) {
      throw new Error("Product not found");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_product_and_user", (q) =>
        q.eq("productId", args.productId).eq("userId", user._id),
      )
      .take(1);
    if (existing.length > 0) {
      throw new Error("You already reviewed this piece");
    }

    const images = reviewImages(args.images ?? []);
    return await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: user._id,
      text: reviewText(args.text),
      rating: args.rating,
      createdAt: Date.now(),
      ...(images.length === 0 ? {} : { images }),
    });
  },
});

export const update = mutation({
  args: {
    reviewId: v.id("reviews"),
    text: v.string(),
    rating,
    images: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ownedReview(ctx, args.reviewId);
    const images = reviewImages(args.images);
    await ctx.db.patch("reviews", review._id, {
      text: reviewText(args.text),
      rating: args.rating,
      images: images.length === 0 ? undefined : images,
    });
    return null;
  },
});

export const remove = mutation({
  args: { reviewId: v.id("reviews") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ownedReview(ctx, args.reviewId);
    await ctx.db.delete("reviews", review._id);
    return null;
  },
});

async function requireReviewer(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (user === null || !hasAbility(user.role ?? "user", "user")) {
    throw new Error("Not authenticated");
  }
  return user;
}

async function ownedReview(ctx: MutationCtx, reviewId: Id<"reviews">) {
  const user = await requireReviewer(ctx);
  const review = await ctx.db.get("reviews", reviewId);
  if (review === null || review.userId !== user._id) {
    throw new Error("Review not found");
  }
  return review;
}

function reviewText(value: string) {
  const text = value.trim();
  if (text.length === 0) {
    throw new Error("Write a review");
  }
  if (text.length > maxReviewLength) {
    throw new Error("Review is too long");
  }
  return text;
}

function reviewImages(values: string[]) {
  if (values.length > maxImages) {
    throw new Error("Attach up to 4 images");
  }
  return values.map((image) => uploadthingPhotoUrl(image));
}
