import { neon } from "@neondatabase/serverless"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema.js"

// Neon's HTTP driver: one round trip per query, no connection to keep warm, which suits
// short-lived Vercel Functions. Use the pooled DATABASE_URL here.
export function createDb(url: string): Db {
  return drizzle(neon(url), { schema })
}

// Any Drizzle Postgres database: Neon in production, PGlite in the repository tests.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>
