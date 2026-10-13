import { DomainError } from "@/core/domain/errors"
import { retryPayment, submitManualCode, type Order } from "@/core/domain/order"
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

export function makeSubmitManualPayment(deps: Deps) {
  return async function submitManualPayment(id: string, code: string): Promise<Order> {
    const order = submitManualCode(await load(deps.orders, id), code, deps.clock.now())
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
