import type { Order, PaymentGateway, StkResult } from "@ndutas/core"

// Pretends to be Daraja's STK push: after a delay it reports the result the way the
// real callback will. Phone numbers ending in 000 simulate the customer cancelling.
// `keepAlive` lets Vercel keep the function running until the delayed result is recorded.
export class MockStkGateway implements PaymentGateway {
  readonly method = "stk" as const

  constructor(
    private readonly onResult: (result: StkResult) => Promise<void>,
    private readonly keepAlive: (task: Promise<unknown>) => void = () => {},
    private readonly delayMs = 6000
  ) {}

  describe() {
    return { method: this.method }
  }

  async start(order: Order) {
    const checkoutRequestId = `ws_CO_MOCK_${crypto.randomUUID()}`
    const result: StkResult = order.customer.phone.endsWith("000")
      ? { checkoutRequestId, ok: false, reason: "Request cancelled by user." }
      : { checkoutRequestId, ok: true, mpesaReceipt: mockReceipt() }

    const delayed = new Promise<void>((resolve) => setTimeout(resolve, this.delayMs))
      .then(() => this.onResult(result))
      .catch((error) => console.error("Mock STK result failed", error))
    this.keepAlive(delayed)

    return { kind: "stk" as const, checkoutRequestId }
  }
}

function mockReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}
