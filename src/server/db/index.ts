// LIBS
import { sql } from "@vercel/postgres";
import { drizzle, type VercelPgDatabase } from "drizzle-orm/vercel-postgres";
import { env } from "~/env";

// SCHEMA
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  // conn: postgres.Sql | undefined;
  conn: VercelPgDatabase<typeof schema> | undefined;
};

const conn = globalForDb.conn ?? drizzle(sql, { schema });
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

// export const db = drizzle(conn, { schema });

export const db = drizzle(sql, { schema });
