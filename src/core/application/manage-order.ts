import { DomainError } from "@/core/domain/errors"
import { markPaid, rejectManualPayment, retryPayment, type Order } from "@/core/domain/order"
import type { Clock, OrderRepository, PaymentGateway } from "./ports"
import { startPayment } from "./start-payment"

type Deps = { orders: OrderRepository; gateway: PaymentGateway; clock: Clock }

async function load(orders: OrderRepository, id: string): Promise<Order> {
  const order = await orders.findById(id)
  if (!order) throw new DomainError("order_not_found", "Order not found.")
  return order
}

export function makeGetOrder(deps: { orders: OrderRepository }) {
  return (id: string) => deps.orders.findById(id)
}

// Back office: the owner has seen the Pochi payment and confirms the order.
export function makeConfirmManualPayment(deps: { orders: OrderRepository; clock: Clock }) {
  return async function confirmManualPayment(id: string, mpesaReceipt?: string): Promise<Order> {
    const order = await load(deps.orders, id)
    if (order.payment.method !== "manual") {
      throw new DomainError("invalid_transition", "Only Pochi orders are confirmed by hand.")
    }
    const receipt = mpesaReceipt?.trim().toUpperCase() || undefined
    const paid = markPaid(order, receipt, deps.clock.now())
    await deps.orders.save(paid)
    return paid
  }
}

// Back office: no matching Pochi payment arrived.
export function makeRejectManualPayment(deps: { orders: OrderRepository; clock: Clock }) {
  return async function rejectManual(id: string, reason: string): Promise<Order> {
    const order = rejectManualPayment(await load(deps.orders, id), reason, deps.clock.now())
    await deps.orders.save(order)
    return order
  }
}

export function makeRetryPayment(deps: Deps) {
  return async function retry(id: string): Promise<Order> {
    const order = retryPayment(await load(deps.orders, id), deps.clock.now())
    await deps.orders.save(order)
    return startPayment(deps, order)
  }
}
