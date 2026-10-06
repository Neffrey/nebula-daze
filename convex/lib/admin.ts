import { getAuthUserId } from "@convex-dev/auth/server";
import { hasAbility } from "../../lib/roles";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (user === null || !hasAbility(user.role ?? "user", "admin")) {
    throw new Error("Unauthorized");
  }
}

export function optionName(value: string, label: string) {
  const name = value.trim();
  if (name.length === 0) {
    throw new Error(`Name the ${label}`);
  }
  if (name.length > 40) {
    throw new Error("Name is too long");
  }
  return name;
}
