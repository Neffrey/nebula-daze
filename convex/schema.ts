import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
const { users, ...otherAuthTables } = authTables;

export default defineSchema({
  ...otherAuthTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(
      v.union(v.literal("user"), v.literal("restricted"), v.literal("admin")),
    ),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  numbers: defineTable({
    value: v.number(),
  }),
});
