import type { OrderQuery, OrderRepository } from "../application/ports"
import type { Order } from "../domain/order"

// Stand-in for the database in tests and local development without DATABASE_URL:
// orders are lost when the process restarts. The map can be passed in so it outlives this object.
export class InMemoryOrderRepository implements OrderRepository {
  constructor(private readonly orders = new Map<string, Order>()) {}

  async save(order: Order) {
    this.orders.set(order.id, structuredClone(order))
  }

  async findById(id: string) {
    const order = this.orders.get(id)
    return order ? structuredClone(order) : null
  }

  async findByCheckoutRequestId(checkoutRequestId: string) {
    for (const order of this.orders.values()) {
      const instruction = order.payment.instruction
      if (instruction?.kind === "stk" && instruction.checkoutRequestId === checkoutRequestId) {
        return structuredClone(order)
      }
    }
    return null
  }

  async list({ statuses, limit, before }: OrderQuery) {
    return [...this.orders.values()]
      .filter((order) => !statuses || statuses.includes(order.status))
      .filter((order) => !before || order.createdAt < before)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((order) => structuredClone(order))
  }
}
