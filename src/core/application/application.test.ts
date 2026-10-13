import { describe, expect, it } from "vitest"
import type { Order, PaymentInstruction } from "@/core/domain/order"
import type { Product } from "@/core/domain/product"
import { StaticCatalog } from "@/infrastructure/catalog/static-catalog"
import { InMemoryOrderRepository } from "@/infrastructure/orders/in-memory-order-repository"
import { makeRetryPayment } from "./manage-order"
import { makePlaceOrder } from "./place-order"
import type { PaymentGateway } from "./ports"
import { makeRecordStkResult } from "./record-stk-result"

const products: Product[] = [
  { id: "a", name: "A", description: "", price: 1150, image: "", category: "lunch" },
  { id: "b", name: "B", description: "", price: 900, image: "", category: "dinner" },
]

function setup(start?: (order: Order) => Promise<PaymentInstruction>) {
  let n = 0
  const gateway: PaymentGateway = {
    method: "stk",
    start: start ?? (async () => ({ kind: "stk", checkoutRequestId: `ws_${++n}` })),
  }
  const deps = {
    catalog: new StaticCatalog(products),
    orders: new InMemoryOrderRepository(),
    gateway,
    ids: { orderId: () => `order-${++n}`, orderReference: () => "NDT-TEST" },
    clock: { now: () => new Date("2026-10-13T10:00:00Z") },
  }
  return {
    deps,
    placeOrder: makePlaceOrder(deps),
    recordStkResult: makeRecordStkResult(deps),
    retry: makeRetryPayment(deps),
  }
}

describe("placeOrder", () => {
  it("prices from the catalog, merges duplicate items and stores the checkout id", async () => {
    const { placeOrder, deps } = setup()
    const order = await placeOrder({
      name: "Amara",
      phone: "0712 345 678",
      items: [
        { productId: "a", quantity: 1 },
        { productId: "b", quantity: 2 },
        { productId: "a", quantity: 3 },
      ],
    })
    expect(order.total).toBe(3 * 1150 + 2 * 900)
    expect(order.customer.phone).toBe("254712345678")
    expect(order.payment.instruction).toEqual({ kind: "stk", checkoutRequestId: "ws_2" })
    expect(await deps.orders.findByCheckoutRequestId("ws_2")).toMatchObject({ id: order.id })
  })

  it("ignores any price the client tries to send", async () => {
    const { placeOrder } = setup()
    const order = await placeOrder({
      name: "Amara",
      phone: "0712345678",
      items: [{ productId: "a", quantity: 1, price: 1 } as never],
    })
    expect(order.total).toBe(1150)
  })

  it.each([
    [[], /empty/],
    [[{ productId: "nope", quantity: 1 }], /no longer available/],
    [[{ productId: "a", quantity: 0 }], /Invalid quantity/],
    [[{ productId: "a", quantity: 1.5 }], /Invalid quantity/],
  ])("rejects bad items %#", async (items, error) => {
    const { placeOrder } = setup()
    await expect(placeOrder({ name: "Amara", phone: "0712345678", items })).rejects.toThrow(error)
  })

  it("marks the order failed when the gateway is unreachable, and can retry", async () => {
    let calls = 0
    const { placeOrder, retry } = setup(async () => {
      if (++calls === 1) throw new Error("Daraja down")
      return { kind: "stk", checkoutRequestId: "ws_retry" }
    })
    const failed = await placeOrder({
      name: "Amara",
      phone: "0712345678",
      items: [{ productId: "a", quantity: 1 }],
    })
    expect(failed.status).toBe("payment_failed")
    const retried = await retry(failed.id)
    expect(retried).toMatchObject({
      status: "pending_payment",
      payment: { instruction: { checkoutRequestId: "ws_retry" } },
    })
  })
})

describe("recordStkResult", () => {
  it("marks the order paid once and ignores duplicate callbacks", async () => {
    const { placeOrder, recordStkResult, deps } = setup()
    const order = await placeOrder({
      name: "Amara",
      phone: "0712345678",
      items: [{ productId: "a", quantity: 1 }],
    })
    const checkoutRequestId = "ws_2"
    await recordStkResult({ checkoutRequestId, ok: true, mpesaReceipt: "R1" })
    await recordStkResult({ checkoutRequestId, ok: false, reason: "late failure" })
    expect(await deps.orders.findById(order.id)).toMatchObject({
      status: "paid",
      payment: { mpesaReceipt: "R1" },
    })
  })

  it("ignores unknown checkout ids", async () => {
    const { recordStkResult } = setup()
    await expect(
      recordStkResult({ checkoutRequestId: "unknown", ok: true, mpesaReceipt: "R1" })
    ).resolves.toBeUndefined()
  })
})
