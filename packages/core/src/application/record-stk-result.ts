import { markFailed, markPaid } from "../domain/order"
import { publishSafely } from "./events"
import type { Clock, OrderEvents, OrderRepository, StkResult } from "./ports"

// Idempotent: Daraja may deliver the same callback more than once.
export function makeRecordStkResult(deps: {
  orders: OrderRepository
  clock: Clock
  events?: OrderEvents
}) {
  return async function recordStkResult(result: StkResult): Promise<void> {
    const order = await deps.orders.findByCheckoutRequestId(result.checkoutRequestId)
    if (!order || order.status !== "pending_payment") return

    const next = result.ok
      ? markPaid(order, result.mpesaReceipt, deps.clock.now())
      : markFailed(order, result.reason, deps.clock.now())
    await deps.orders.save(next)
    await publishSafely(deps.events, { type: "order.updated", order: next })
  }
}
