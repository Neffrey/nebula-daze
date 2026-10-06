import type { NextConfig } from "next";

const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\.convex\.cloud$/, ".convex.site");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!convexSiteUrl) return [];
    // Printify webhooks are registered against SITE_URL and handled by convex/http.ts.
    return [
      {
        source: "/printify/webhook",
        destination: `${convexSiteUrl}/printify/webhook`,
      },
    ];
  },
  // The build script runs TypeScript 7 before Next.js. Next still needs the
  // older TypeScript compiler API for configuration and editor tooling.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.printify.com",
      },
    ],
  },
};

export default nextConfig;
