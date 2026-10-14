import { describe, expect, it } from "vitest"
import { addItem, MAX_QUANTITY_PER_LINE, priceCart, removeItem, setQuantity } from "./cart"
import { kes, sum } from "./money"
import {
  attachInstruction,
  createCustomer,
  createOrder,
  markFailed,
  markPaid,
  retryPayment,
  rejectManualPayment,
  type PaymentMethod,
} from "./order"
import { DomainError } from "./errors"
import { checkKenyanPhone, maskPhone, parseKenyanPhone } from "./phone"
import type { Product } from "./product"

const products: Product[] = [
  { id: "a", name: "A", description: "", price: 1150, image: "", category: "lunch" },
  { id: "b", name: "B", description: "", price: 900, image: "", category: "dinner" },
]
const now = new Date("2026-10-13T10:00:00Z")

function order(method: PaymentMethod = "stk") {
  return createOrder({
    id: "o1",
    reference: "NDT-1",
    customer: createCustomer("Amara", "0712345678"),
    cart: priceCart([{ productId: "a", quantity: 2 }], products),
    method,
    now,
  })
}

describe("money", () => {
  it("rejects fractional and negative shillings", () => {
    expect(() => kes(10.5)).toThrow()
    expect(() => kes(-1)).toThrow()
    expect(sum([100, 250])).toBe(350)
  })
})

describe("phone", () => {
  it.each([
    ["0712345678", "254712345678"],
    ["0790 123 456", "254790123456"],
    ["0112 345 678", "254112345678"],
    ["0100 123 456", "254100123456"],
    ["+254712345678", "254712345678"],
    ["+254 110 123 456", "254110123456"],
    ["254712345678", "254712345678"],
    ["712-345-678", "254712345678"],
  ])("normalises %s", (input, expected) => {
    expect(parseKenyanPhone(input)).toBe(expected)
  })

  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["+255712345678", "not_kenyan"],
    ["071234567", "too_short"],
    ["0712", "too_short"],
    ["07123456789", "too_long"],
    ["+2547123456789", "too_long"],
    ["0812345678", "not_mobile"],
    ["0201234567", "not_mobile"],
  ])("rejects %s as %s", (input, problem) => {
    const result = checkKenyanPhone(input)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.problem).toBe(problem)
    expect(() => parseKenyanPhone(input)).toThrow(DomainError)
  })

  it("masks the middle digits", () => {
    expect(maskPhone(parseKenyanPhone("0712345678"))).toBe("2547•••••678")
  })
})

describe("cart", () => {
  it("adds, merges, caps and removes lines", () => {
    let lines = addItem([], "a")
    lines = addItem(lines, "a", 2)
    lines = addItem(lines, "b")
    expect(lines).toEqual([
      { productId: "a", quantity: 3 },
      { productId: "b", quantity: 1 },
    ])
    expect(setQuantity(lines, "a", 99)[0].quantity).toBe(MAX_QUANTITY_PER_LINE)
    expect(setQuantity(lines, "a", 0)).toEqual([{ productId: "b", quantity: 1 }])
    expect(removeItem(lines, "b")).toEqual([{ productId: "a", quantity: 3 }])
  })

  it("prices lines from the catalog and drops unknown products", () => {
    const priced = priceCart(
      [
        { productId: "a", quantity: 2 },
        { productId: "b", quantity: 1 },
        { productId: "gone", quantity: 4 },
      ],
      products
    )
    expect(priced.lines.map((line) => line.lineTotal)).toEqual([2300, 900])
    expect(priced.itemCount).toBe(3)
    expect(priced.subtotal).toBe(3200)
  })
})

describe("order", () => {
  it("snapshots lines and totals", () => {
    const o = order()
    expect(o.total).toBe(2300)
    expect(o.lines[0]).toMatchObject({ name: "A", unitPrice: 1150, quantity: 2 })
    expect(o.status).toBe("pending_payment")
  })

  it("rejects empty carts and bad names", () => {
    expect(() =>
      createOrder({
        id: "x",
        reference: "x",
        customer: createCustomer("Amara", "0712345678"),
        cart: priceCart([], products),
        method: "stk",
        now,
      })
    ).toThrow(/empty/)
    expect(() => createCustomer(" a ", "0712345678")).toThrow(/name/)
  })

  it("follows the STK flow: pending → failed → retried → paid", () => {
    const failed = markFailed(order(), "Cancelled", now)
    expect(failed.status).toBe("payment_failed")
    expect(() => markPaid(failed, "R1", now)).toThrow()
    const retried = retryPayment(failed, now)
    expect(retried.status).toBe("pending_payment")
    expect(retried.payment.failureReason).toBeUndefined()
    expect(markPaid(retried, "R1", now)).toMatchObject({
      status: "paid",
      payment: { mpesaReceipt: "R1" },
    })
  })

  const pochi = {
    kind: "manual",
    payTo: "0700000000",
    payToName: "Ndutas Kitchen",
    amount: kes(2300),
    reference: "NDT-1",
  } as const

  it("follows the Pochi flow: pending → awaiting confirmation → paid", () => {
    const o = order("manual")
    expect(() => markPaid(o, undefined, now)).toThrow()
    const awaiting = attachInstruction(o, pochi, now)
    expect(awaiting.status).toBe("awaiting_verification")
    expect(markPaid(awaiting, undefined, now).status).toBe("paid")
  })

  it("lets the owner reject a Pochi order, which can then be retried", () => {
    const rejected = rejectManualPayment(attachInstruction(order("manual"), pochi, now), "No payment", now)
    expect(rejected).toMatchObject({ status: "rejected", payment: { failureReason: "No payment" } })
    expect(retryPayment(rejected, now).status).toBe("pending_payment")
  })

  it("keeps STK orders pending until Daraja reports back", () => {
    const o = attachInstruction(order("stk"), { kind: "stk", checkoutRequestId: "ws_1" }, now)
    expect(o.status).toBe("pending_payment")
    expect(() => rejectManualPayment(o, "x", now)).toThrow()
  })
})
