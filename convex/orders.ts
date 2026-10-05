import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { products } from "../lib/catalog";
import { requireCountryCode } from "../lib/countries";
import { optionalLine, shippingPhone } from "../lib/shippingAddress";

const itemArgs = v.object({
  name: v.string(),
  quantity: v.number(),
});

const listedOrder = v.object({
  _id: v.id("orders"),
  placedAt: v.number(),
  total: v.number(),
  city: v.string(),
  region: v.string(),
  country: v.string(),
  items: v.array(
    v.object({
      name: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    }),
  ),
});

export const listMine = query({
  args: {},
  returns: v.array(listedOrder),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    const listed = [];
    for (const order of orders) {
      const items = await ctx.db
        .query("orderItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .take(20);
      listed.push({
        _id: order._id,
        placedAt: order.placedAt,
        total: order.total,
        city: order.city,
        region: order.region ?? "",
        country: order.country ?? "",
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
    }
    return listed;
  },
});

export const place = mutation({
  args: {
    items: v.array(itemArgs),
    shipName: v.string(),
    addressLine: v.string(),
    addressLine2: v.string(),
    city: v.string(),
    region: v.string(),
    postalCode: v.string(),
    country: v.string(),
    phone: v.string(),
  },
  returns: v.object({
    orderId: v.id("orders"),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to place an order");
    }

    const shipName = requireText(args.shipName, "Recipient name", 80);
    const addressLine = requireText(args.addressLine, "Address", 120);
    const addressLine2 = optionalLine(args.addressLine2, "Apartment, suite, or unit", 80);
    const city = requireText(args.city, "City", 80);
    const region = requireText(args.region, "State / Province", 80);
    const postalCode = requireText(args.postalCode, "Postal code", 20);
    const country = requireCountryCode(args.country);
    const phone = shippingPhone(args.phone);

    if (args.items.length === 0 || args.items.length > 20) {
      throw new Error("Your bag is empty");
    }

    const quantities = new Map<string, number>();
    for (const item of args.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        throw new Error("Quantity must be between 1 and 10");
      }
      const product = products.find((entry) => entry.name === item.name);
      if (!product) {
        throw new Error("That piece is no longer available");
      }
      const next = (quantities.get(item.name) ?? 0) + item.quantity;
      if (next > 10) {
        throw new Error("Quantity must be between 1 and 10");
      }
      quantities.set(item.name, next);
    }

    let total = 0;
    const lines = [];
    for (const [name, quantity] of quantities) {
      const product = products.find((entry) => entry.name === name);
      if (!product) {
        throw new Error("That piece is no longer available");
      }
      total += product.price * quantity;
      lines.push({ name, quantity, unitPrice: product.price });
    }

    const orderId = await ctx.db.insert("orders", {
      userId,
      shipName,
      addressLine,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      phone,
      total,
      placedAt: Date.now(),
    });

    for (const line of lines) {
      await ctx.db.insert("orderItems", {
        orderId,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      });
    }

    return { orderId, total };
  },
});

function requireText(value: string, label: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${label} is too long`);
  }
  return trimmed;
}
