import type { OrderRepository } from "@/core/application/ports"
import type { Order } from "@/core/domain/order"

// Phase 1 stand-in for a database: orders are lost when the server restarts.
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>()

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
}
