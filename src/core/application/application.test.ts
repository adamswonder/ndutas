import { describe, expect, it } from "vitest"
import type { Order, PaymentInstruction } from "@/core/domain/order"
import type { Product } from "@/core/domain/product"
import { StaticCatalog } from "@/infrastructure/catalog/static-catalog"
import { InMemoryOrderRepository } from "@/infrastructure/orders/in-memory-order-repository"
import {
  makeConfirmManualPayment,
  makeRejectManualPayment,
  makeRetryPayment,
} from "./manage-order"
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
    describe: () => ({ method: "stk" }),
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
    confirm: makeConfirmManualPayment(deps),
    reject: makeRejectManualPayment(deps),
  }
}

function setupPochi() {
  const app = setup()
  const gateway: PaymentGateway = {
    method: "manual",
    describe: () => ({ method: "manual", payTo: "0700000000", payToName: "Ndutas Kitchen" }),
    start: async (order) => ({
      kind: "manual",
      payTo: "0700000000",
      payToName: "Ndutas Kitchen",
      amount: order.total,
      reference: order.reference,
    }),
  }
  const deps = { ...app.deps, gateway }
  return {
    ...app,
    placeOrder: makePlaceOrder(deps),
    confirm: makeConfirmManualPayment(deps),
    reject: makeRejectManualPayment(deps),
    retry: makeRetryPayment(deps),
  }
}

describe("Pochi la Biashara orders", () => {
  const input = { name: "Amara", phone: "0712345678", items: [{ productId: "a", quantity: 2 }] }

  it("wait for the owner as soon as they are placed", async () => {
    const { placeOrder } = setupPochi()
    const order = await placeOrder(input)
    expect(order.status).toBe("awaiting_verification")
    expect(order.payment.instruction).toMatchObject({ kind: "manual", amount: 2300 })
  })

  it("are marked paid when the owner confirms, with an optional receipt", async () => {
    const { placeOrder, confirm, deps } = setupPochi()
    const order = await placeOrder(input)
    await confirm(order.id, " sjk4h7q2xz ")
    expect(await deps.orders.findById(order.id)).toMatchObject({
      status: "paid",
      payment: { mpesaReceipt: "SJK4H7Q2XZ" },
    })
  })

  it("can be rejected by the owner and then retried", async () => {
    const { placeOrder, reject, retry } = setupPochi()
    const order = await placeOrder(input)
    expect((await reject(order.id, "No payment received")).status).toBe("rejected")
    expect((await retry(order.id)).status).toBe("awaiting_verification")
  })

  it("can't be confirmed by hand when paid by M-Pesa prompt", async () => {
    const { placeOrder, confirm } = setup()
    const order = await placeOrder(input)
    await expect(confirm(order.id)).rejects.toThrow(/Pochi/)
  })
})

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
