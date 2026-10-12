import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { hasAbility } from "@/lib/roles";

export async function viewerIsAdmin() {
  const token = await convexAuthNextjsToken();
  if (token === undefined) {
    return false;
  }
  const viewer = await fetchQuery(api.users.viewer, {}, { token });
  return viewer !== null && hasAbility(viewer.role, "admin");
}
