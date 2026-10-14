import { EventEmitter } from "node:events"
import type { OrderEvent, OrderEvents } from "@ndutas/core"

// What travels between API instances: just enough to re-read the order from the database.
export type FeedEvent = { type: OrderEvent["type"]; orderId: string }

export interface OrderFeed {
  subscribe(listener: (event: FeedEvent) => void): () => void
}

// Single-process stand-in for Postgres LISTEN/NOTIFY: local development and tests.
export class InProcessOrderBus implements OrderEvents, OrderFeed {
  private readonly emitter = new EventEmitter()

  async publish({ type, order }: OrderEvent) {
    this.emitter.emit("event", { type, orderId: order.id } satisfies FeedEvent)
  }

  subscribe(listener: (event: FeedEvent) => void) {
    this.emitter.on("event", listener)
    return () => {
      this.emitter.off("event", listener)
    }
  }
}
