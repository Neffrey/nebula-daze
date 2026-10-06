import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { optionName, requireAdmin } from "./lib/admin";

const category = v.object({
  _id: v.id("categories"),
  name: v.string(),
  parentId: v.optional(v.id("categories")),
});

export const list = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("categories").take(100);
    return rows.map((row) => row.name);
  },
});

export const manageList = query({
  args: {},
  returns: v.array(category),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("categories").withIndex("by_name").take(100);
    return rows.map((row) => ({ _id: row._id, name: row.name, parentId: row.parentId }));
  },
});

export const create = mutation({
  args: { name: v.string(), parentId: v.optional(v.id("categories")) },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = optionName(args.name, "category");
    await assertNameAvailable(ctx, name);
    if (args.parentId !== undefined) {
      await assertValidParent(ctx, args.parentId);
    }
    return await ctx.db.insert("categories", { name, parentId: args.parentId });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    parentId: v.optional(v.id("categories")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("categories", args.categoryId);
    if (existing === null) {
      throw new Error("Category not found");
    }
    const name = optionName(args.name, "category");
    await assertNameAvailable(ctx, name, existing._id);
    if (args.parentId !== undefined) {
      await assertValidParent(ctx, args.parentId, existing._id);
    }
    await ctx.db.patch("categories", existing._id, { name, parentId: args.parentId });
    return null;
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("categories", args.categoryId);
    if (existing === null) {
      throw new Error("Category not found");
    }
    const product = await ctx.db
      .query("products")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", existing._id))
      .first();
    if (product !== null) {
      throw new Error("Move this category's products to another category first");
    }
    const children = await ctx.db
      .query("categories")
      .withIndex("by_parentId", (q) => q.eq("parentId", existing._id))
      .take(100);
    for (const child of children) {
      await ctx.db.patch("categories", child._id, { parentId: existing.parentId });
    }
    await ctx.db.delete("categories", existing._id);
    return null;
  },
});

async function assertNameAvailable(ctx: MutationCtx, name: string, except?: Id<"categories">) {
  const match = await ctx.db
    .query("categories")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  if (match !== null && match._id !== except) {
    throw new Error("A category with that name already exists");
  }
}

async function assertValidParent(
  ctx: MutationCtx,
  parentId: Id<"categories">,
  categoryId?: Id<"categories">,
) {
  let current: Id<"categories"> | undefined = parentId;
  for (let depth = 0; current !== undefined; depth += 1) {
    if (current === categoryId) {
      throw new Error("A category can't be inside itself");
    }
    if (depth >= 10) {
      throw new Error("Categories can only nest 10 levels deep");
    }
    const parent: { parentId?: Id<"categories"> } | null = await ctx.db.get("categories", current);
    if (parent === null) {
      throw new Error("Parent category not found");
    }
    current = parent.parentId;
  }
}
