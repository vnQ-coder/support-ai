import * as organizationsSchema from "./schema/organizations";
import * as conversationsSchema from "./schema/conversations";
import * as knowledgeSchema from "./schema/knowledge";
import * as emailSchema from "./schema/email";
import * as smsSchema from "./schema/sms";
import * as subscriptionsSchema from "./schema/subscriptions";

const schema = {
  ...organizationsSchema,
  ...conversationsSchema,
  ...knowledgeSchema,
  ...emailSchema,
  ...smsSchema,
  ...subscriptionsSchema,
};

type DrizzleClient = ReturnType<typeof import("drizzle-orm/neon-http").drizzle<typeof schema>>;

/**
 * Create a Drizzle client.
 *
 * - If DATABASE_URL starts with "postgresql://" or "postgres://" (local Docker),
 *   uses the `postgres` (postgres.js) driver over TCP.
 * - If DATABASE_URL is a Neon/Vercel connection string, uses `@neondatabase/serverless`
 *   over WebSocket (required for Neon).
 * - If DATABASE_URL is not set, returns a Proxy that throws on use (safe for imports).
 */
function createClient(): DrizzleClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return new Proxy({} as DrizzleClient, {
      get(_target, prop) {
        if (prop === "then" || prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
          return undefined;
        }
        throw new Error(
          `DATABASE_URL is not set. Cannot perform database operations without a database connection.`
        );
      },
    });
  }

  // Local Postgres (Docker) — use postgres.js driver over TCP
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    const sql = postgres(url);
    return drizzle(sql, { schema }) as DrizzleClient;
  }

  // Neon/Vercel — use serverless driver over WebSocket
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sql = neon(url);
  return drizzle(sql, { schema }) as DrizzleClient;
}

export const db = createClient();

export type Database = DrizzleClient;
