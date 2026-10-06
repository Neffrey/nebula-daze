import { defineApp } from "convex/server";
import { v } from "convex/values";
import stripe from "@convex-dev/stripe/convex.config.js";

const app = defineApp({
  env: {
    STRIPE_SECRET_KEY: v.optional(v.string()),
    STRIPE_WEBHOOK_SECRET: v.optional(v.string()),
    PRINTIFY_API_TOKEN: v.optional(v.string()),
    PRINTIFY_SHOP_ID: v.optional(v.string()),
    PRINTIFY_WEBHOOK_SECRET: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
  },
});
app.use(stripe);

export default app;
