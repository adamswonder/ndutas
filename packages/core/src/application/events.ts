import type { OrderEvent, OrderEvents } from "./ports"

// Notifying the back office must never fail the customer's request.
export async function publishSafely(events: OrderEvents | undefined, event: OrderEvent) {
  if (!events) return
  try {
    await events.publish(event)
  } catch (error) {
    console.error(`Failed to publish ${event.type} for order ${event.order.id}`, error)
  }
}
