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

// "stk": M-Pesa prompt to a Till/Paybill, confirmed automatically by Daraja.
// "manual": Pochi la Biashara (no Till/Paybill), confirmed by the owner in the back office.
export type PaymentMethod = "stk" | "manual"

// What the customer is told to do to pay.
export type PaymentInstruction =
  | { kind: "stk"; checkoutRequestId: string }
  | { kind: "manual"; payTo: string; payToName: string; amount: Kes; reference: string }

export type OrderStatus =
  | "pending_payment"
  // Manual (Pochi) orders wait here until the owner sees the money and confirms.
  | "awaiting_verification"
  | "paid"
  | "payment_failed"
  | "rejected"

export type Payment = {
  method: PaymentMethod
  instruction?: PaymentInstruction
  mpesaReceipt?: string
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

export const CUSTOMER_NAME_MAX = 80

// The cleaned-up name, or null if it isn't 2 to 80 characters.
export function normaliseCustomerName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ")
  return trimmed.length >= 2 && trimmed.length <= CUSTOMER_NAME_MAX ? trimmed : null
}

export function createCustomer(name: string, phone: string): Customer {
  const normalised = normaliseCustomerName(name)
  if (!normalised) {
    throw new DomainError("invalid_name", "Enter your name (2 to 80 characters).")
  }
  return { name: normalised, phone: parseKenyanPhone(phone) }
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
  return {
    ...order,
    // Pochi payments can't be confirmed automatically, so they go straight to the owner.
    status: instruction.kind === "manual" ? "awaiting_verification" : order.status,
    payment: { ...order.payment, instruction },
    updatedAt: now,
  }
}

// mpesaReceipt is optional for manual payments: the owner may confirm without typing it in.
export function markPaid(order: Order, mpesaReceipt: string | undefined, now: Date): Order {
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
