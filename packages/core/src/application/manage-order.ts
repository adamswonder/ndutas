import { DomainError } from "../domain/errors"
import { markPaid, rejectManualPayment, retryPayment, type Order } from "../domain/order"
import { publishSafely } from "./events"
import type { Clock, OrderEvents, OrderQuery, OrderRepository, PaymentGateway } from "./ports"
import { startPayment } from "./start-payment"

type Deps = { orders: OrderRepository; gateway: PaymentGateway; clock: Clock; events?: OrderEvents }
type OwnerDeps = { orders: OrderRepository; clock: Clock; events?: OrderEvents }

export const MAX_ORDERS_PER_PAGE = 100

async function load(orders: OrderRepository, id: string): Promise<Order> {
  const order = await orders.findById(id)
  if (!order) throw new DomainError("order_not_found", "Order not found.")
  return order
}

export function makeGetOrder(deps: { orders: OrderRepository }) {
  return (id: string) => deps.orders.findById(id)
}

// Back office: newest orders first, optionally filtered by status.
export function makeListOrders(deps: { orders: OrderRepository }) {
  return (query: Partial<OrderQuery> = {}) =>
    deps.orders.list({
      statuses: query.statuses,
      before: query.before,
      limit: Math.min(Math.max(Math.trunc(query.limit ?? 50), 1), MAX_ORDERS_PER_PAGE),
    })
}

// Back office: the owner has seen the Pochi payment and confirms the order.
export function makeConfirmManualPayment(deps: OwnerDeps) {
  return async function confirmManualPayment(id: string, mpesaReceipt?: string): Promise<Order> {
    const order = await load(deps.orders, id)
    if (order.payment.method !== "manual") {
      throw new DomainError("invalid_transition", "Only Pochi orders are confirmed by hand.")
    }
    const receipt = mpesaReceipt?.trim().toUpperCase() || undefined
    const paid = markPaid(order, receipt, deps.clock.now())
    await deps.orders.save(paid)
    await publishSafely(deps.events, { type: "order.updated", order: paid })
    return paid
  }
}

// Back office: no matching Pochi payment arrived.
export function makeRejectManualPayment(deps: OwnerDeps) {
  return async function rejectManual(id: string, reason: string): Promise<Order> {
    const why = reason.trim().slice(0, 200) || "We couldn't find a matching M-Pesa payment."
    const order = rejectManualPayment(await load(deps.orders, id), why, deps.clock.now())
    await deps.orders.save(order)
    await publishSafely(deps.events, { type: "order.updated", order })
    return order
  }
}

export function makeRetryPayment(deps: Deps) {
  return async function retry(id: string): Promise<Order> {
    const order = retryPayment(await load(deps.orders, id), deps.clock.now())
    await deps.orders.save(order)
    const started = await startPayment(deps, order)
    await publishSafely(deps.events, { type: "order.updated", order: started })
    return started
  }
}
