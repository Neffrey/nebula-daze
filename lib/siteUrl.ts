export const LOCAL_SITE_URL = "http://localhost:3000";
export const PRODUCTION_SITE_URL = "https://nebuladaze.com";

const allowedOrigins = [LOCAL_SITE_URL, PRODUCTION_SITE_URL];

export function siteUrlForHostname(hostname: string): string {
  return hostname === "localhost" ? LOCAL_SITE_URL : PRODUCTION_SITE_URL;
}

export function safeNextPath(next: string | null): string {
  if (
    next !== null &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\") &&
    !next.includes("://")
  ) {
    return next;
  }
  return "/";
}

export function redirectDestination(redirectTo: string): string {
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return `${PRODUCTION_SITE_URL}${redirectTo}`;
  }
  if (redirectTo.startsWith("?")) {
    return `${PRODUCTION_SITE_URL}/${redirectTo}`;
  }

  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    throw new Error("Invalid redirect URL");
  }

  if (!allowedOrigins.includes(url.origin)) {
    throw new Error("Invalid redirect URL");
  }

  return url.toString();
}
