import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
const users = defineTable({
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  displayName: v.optional(v.string()),
  imageId: v.optional(v.id("_storage")),
  photoUrl: v.optional(v.string()),
  theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
  role: v.optional(
    v.union(
      v.literal("user"),
      v.literal("support"),
      v.literal("admin"),
      v.literal("banned"),
    ),
  ),
})
  .index("email", ["email"])
  .index("phone", ["phone"]);

export default defineSchema({
  ...authTables,
  users,
  addresses: defineTable({
    userId: v.id("users"),
    label: v.string(),
    addressLine: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    region: v.optional(v.string()),
    postalCode: v.string(),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),
  googleLinkIntents: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("by_userId", ["userId"]),
  orders: defineTable({
    userId: v.id("users"),
    shipName: v.string(),
    addressLine: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    region: v.optional(v.string()),
    postalCode: v.string(),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    total: v.number(),
    placedAt: v.number(),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("paid"))),
    stripeCheckoutSessionId: v.optional(v.string()),
    orderNumber: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_orderNumber", ["orderNumber"]),
  orderItems: defineTable({
    orderId: v.id("orders"),
    name: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    trackingUrl: v.optional(v.string()),
  }).index("by_orderId", ["orderId"]),
  tickets: defineTable({
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    createdAt: v.number(),
    messages: v.array(v.id("ticketMessages")),
    status: v.optional(v.union(v.literal("active"), v.literal("closed"))),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
  ticketMessages: defineTable({
    ticketId: v.id("tickets"),
    userId: v.id("users"),
    message: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_ticketId", ["ticketId"]),
  ticketNotes: defineTable({
    ticketId: v.id("tickets"),
    userId: v.id("users"),
    note: v.string(),
    createdAt: v.number(),
  }).index("by_ticketId", ["ticketId"]),
  products: defineTable({
    name: v.string(),
    slug: v.string(),
    price: v.number(),
    category: v.union(
      v.literal("Tailoring"),
      v.literal("Evening"),
      v.literal("Knitwear"),
      v.literal("Accessories"),
    ),
    image: v.string(),
    images: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    text: v.string(),
    images: v.optional(v.array(v.string())),
    rating: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ),
    createdAt: v.number(),
  })
    .index("by_productId_and_createdAt", ["productId", "createdAt"])
    .index("by_product_and_user", ["productId", "userId"])
    .index("by_userId", ["userId"]),
});
