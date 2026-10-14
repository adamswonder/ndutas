import type { PaymentGateway } from "@/core/application/ports"
import type { Order } from "@/core/domain/order"

// Pochi la Biashara: Daraja can't collect into or confirm Pochi payments, so the customer
// pays by hand and the owner confirms the order in the back office.
export class ManualMpesaGateway implements PaymentGateway {
  readonly method = "manual" as const

  constructor(
    private readonly payTo: string,
    private readonly payToName: string
  ) {}

  describe() {
    return { method: this.method, payTo: this.payTo, payToName: this.payToName }
  }

  async start(order: Order) {
    return {
      kind: "manual" as const,
      payTo: this.payTo,
      payToName: this.payToName,
      amount: order.total,
      reference: order.reference,
    }
  }
}
