import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { customAlphabet } from "nanoid";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import { products } from "../lib/catalog";
import { requireCountryCode } from "../lib/countries";
import { ORDER_NUMBER_ALPHABET, ORDER_NUMBER_LENGTH } from "../lib/orderNumber";
import { optionalLine, shippingPhone } from "../lib/shippingAddress";

const createOrderNumber = customAlphabet(ORDER_NUMBER_ALPHABET, ORDER_NUMBER_LENGTH);

const itemArgs = v.object({
  name: v.string(),
  quantity: v.number(),
});

export const checkoutArgs = {
  items: v.array(itemArgs),
  shipName: v.string(),
  addressLine: v.string(),
  addressLine2: v.string(),
  city: v.string(),
  region: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phone: v.string(),
};

const pricedLine = v.object({
  name: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
});

const shippingAddress = v.object({
  name: v.string(),
  addressLine: v.string(),
  addressLine2: v.string(),
  city: v.string(),
  region: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phone: v.string(),
});

const listedOrder = v.object({
  _id: v.id("orders"),
  orderNumber: v.union(v.string(), v.null()),
  placedAt: v.number(),
  total: v.number(),
  shippingAddress,
  items: v.array(
    v.object({
      name: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      trackingUrl: v.union(v.string(), v.null()),
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
      .take(40);

    const listed = [];
    for (const order of orders) {
      if (order.paymentStatus === "pending") {
        continue;
      }
      if (listed.length >= 20) {
        break;
      }
      const items = await ctx.db
        .query("orderItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .take(20);
      listed.push({
        _id: order._id,
        orderNumber: order.orderNumber ?? null,
        placedAt: order.placedAt,
        total: order.total,
        shippingAddress: shippingAddressOf(order),
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          trackingUrl: item.trackingUrl ?? null,
        })),
      });
    }
    return listed;
  },
});

export const status = query({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.object({
      total: v.number(),
      paid: v.boolean(),
      orderNumber: v.union(v.string(), v.null()),
      shippingAddress,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.userId !== userId) {
      return null;
    }

    return {
      total: order.total,
      paid: order.paymentStatus !== "pending",
      orderNumber: order.orderNumber ?? null,
      shippingAddress: shippingAddressOf(order),
    };
  },
});

export const insertPending = internalMutation({
  args: checkoutArgs,
  returns: v.object({
    orderId: v.id("orders"),
    total: v.number(),
    lines: v.array(pricedLine),
  }),
  handler: async (ctx, args) => {
    const built = await buildOrder(ctx, args);
    const orderNumber = await assignOrderNumber(ctx);
    const orderId = await ctx.db.insert("orders", {
      userId: built.userId,
      orderNumber,
      shipName: built.shipName,
      addressLine: built.addressLine,
      addressLine2: built.addressLine2,
      city: built.city,
      region: built.region,
      postalCode: built.postalCode,
      country: built.country,
      phone: built.phone,
      total: built.total,
      placedAt: Date.now(),
      paymentStatus: "pending",
    });

    for (const line of built.lines) {
      await ctx.db.insert("orderItems", {
        orderId,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      });
    }

    return { orderId, total: built.total, lines: built.lines };
  },
});

export const attachCheckoutSession = internalMutation({
  args: {
    orderId: v.id("orders"),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to place an order");
    }

    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.userId !== userId || order.paymentStatus !== "pending") {
      throw new Error("Order not found");
    }

    await ctx.db.patch("orders", args.orderId, {
      stripeCheckoutSessionId: args.sessionId,
    });
    return null;
  },
});

export const markPaid = internalMutation({
  args: {
    orderId: v.id("orders"),
    userId: v.string(),
    amountTotal: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.userId !== args.userId || order.paymentStatus !== "pending") {
      console.error("Stripe payment did not match a pending order");
      return null;
    }
    if (order.total * 100 !== args.amountTotal) {
      console.error("Stripe amount did not match the order");
      return null;
    }

    await ctx.db.patch("orders", args.orderId, { paymentStatus: "paid" });
    return null;
  },
});

export const abandonPending = internalMutation({
  args: {
    orderId: v.id("orders"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.userId !== args.userId || order.paymentStatus !== "pending") {
      return null;
    }

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .take(20);
    for (const item of items) {
      await ctx.db.delete("orderItems", item._id);
    }
    await ctx.db.delete("orders", order._id);
    return null;
  },
});

async function buildOrder(ctx: MutationCtx, args: {
  items: { name: string; quantity: number }[];
  shipName: string;
  addressLine: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}) {
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
  const lines: { name: string; quantity: number; unitPrice: number }[] = [];
  for (const [name, quantity] of quantities) {
    const product = products.find((entry) => entry.name === name);
    if (!product) {
      throw new Error("That piece is no longer available");
    }
    total += product.price * quantity;
    lines.push({ name, quantity, unitPrice: product.price });
  }

  return {
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
    lines,
  };
}

function shippingAddressOf(order: Doc<"orders">) {
  return {
    name: order.shipName,
    addressLine: order.addressLine,
    addressLine2: order.addressLine2 ?? "",
    city: order.city,
    region: order.region ?? "",
    postalCode: order.postalCode,
    country: order.country ?? "",
    phone: order.phone ?? "",
  };
}

async function assignOrderNumber(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = createOrderNumber();
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
      .unique();
    if (existing === null) {
      return orderNumber;
    }
  }
  throw new Error("Could not assign an order number");
}

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
