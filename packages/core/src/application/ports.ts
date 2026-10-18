import type { Order, OrderStatus, PaymentInstruction, PaymentMethod } from "../domain/order"
import type { Product } from "../domain/product"

// The menu customers order from: archived products are left out, sold-out ones are kept.
export interface ProductCatalog {
  all(): Promise<Product[]>
  findByIds(ids: readonly string[]): Promise<Product[]>
}

// Newest first. `before` pages backwards through createdAt.
export type OrderQuery = { statuses?: readonly OrderStatus[]; limit: number; before?: Date }

export interface OrderRepository {
  save(order: Order): Promise<void>
  findById(id: string): Promise<Order | null>
  findByCheckoutRequestId(checkoutRequestId: string): Promise<Order | null>
  list(query: OrderQuery): Promise<Order[]>
}

// Lets the back office hear about orders as they happen (WebSocket fan-out in the API).
export type OrderEvent = { type: "order.placed" | "order.updated"; order: Order }

export interface OrderEvents {
  publish(event: OrderEvent): Promise<void>
}

export const noOrderEvents: OrderEvents = { publish: async () => {} }

// What checkout needs to know before an order exists, so the UI can switch between
// the Pochi steps dialog and an immediate M-Pesa prompt.
export type PaymentSetup =
  | { method: "stk" }
  | { method: "manual"; payTo: string; payToName: string }

export interface PaymentGateway {
  readonly method: PaymentMethod
  describe(): PaymentSetup
  start(order: Order): Promise<PaymentInstruction>
}

// Outcome of an STK push, as reported by Daraja's callback (or the mock).
export type StkResult =
  | { checkoutRequestId: string; ok: true; mpesaReceipt: string }
  | { checkoutRequestId: string; ok: false; reason: string }

export interface IdGenerator {
  orderId(): string
  orderReference(): string
}

export interface Clock {
  now(): Date
}
