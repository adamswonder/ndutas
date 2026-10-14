import type { OrderEvent, OrderEvents } from "@ndutas/core"
import { sql } from "drizzle-orm"
import pg from "pg"
import type { Db } from "../db/client.js"
import type { FeedEvent, OrderFeed } from "./feed.js"

// Orders are placed by one Vercel Function instance while the owner's WebSocket may be held
// by another. Postgres LISTEN/NOTIFY on Neon carries the event between them.
const CHANNEL = "ndutas_orders"

export class PgNotifyEvents implements OrderEvents {
  constructor(private readonly db: Db) {}

  async publish({ type, order }: OrderEvent) {
    // Only the id travels (NOTIFY payloads are capped at 8KB); listeners re-read the order.
    const payload = JSON.stringify({ type, orderId: order.id } satisfies FeedEvent)
    await this.db.execute(sql`select pg_notify(${CHANNEL}, ${payload})`)
  }
}

// One LISTEN connection per instance, opened when the first socket subscribes and closed
// when the last one leaves. LISTEN needs a direct (unpooled) Neon connection.
export class PgListenFeed implements OrderFeed {
  private readonly listeners = new Set<(event: FeedEvent) => void>()
  private client: pg.Client | null = null
  private retryDelayMs = 1000

  constructor(private readonly url: string) {}

  subscribe(listener: (event: FeedEvent) => void) {
    this.listeners.add(listener)
    if (!this.client) void this.connect()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.disconnect()
    }
  }

  private async connect() {
    const client = new pg.Client({ connectionString: this.url })
    this.client = client
    client.on("notification", (message) => {
      if (message.channel !== CHANNEL || !message.payload) return
      try {
        const event = JSON.parse(message.payload) as FeedEvent
        for (const listener of this.listeners) listener(event)
      } catch (error) {
        console.error("Ignoring malformed order notification", error)
      }
    })
    client.on("error", (error) => {
      console.error("Order LISTEN connection failed", error)
      this.reconnect(client)
    })
    client.on("end", () => this.reconnect(client))

    try {
      await client.connect()
      await client.query(`LISTEN ${CHANNEL}`)
      this.retryDelayMs = 1000
    } catch (error) {
      console.error("Could not LISTEN for orders", error)
      this.reconnect(client)
    }
  }

  private reconnect(failed: pg.Client) {
    if (this.client !== failed) return
    this.client = null
    failed.end().catch(() => {})
    if (this.listeners.size === 0) return
    const delay = this.retryDelayMs
    this.retryDelayMs = Math.min(delay * 2, 30_000)
    setTimeout(() => {
      if (!this.client && this.listeners.size > 0) void this.connect()
    }, delay)
  }

  private disconnect() {
    const client = this.client
    this.client = null
    client?.end().catch(() => {})
  }
}
