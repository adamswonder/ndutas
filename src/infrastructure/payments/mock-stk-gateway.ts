import type { PaymentGateway, StkResult } from "@/core/application/ports"
import type { Order } from "@/core/domain/order"

// Pretends to be Daraja's STK push: after a delay it reports the result the way the
// real callback will. Phone numbers ending in 000 simulate the customer cancelling.
export class MockStkGateway implements PaymentGateway {
  readonly method = "stk" as const

  constructor(
    private readonly onResult: (result: StkResult) => Promise<void>,
    private readonly delayMs = 6000
  ) {}

  async start(order: Order) {
    const checkoutRequestId = `ws_CO_MOCK_${crypto.randomUUID()}`
    const result: StkResult = order.customer.phone.endsWith("000")
      ? { checkoutRequestId, ok: false, reason: "Request cancelled by user." }
      : { checkoutRequestId, ok: true, mpesaReceipt: mockReceipt() }

    setTimeout(() => {
      this.onResult(result).catch((error) => console.error("Mock STK result failed", error))
    }, this.delayMs)

    return { kind: "stk" as const, checkoutRequestId }
  }
}

function mockReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}
