import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { optionName, requireAdmin } from "./lib/admin";

const color = v.object({
  _id: v.id("colors"),
  name: v.string(),
  hex: v.string(),
  hex2: v.optional(v.string()),
});

export const manageList = query({
  args: {},
  returns: v.array(color),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("colors").withIndex("by_name").take(100);
    return rows.map((row) => ({ _id: row._id, name: row.name, hex: row.hex, hex2: row.hex2 }));
  },
});

export const create = mutation({
  args: { name: v.string(), hex: v.string(), hex2: v.optional(v.string()) },
  returns: v.id("colors"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = optionName(args.name, "color");
    await assertNameAvailable(ctx, name);
    return await ctx.db.insert("colors", {
      name,
      hex: colorHex(args.hex),
      hex2: args.hex2 === undefined ? undefined : colorHex(args.hex2),
    });
  },
});

export const update = mutation({
  args: {
    colorId: v.id("colors"),
    name: v.string(),
    hex: v.string(),
    hex2: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get("colors", args.colorId);
    if (existing === null) {
      throw new Error("Color not found");
    }
    const name = optionName(args.name, "color");
    await assertNameAvailable(ctx, name, existing._id);
    await ctx.db.patch("colors", existing._id, {
      name,
      hex: colorHex(args.hex),
      hex2: args.hex2 === undefined ? undefined : colorHex(args.hex2),
    });
    return null;
  },
});

async function assertNameAvailable(ctx: MutationCtx, name: string, except?: Id<"colors">) {
  const match = await ctx.db
    .query("colors")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  if (match !== null && match._id !== except) {
    throw new Error("A color with that name already exists");
  }
}

function colorHex(value: string) {
  const hex = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(hex)) {
    throw new Error("Use a hex color like #1a1a1a");
  }
  return hex;
}
