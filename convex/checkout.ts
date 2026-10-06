"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";
import { LOCAL_SITE_URL, PRODUCTION_SITE_URL } from "../lib/siteUrl";
import { components, internal } from "./_generated/api";
import { action, env } from "./_generated/server";
import { checkoutArgs } from "./orders";
import { shippingCentsFor } from "./shipping";

const stripeClient = new StripeSubscriptions(components.stripe, {});
const allowedOrigins = new Set([LOCAL_SITE_URL, PRODUCTION_SITE_URL]);

export const pay = action({
  args: {
    ...checkoutArgs,
    origin: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to place an order");
    }
    if (!allowedOrigins.has(args.origin)) {
      throw new Error("Checkout must start from the Nebula Daze site");
    }
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Card payments are not configured yet");
    }

    const shippingCents = await shippingCentsFor(ctx, args.items, args);
    const order = await ctx.runMutation(internal.orders.insertPending, {
      shippingCents,
      items: args.items,
      shipName: args.shipName,
      addressLine: args.addressLine,
      addressLine2: args.addressLine2,
      city: args.city,
      region: args.region,
      postalCode: args.postalCode,
      country: args.country,
      phone: args.phone,
    });

    try {
      const identity = await ctx.auth.getUserIdentity();
      const customer = await stripeClient.getOrCreateCustomer(ctx, {
        userId,
        email: identity?.email,
        name: identity?.name,
      });
      const session = await stripeClient.createCheckoutSession(ctx, {
        priceId: "price_overridden",
        customerId: customer.customerId,
        mode: "payment",
        successUrl: `${args.origin}/checkout?order=${order.orderId}`,
        cancelUrl: `${args.origin}/checkout`,
        metadata: {
          orderId: order.orderId,
          userId,
        },
        paymentIntentMetadata: {
          orderId: order.orderId,
          userId,
        },
        params: {
          line_items: [
            ...order.lines.map((line) => ({
              quantity: line.quantity,
              price_data: {
                currency: "usd",
                unit_amount: Math.round(line.unitPrice * 100),
                product_data: {
                  name: line.options === "" ? line.name : `${line.name} (${line.options})`,
                },
              },
            })),
            ...(shippingCents === 0
              ? []
              : [
                  {
                    quantity: 1,
                    price_data: {
                      currency: "usd",
                      unit_amount: shippingCents,
                      product_data: { name: "Shipping" },
                    },
                  },
                ]),
          ],
        },
      });

      await ctx.runMutation(internal.orders.attachCheckoutSession, {
        orderId: order.orderId,
        sessionId: session.sessionId,
      });

      if (session.url === null) {
        throw new Error("Card checkout could not be started");
      }
      return { url: session.url };
    } catch (error) {
      await ctx.runMutation(internal.orders.abandonPending, {
        orderId: order.orderId,
        userId,
      });
      if (error instanceof Error && error.message === "Card checkout could not be started") {
        throw error;
      }
      console.error(
        "Stripe checkout failed",
        error instanceof Error ? error.message : "unknown",
      );
      throw new Error("Card checkout could not be started");
    }
  },
});
