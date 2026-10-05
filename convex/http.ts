import { registerRoutes } from "@convex-dev/stripe";
import { httpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

registerRoutes(http, components.stripe, {
  events: {
    "checkout.session.completed": async (ctx, event) => {
      const session = event.data.object;
      if (session.mode !== "payment" || session.payment_status !== "paid") {
        return;
      }
      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;
      if (!orderId || !userId || session.amount_total === null || session.currency !== "usd") {
        return;
      }
      await ctx.runMutation(internal.orders.markPaid, {
        orderId: orderId as Id<"orders">,
        userId,
        amountTotal: session.amount_total,
      });
    },
    "checkout.session.expired": async (ctx, event) => {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;
      if (!orderId || !userId || session.payment_status === "paid") {
        return;
      }
      await ctx.runMutation(internal.orders.abandonPending, {
        orderId: orderId as Id<"orders">,
        userId,
      });
    },
  },
});

export default http;
