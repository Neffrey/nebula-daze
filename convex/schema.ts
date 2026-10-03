import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  orders: defineTable({
    userId: v.id("users"),
    shipName: v.string(),
    addressLine: v.string(),
    city: v.string(),
    postalCode: v.string(),
    total: v.number(),
    placedAt: v.number(),
  }).index("by_userId", ["userId"]),
  orderItems: defineTable({
    orderId: v.id("orders"),
    name: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
  }).index("by_orderId", ["orderId"]),
});
