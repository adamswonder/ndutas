import { attachInstruction, markFailed, type Order } from "../domain/order"
import type { Clock, OrderRepository, PaymentGateway } from "./ports"

// Asks the gateway to start collecting payment for a pending order. If the gateway
// itself errors (e.g. Daraja is down), the order is marked failed so it can be retried.
export async function startPayment(
  deps: { orders: OrderRepository; gateway: PaymentGateway; clock: Clock },
  order: Order
): Promise<Order> {
  let next: Order
  try {
    const instruction = await deps.gateway.start(order)
    next = attachInstruction(order, instruction, deps.clock.now())
  } catch (error) {
    console.error("Payment gateway failed to start", error)
    next = markFailed(
      order,
      "We couldn't reach M-Pesa. Please try again.",
      deps.clock.now()
    )
  }
  await deps.orders.save(next)
  return next
}
