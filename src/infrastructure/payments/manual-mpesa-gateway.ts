import type { PaymentGateway } from "@/core/application/ports"
import type { Order } from "@/core/domain/order"

// Send Money / Pochi la Biashara: Daraja can't collect or confirm these, so the customer
// pays by hand and submits their M-Pesa code for the client to verify.
export class ManualMpesaGateway implements PaymentGateway {
  readonly method = "manual" as const

  constructor(
    private readonly payTo: string,
    private readonly payToName: string
  ) {}

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
