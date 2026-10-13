import type { PricedCart } from "./cart"
import { DomainError } from "./errors"
import type { Kes } from "./money"
import { parseKenyanPhone, type KenyanPhone } from "./phone"

export type Customer = { name: string; phone: KenyanPhone }

export type OrderLine = {
  productId: string
  name: string
  unitPrice: Kes
  quantity: number
  lineTotal: Kes
}

export type PaymentMethod = "stk" | "manual"

// What the customer is told to do to pay.
export type PaymentInstruction =
  | { kind: "stk"; checkoutRequestId: string }
  | { kind: "manual"; payTo: string; payToName: string; amount: Kes; reference: string }

export type OrderStatus =
  | "pending_payment"
  | "awaiting_verification"
  | "paid"
  | "payment_failed"
  | "rejected"

export type Payment = {
  method: PaymentMethod
  instruction?: PaymentInstruction
  mpesaReceipt?: string
  manualCode?: string
  failureReason?: string
}

export type Order = {
  id: string
  reference: string
  customer: Customer
  lines: OrderLine[]
  total: Kes
  status: OrderStatus
  payment: Payment
  createdAt: Date
  updatedAt: Date
}

export function createCustomer(name: string, phone: string): Customer {
  const trimmed = name.trim().replace(/\s+/g, " ")
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new DomainError("invalid_name", "Enter your name (2 to 80 characters).")
  }
  return { name: trimmed, phone: parseKenyanPhone(phone) }
}

export function createOrder(input: {
  id: string
  reference: string
  customer: Customer
  cart: PricedCart
  method: PaymentMethod
  now: Date
}): Order {
  if (input.cart.lines.length === 0) {
    throw new DomainError("empty_cart", "Your cart is empty.")
  }
  return {
    id: input.id,
    reference: input.reference,
    customer: input.customer,
    lines: input.cart.lines.map(({ product, quantity, lineTotal }) => ({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal,
    })),
    total: input.cart.subtotal,
    status: "pending_payment",
    payment: { method: input.method },
    createdAt: input.now,
    updatedAt: input.now,
  }
}

function assertStatus(order: Order, allowed: OrderStatus[], action: string) {
  if (!allowed.includes(order.status)) {
    throw new DomainError(
      "invalid_transition",
      `Cannot ${action} an order that is ${order.status.replace("_", " ")}.`
    )
  }
}

export function attachInstruction(
  order: Order,
  instruction: PaymentInstruction,
  now: Date
): Order {
  assertStatus(order, ["pending_payment"], "start payment for")
  return { ...order, payment: { ...order.payment, instruction }, updatedAt: now }
}

export function markPaid(order: Order, mpesaReceipt: string, now: Date): Order {
  const from: OrderStatus =
    order.payment.method === "manual" ? "awaiting_verification" : "pending_payment"
  assertStatus(order, [from], "mark as paid")
  return {
    ...order,
    status: "paid",
    payment: { ...order.payment, mpesaReceipt },
    updatedAt: now,
  }
}

export function markFailed(order: Order, reason: string, now: Date): Order {
  assertStatus(order, ["pending_payment"], "fail")
  return {
    ...order,
    status: "payment_failed",
    payment: { ...order.payment, failureReason: reason },
    updatedAt: now,
  }
}

export function submitManualCode(order: Order, code: string, now: Date): Order {
  if (order.payment.method !== "manual") {
    throw new DomainError("invalid_transition", "This order is paid by M-Pesa prompt.")
  }
  assertStatus(order, ["pending_payment"], "submit a code for")
  const normalised = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{10}$/.test(normalised)) {
    throw new DomainError(
      "invalid_mpesa_code",
      "Enter the 10-character M-Pesa code from your confirmation SMS."
    )
  }
  return {
    ...order,
    status: "awaiting_verification",
    payment: { ...order.payment, manualCode: normalised },
    updatedAt: now,
  }
}

export function rejectManualPayment(order: Order, reason: string, now: Date): Order {
  assertStatus(order, ["awaiting_verification"], "reject")
  return {
    ...order,
    status: "rejected",
    payment: { ...order.payment, failureReason: reason },
    updatedAt: now,
  }
}

export function retryPayment(order: Order, now: Date): Order {
  assertStatus(order, ["payment_failed", "rejected"], "retry")
  return {
    ...order,
    status: "pending_payment",
    payment: { method: order.payment.method },
    updatedAt: now,
  }
}
