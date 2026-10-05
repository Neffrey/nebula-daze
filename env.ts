import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    // Not required in development. See .env.example.
    CONVEX_DEPLOY_KEY: z.string().min(1).optional(),
    UPLOADTHING_TOKEN: z.string().min(1),
    // Places API (New). Optional so a missing key does not fail the build.
    GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
});
