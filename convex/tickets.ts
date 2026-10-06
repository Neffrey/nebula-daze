import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { hasAbility } from "../lib/roles";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { profileImage, uploadthingPhotoUrl } from "./users";

const maxMessageLength = 2000;
const snippetLength = 48;

const ticketStatus = v.union(v.literal("active"), v.literal("closed"));

const listedTicket = v.object({
  _id: v.id("tickets"),
  createdAt: v.number(),
  status: ticketStatus,
  orderNumber: v.union(v.string(), v.null()),
  preview: v.string(),
  creatorName: v.union(v.string(), v.null()),
  creatorImage: v.union(v.string(), v.null()),
  messagesText: v.string(),
  lastFromOther: v.boolean(),
  lastFromCreator: v.boolean(),
  lastUpdatedAt: v.number(),
  lastAuthorName: v.union(v.string(), v.null()),
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
      listed.push(await presentTicket(ctx, ticket, userId));
    }
    return listed;
  },
});

export const listAll = query({
  args: { status: ticketStatus },
  returns: v.array(listedTicket),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const user = await ctx.db.get("users", userId);
    if (user === null || !hasAbility(user.role ?? "user", "support")) {
      return [];
    }

    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(40);

    const listed = [];
    for (const ticket of tickets) {
      listed.push(await presentTicket(ctx, ticket, userId));
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
  imageUrl: v.union(v.string(), v.null()),
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
    if (ticket === null) {
      return null;
    }
    if (ticket.userId !== userId) {
      const user = await ctx.db.get("users", userId);
      if (user === null || !hasAbility(user.role ?? "user", "support")) {
        return null;
      }
    }

    const log = [];
    for (const messageId of ticket.messages) {
      const entry = await ctx.db.get("ticketMessages", messageId);
      if (entry === null) {
        continue;
      }
      const author = await ctx.db.get("users", entry.userId);
      const fromSupport =
        entry.userId !== ticket.userId && hasAbility(author?.role ?? "user", "support");
      log.push({
        _id: entry._id,
        message: entry.message,
        createdAt: entry.createdAt,
        from: fromSupport ? ("support" as const) : ("user" as const),
        image: author === null ? null : await profileImage(ctx, author),
        imageUrl: entry.imageUrl ?? null,
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

export const reply = mutation({
  args: {
    ticketId: v.id("tickets"),
    message: v.string(),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("ticketMessages"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const ticket = await ctx.db.get("tickets", args.ticketId);
    if (ticket === null) {
      throw new Error("Ticket not found");
    }
    if (ticket.userId !== userId) {
      const user = await ctx.db.get("users", userId);
      if (user === null || !hasAbility(user.role ?? "user", "support")) {
        throw new Error("Unauthorized");
      }
    }

    const message = args.message.trim();
    const imageUrl = args.imageUrl === undefined ? null : uploadthingPhotoUrl(args.imageUrl);
    if (message.length === 0 && imageUrl === null) {
      throw new Error("Write a message");
    }
    if (message.length > maxMessageLength) {
      throw new Error("Message is too long");
    }

    const messageId = await ctx.db.insert("ticketMessages", {
      ticketId: args.ticketId,
      userId,
      message,
      ...(imageUrl === null ? {} : { imageUrl }),
      createdAt: Date.now(),
    });
    await ctx.db.patch("tickets", args.ticketId, {
      messages: [...ticket.messages, messageId],
    });
    return messageId;
  },
});

const loggedNote = v.object({
  _id: v.id("ticketNotes"),
  note: v.string(),
  createdAt: v.number(),
  mine: v.boolean(),
  image: v.union(v.string(), v.null()),
  name: v.union(v.string(), v.null()),
});

export const notes = query({
  args: { ticketId: v.id("tickets") },
  returns: v.array(loggedNote),
  handler: async (ctx, args) => {
    const userId = await supportUserId(ctx);
    if (userId === null) {
      return [];
    }
    const ticket = await ctx.db.get("tickets", args.ticketId);
    if (ticket === null) {
      return [];
    }

    const entries = await ctx.db
      .query("ticketNotes")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .order("desc")
      .take(40);
    entries.reverse();

    const log = [];
    for (const entry of entries) {
      const author = await ctx.db.get("users", entry.userId);
      log.push({
        _id: entry._id,
        note: entry.note,
        createdAt: entry.createdAt,
        mine: entry.userId === userId,
        image: author === null ? null : await profileImage(ctx, author),
        name: author?.displayName ?? author?.name ?? null,
      });
    }
    return log;
  },
});

export const addNote = mutation({
  args: { ticketId: v.id("tickets"), note: v.string() },
  returns: v.id("ticketNotes"),
  handler: async (ctx, args) => {
    const userId = await supportUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const ticket = await ctx.db.get("tickets", args.ticketId);
    if (ticket === null) {
      throw new Error("Ticket not found");
    }

    const note = args.note.trim();
    if (note.length === 0) {
      throw new Error("Write a note");
    }
    if (note.length > maxMessageLength) {
      throw new Error("Note is too long");
    }

    return await ctx.db.insert("ticketNotes", {
      ticketId: args.ticketId,
      userId,
      note,
      createdAt: Date.now(),
    });
  },
});

export const close = mutation({
  args: { ticketId: v.id("tickets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await supportUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const ticket = await ctx.db.get("tickets", args.ticketId);
    if (ticket === null) {
      throw new Error("Ticket not found");
    }
    await ctx.db.patch("tickets", args.ticketId, { status: "closed" });
    return null;
  },
});

async function supportUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  const user = await ctx.db.get("users", userId);
  if (user === null || !hasAbility(user.role ?? "user", "support")) {
    return null;
  }
  return userId;
}

async function presentTicket(ctx: QueryCtx, ticket: Doc<"tickets">, userId: Id<"users">) {
  const messages = [];
  let lastAuthorId: Id<"users"> | null = null;
  let lastUpdatedAt = ticket.createdAt;
  for (const messageId of ticket.messages) {
    const entry = await ctx.db.get("ticketMessages", messageId);
    if (entry !== null) {
      messages.push(entry.message);
      lastAuthorId = entry.userId;
      lastUpdatedAt = entry.createdAt;
    }
  }
  const order = ticket.orderId === undefined ? null : await ctx.db.get("orders", ticket.orderId);
  const creator = await ctx.db.get("users", ticket.userId);
  const lastAuthor =
    lastAuthorId === null || lastAuthorId === ticket.userId
      ? creator
      : await ctx.db.get("users", lastAuthorId);
  return {
    _id: ticket._id,
    createdAt: ticket.createdAt,
    status: ticket.status ?? ("active" as const),
    orderNumber: order?.orderNumber ?? null,
    preview: messageSnippet(messages[0] ?? ""),
    creatorName: creator?.displayName ?? creator?.name ?? null,
    creatorImage: creator === null ? null : await profileImage(ctx, creator),
    messagesText: messages.join("\n"),
    lastFromOther: lastAuthorId !== null && lastAuthorId !== userId,
    lastFromCreator: lastAuthorId !== null && lastAuthorId === ticket.userId,
    lastUpdatedAt,
    lastAuthorName: lastAuthor?.displayName ?? lastAuthor?.name ?? null,
  };
}

function messageSnippet(message: string) {
  const flat = message.replace(/\s+/g, " ").trim();
  if (flat.length <= snippetLength) {
    return flat;
  }
  return `${flat.slice(0, snippetLength).trimEnd()}…`;
}
