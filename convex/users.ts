import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

const viewerValidator = v.object({
  name: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});

export const viewer = query({
  args: {},
  returns: v.union(viewerValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get("users", userId);
    if (user === null) {
      return null;
    }

    return {
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
    };
  },
});
