import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { optionName, requireAdmin } from "./lib/admin";

const size = v.object({
  _id: v.id("sizes"),
  name: v.string(),
});

export const list = query({
  args: {},
  returns: v.array(size),
  handler: async (ctx) => {
    const rows = await ctx.db.query("sizes").take(100);
    return rows.map((row) => ({ _id: row._id, name: row.name }));
  },
});

export const manageList = query({
  args: {},
  returns: v.array(size),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("sizes").take(100);
    return rows.map((row) => ({ _id: row._id, name: row.name }));
  },
});

export const create = mutation({
  args: { name: v.string() },
  returns: v.id("sizes"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = optionName(args.name, "size");
    await assertNameAvailable(ctx, name);
    return await ctx.db.insert("sizes", { name });
  },
});

export const update = mutation({
  args: { sizeId: v.id("sizes"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("sizes", args.sizeId);
    if (existing === null) {
      throw new Error("Size not found");
    }
    const name = optionName(args.name, "size");
    await assertNameAvailable(ctx, name, existing._id);
    await ctx.db.patch("sizes", existing._id, { name });
    return null;
  },
});

async function assertNameAvailable(ctx: MutationCtx, name: string, except?: Id<"sizes">) {
  const match = await ctx.db
    .query("sizes")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  if (match !== null && match._id !== except) {
    throw new Error("A size with that name already exists");
  }
}
