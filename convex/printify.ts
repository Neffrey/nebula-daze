import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, env, internalAction } from "./_generated/server";
import {
  normalizeProduct,
  printifyCredentials,
  printifyRequest,
  type NormalizedProduct,
  type PrintifyProduct,
  type PrintifyProductPage,
} from "./lib/printify";
import { regionCode } from "../lib/regions";

type OrderForPrintify = {
  alreadySubmitted: boolean;
  paid: boolean;
  orderNumber: string | null;
  email: string | null;
  shipName: string;
  addressLine: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  items: {
    _id: Id<"orderItems">;
    printifyProductId: string | null;
    variantId: number | null;
    quantity: number;
  }[];
};

type SyncResult = {
  created: number;
  updated: number;
  removed: number;
  skipped: { title: string; reason: string }[];
};

const webhookTopics = [
  "product:created",
  "product:updated",
  "product:deleted",
  "order:updated",
  "order:sent-to-production",
  "order:shipment:created",
  "order:shipment:delivered",
];

export const syncProducts = action({
  args: {},
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    removed: v.number(),
    skipped: v.array(v.object({ title: v.string(), reason: v.string() })),
  }),
  handler: async (ctx): Promise<SyncResult> => {
    await ctx.runQuery(internal.printifyData.assertAdmin, {});
    const credentials = await printifyCredentials();
    let created = 0;
    let updated = 0;
    const keep: string[] = [];
    const skipped: { title: string; reason: string }[] = [];
    let complete = false;

    for (let page = 1; page <= 20; page += 1) {
      const response = (await printifyRequest(
        credentials,
        `products.json?limit=50&page=${page}`,
      )) as PrintifyProductPage;
      const batch: NormalizedProduct[] = [];
      for (const product of response.data) {
        const normalized = normalizeProduct(product);
        if (normalized.ok) {
          batch.push(normalized.product);
          keep.push(product.id);
        } else {
          skipped.push({ title: product.title, reason: normalized.reason });
        }
      }
      if (batch.length > 0) {
        const result: { created: number; updated: number } = await ctx.runMutation(
          internal.printifyData.upsertProducts,
          {
            products: batch,
          },
        );
        created += result.created;
        updated += result.updated;
      }
      if (response.data.length === 0 || page >= (response.last_page ?? page)) {
        complete = true;
        break;
      }
    }

    const removed: number = complete
      ? await ctx.runMutation(internal.printifyData.removeMissing, { keep })
      : 0;
    return { created, updated, removed, skipped };
  },
});

export const syncProduct = internalAction({
  args: { printifyId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credentials = await printifyCredentials();
    const product = (await printifyRequest(
      credentials,
      `products/${encodeURIComponent(args.printifyId)}.json`,
    )) as PrintifyProduct;
    const normalized = normalizeProduct(product);
    if (normalized.ok) {
      await ctx.runMutation(internal.printifyData.upsertProducts, {
        products: [normalized.product],
      });
    } else {
      await ctx.runMutation(internal.printifyData.removeByPrintifyId, {
        printifyId: args.printifyId,
      });
    }
    return null;
  },
});

export const submitOrder = internalAction({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const order: OrderForPrintify | null = await ctx.runQuery(
      internal.printifyData.orderForPrintify,
      { orderId: args.orderId },
    );
    if (order === null || !order.paid || order.alreadySubmitted) {
      return null;
    }

    const lineItems = order.items.flatMap((item) =>
      item.printifyProductId === null || item.variantId === null
        ? []
        : [
            {
              product_id: item.printifyProductId,
              variant_id: item.variantId,
              quantity: item.quantity,
              external_id: item._id,
            },
          ],
    );
    if (lineItems.length !== order.items.length) {
      await ctx.runMutation(internal.printifyData.recordSubmission, {
        orderId: args.orderId,
        error: "Some items are not linked to Printify products",
      });
      return null;
    }

    const [firstName = "", ...rest] = order.shipName.split(/\s+/);
    try {
      const credentials = await printifyCredentials();
      const created = (await printifyRequest(credentials, "orders.json", {
        method: "POST",
        body: {
          external_id: args.orderId,
          label: order.orderNumber ?? undefined,
          line_items: lineItems,
          shipping_method: 1,
          send_shipping_notification: true,
          address_to: {
            first_name: firstName,
            last_name: rest.join(" ") || firstName,
            ...(order.email === null ? {} : { email: order.email }),
            phone: order.phone,
            country: order.country,
            region: regionCode(order.region, order.country) ?? order.region,
            address1: order.addressLine,
            address2: order.addressLine2,
            city: order.city,
            zip: order.postalCode,
          },
        },
      })) as { id?: string };
      if (typeof created.id !== "string") {
        throw new Error("Printify did not return an order id");
      }
      await ctx.runMutation(internal.printifyData.recordSubmission, {
        orderId: args.orderId,
        printifyOrderId: created.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Printify error";
      console.error("Printify order submission failed", message);
      await ctx.runMutation(internal.printifyData.recordSubmission, {
        orderId: args.orderId,
        error: message,
      });
    }
    return null;
  },
});

export const connectWebhooks = action({
  args: {},
  returns: v.object({ added: v.array(v.string()), existing: v.array(v.string()) }),
  handler: async (ctx) => {
    await ctx.runQuery(internal.printifyData.assertAdmin, {});
    const credentials = await printifyCredentials();
    const secret = env.PRINTIFY_WEBHOOK_SECRET;
    const siteUrl = env.SITE_URL ?? env.CONVEX_SITE_URL;
    if (!secret || !siteUrl) {
      throw new Error("Set PRINTIFY_WEBHOOK_SECRET on the Convex deployment first.");
    }
    const url = `${siteUrl.replace(/\/+$/, "")}/printify/webhook`;
    const current = (await printifyRequest(credentials, "webhooks.json")) as {
      topic: string;
      url: string;
    }[];
    const added: string[] = [];
    const existing: string[] = [];
    for (const topic of webhookTopics) {
      if (current.some((webhook) => webhook.topic === topic && webhook.url === url)) {
        existing.push(topic);
        continue;
      }
      await printifyRequest(credentials, "webhooks.json", {
        method: "POST",
        body: { topic, url, secret },
      });
      added.push(topic);
    }
    return { added, existing };
  },
});
