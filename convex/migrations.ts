import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { regionCode } from "../lib/regions";

export const normalizeRegions = internalMutation({
  args: {},
  returns: v.object({ addresses: v.number(), orders: v.number(), unknown: v.array(v.string()) }),
  handler: async (ctx) => {
    const unknown: string[] = [];
    let addresses = 0;
    for (const address of await ctx.db.query("addresses").take(1000)) {
      const code = regionCode(address.region ?? "", address.country ?? "");
      if (code === null) {
        unknown.push(`address ${address._id}: ${address.region}`);
      } else if (code !== address.region) {
        await ctx.db.patch("addresses", address._id, { region: code });
        addresses += 1;
      }
    }
    let orders = 0;
    for (const order of await ctx.db.query("orders").take(1000)) {
      const code = regionCode(order.region ?? "", order.country ?? "");
      if (code === null) {
        unknown.push(`order ${order._id}: ${order.region}`);
      } else if (code !== order.region) {
        await ctx.db.patch("orders", order._id, { region: code });
        orders += 1;
      }
    }
    return { addresses, orders, unknown };
  },
});
