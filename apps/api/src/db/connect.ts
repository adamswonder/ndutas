import type { OrderEvents } from "@ndutas/core"
import type { Config } from "../config.js"
import { InProcessOrderBus, type OrderFeed } from "../realtime/feed.js"
import { PgListenFeed, PgNotifyEvents } from "../realtime/postgres.js"
import { createDb, type Db } from "./client.js"

export type Database = {
  db: Db
  // How order events travel to the back office sockets.
  events: OrderEvents
  feed: OrderFeed
}

// Neon when DATABASE_URL is set (production, or local against a Neon branch).
// Otherwise a local PGlite database: real Postgres in-process, stored in LOCAL_DB_DIR
// ("memory://" in tests). It is migrated on startup, so a fresh checkout just works.
export async function connectDatabase(config: Config): Promise<Database> {
  if (config.databaseUrl) {
    const db = createDb(config.databaseUrl)
    return {
      db,
      events: new PgNotifyEvents(db),
      feed: new PgListenFeed(config.databaseUrlUnpooled ?? config.databaseUrl),
    }
  }

  // Imported lazily so the Vercel bundle never loads PGlite.
  const [{ PGlite }, { drizzle }, { migrate }, schema, { mkdirSync }, { fileURLToPath }] =
    await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
      import("./schema.js"),
      import("node:fs"),
      import("node:url"),
    ])
  const dir = config.localDataDir
  if (!dir.startsWith("memory://")) mkdirSync(dir, { recursive: true })
  const db = drizzle(new PGlite(dir), { schema })
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) })

  // One process locally, so events can stay in memory.
  const bus = new InProcessOrderBus()
  return { db: db as unknown as Db, events: bus, feed: bus }
}
