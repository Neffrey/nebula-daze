import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action } from "./_generated/server";
import { printifyCredentials, printifyRequest } from "./lib/printify";
import { requireCountryCode } from "../lib/countries";
import { regionCode } from "../lib/regions";
import { FREE_SHIPPING_MINIMUM } from "../lib/shipping";

export const destinationArgs = {
  addressLine: v.string(),
  addressLine2: v.string(),
  city: v.string(),
  region: v.string(),
  postalCode: v.string(),
  country: v.string(),
};

type Destination = {
  addressLine: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

type Items = { productId: Id<"products">; variantId: number; quantity: number }[];

export const quote = action({
  args: {
    items: v.array(
      v.object({ productId: v.id("products"), variantId: v.number(), quantity: v.number() }),
    ),
    ...destinationArgs,
  },
  returns: v.object({ shipping: v.number() }),
  handler: async (ctx, args): Promise<{ shipping: number }> => {
    if ((await getAuthUserId(ctx)) === null) {
      throw new Error("Sign in to check out");
    }
    const { items, ...destination } = args;
    const shippingCents = await shippingCentsFor(ctx, items, destination);
    return { shipping: shippingCents / 100 };
  },
});

export async function shippingCentsFor(
  ctx: ActionCtx,
  items: Items,
  destination: Destination,
): Promise<number> {
  const { subtotalCents, lineItems } = await ctx.runQuery(internal.printifyData.shippingLines, {
    items,
  });
  if (subtotalCents >= FREE_SHIPPING_MINIMUM * 100) {
    return 0;
  }
  const country = requireCountryCode(destination.country);
  const rates = (await printifyRequest(await printifyCredentials(), "orders/shipping.json", {
    method: "POST",
    body: {
      line_items: lineItems,
      address_to: {
        country,
        region: regionCode(destination.region, country) ?? destination.region.trim(),
        address1: destination.addressLine.trim(),
        address2: destination.addressLine2.trim(),
        city: destination.city.trim(),
        zip: destination.postalCode.trim(),
      },
    },
  }).catch((error: unknown) => {
    console.error("Printify shipping quote failed", error instanceof Error ? error.message : error);
    throw new Error("Shipping could not be calculated for this address");
  })) as { standard?: unknown };
  if (typeof rates.standard !== "number" || !Number.isFinite(rates.standard) || rates.standard < 0) {
    throw new Error("Shipping could not be calculated for this address");
  }
  return Math.round(rates.standard);
}
