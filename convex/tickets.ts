import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { profileImage } from "./users";

const maxMessageLength = 2000;
const snippetLength = 48;

const ticketStatus = v.union(v.literal("active"), v.literal("archived"));

const listedTicket = v.object({
  _id: v.id("tickets"),
  createdAt: v.number(),
  status: ticketStatus,
  orderNumber: v.union(v.string(), v.null()),
  preview: v.string(),
});

export const listMine = query({
  args: {},
  returns: v.array(listedTicket),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(40);

    const listed = [];
    for (const ticket of tickets) {
      const firstId = ticket.messages[0];
      const first = firstId === undefined ? null : await ctx.db.get("ticketMessages", firstId);
      const order =
        ticket.orderId === undefined ? null : await ctx.db.get("orders", ticket.orderId);
      listed.push({
        _id: ticket._id,
        createdAt: ticket.createdAt,
        status: ticket.status ?? "active",
        orderNumber: order?.orderNumber ?? null,
        preview: messageSnippet(first?.message ?? ""),
      });
    }
    return listed;
  },
});

const loggedMessage = v.object({
  _id: v.id("ticketMessages"),
  message: v.string(),
  createdAt: v.number(),
  from: v.union(v.literal("user"), v.literal("support")),
  image: v.union(v.string(), v.null()),
  name: v.union(v.string(), v.null()),
});

export const messages = query({
  args: { ticketId: v.id("tickets") },
  returns: v.union(v.array(loggedMessage), v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const ticket = await ctx.db.get("tickets", args.ticketId);
    if (ticket === null || ticket.userId !== userId) {
      return null;
    }

    const log = [];
    for (const messageId of ticket.messages) {
      const entry = await ctx.db.get("ticketMessages", messageId);
      if (entry === null) {
        continue;
      }
      const author = await ctx.db.get("users", entry.userId);
      const fromSupport = entry.userId !== ticket.userId && author?.role === "admin";
      log.push({
        _id: entry._id,
        message: entry.message,
        createdAt: entry.createdAt,
        from: fromSupport ? ("support" as const) : ("user" as const),
        image: author === null ? null : await profileImage(ctx, author),
        name: author?.displayName ?? author?.name ?? null,
      });
    }
    return log;
  },
});

export const create = mutation({
  args: {
    orderId: v.optional(v.id("orders")),
    message: v.string(),
  },
  returns: v.id("tickets"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const message = args.message.trim();
    if (message.length === 0) {
      throw new Error("Tell us how we can help");
    }
    if (message.length > maxMessageLength) {
      throw new Error("Message is too long");
    }

    if (args.orderId !== undefined) {
      const order = await ctx.db.get("orders", args.orderId);
      if (order === null || order.userId !== userId || order.paymentStatus === "pending") {
        throw new Error("Order not found");
      }
    }

    const createdAt = Date.now();
    const ticketId = await ctx.db.insert("tickets", {
      userId,
      ...(args.orderId === undefined ? {} : { orderId: args.orderId }),
      createdAt,
      messages: [],
      status: "active",
    });
    const messageId = await ctx.db.insert("ticketMessages", {
      ticketId,
      userId,
      message,
      createdAt,
    });
    await ctx.db.patch("tickets", ticketId, { messages: [messageId] });
    return ticketId;
  },
});

function messageSnippet(message: string) {
  const flat = message.replace(/\s+/g, " ").trim();
  if (flat.length <= snippetLength) {
    return flat;
  }
  return `${flat.slice(0, snippetLength).trimEnd()}…`;
}
