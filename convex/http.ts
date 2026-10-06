import { registerRoutes } from "@convex-dev/stripe";
import { httpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { env, httpAction } from "./_generated/server";
import { auth } from "./auth";
import { verifySignature } from "./lib/printify";

const http = httpRouter();

auth.addHttpRoutes(http);

type PrintifyEvent = {
  type?: string;
  resource?: {
    id?: string | number;
    data?: {
      shop_id?: number | string;
      status?: string;
      carrier?: { tracking_url?: string };
      skus?: string[];
    } | null;
  };
};

http.route({
  path: "/printify/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = env.PRINTIFY_WEBHOOK_SECRET;
    const body = await request.text();
    if (!secret || !(await verifySignature(secret, body, request.headers.get("x-pfy-signature")))) {
      return new Response("Invalid signature", { status: 401 });
    }

    let event: PrintifyEvent;
    try {
      event = JSON.parse(body) as PrintifyEvent;
    } catch {
      return new Response("Invalid payload", { status: 400 });
    }
    const resourceId = event.resource?.id === undefined ? null : String(event.resource.id);
    const data = event.resource?.data ?? null;
    const shopId = data?.shop_id;
    const expectedShopId = env.PRINTIFY_SHOP_ID;
    if (shopId !== undefined && expectedShopId && String(shopId) !== expectedShopId) {
      return new Response(null, { status: 200 });
    }

    if (resourceId !== null) {
      switch (event.type) {
        case "product:created":
        case "product:updated":
          await ctx.scheduler.runAfter(0, internal.printify.syncProduct, {
            printifyId: resourceId,
          });
          break;
        case "product:deleted":
          await ctx.runMutation(internal.printifyData.removeByPrintifyId, {
            printifyId: resourceId,
          });
          break;
        case "order:updated":
          if (typeof data?.status === "string") {
            await ctx.runMutation(internal.printifyData.setStatus, {
              printifyOrderId: resourceId,
              status: data.status,
            });
          }
          break;
        case "order:sent-to-production":
          await ctx.runMutation(internal.printifyData.setStatus, {
            printifyOrderId: resourceId,
            status: "sending-to-production",
          });
          break;
        case "order:shipment:created":
        case "order:shipment:delivered": {
          const trackingUrl = data?.carrier?.tracking_url;
          if (typeof trackingUrl === "string" && trackingUrl.startsWith("http")) {
            await ctx.runMutation(internal.printifyData.setTracking, {
              printifyOrderId: resourceId,
              trackingUrl,
              skus: (data?.skus ?? []).filter((sku): sku is string => typeof sku === "string"),
            });
          }
          if (event.type === "order:shipment:delivered") {
            await ctx.runMutation(internal.printifyData.setStatus, {
              printifyOrderId: resourceId,
              status: "delivered",
            });
          }
          break;
        }
        default:
          break;
      }
    }
    return new Response(null, { status: 200 });
  }),
});

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
