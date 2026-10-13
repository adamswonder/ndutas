import type { Order, PaymentInstruction, PaymentMethod } from "@/core/domain/order"
import type { Product } from "@/core/domain/product"

export interface ProductCatalog {
  all(): Promise<Product[]>
  findByIds(ids: readonly string[]): Promise<Product[]>
}

export interface OrderRepository {
  save(order: Order): Promise<void>
  findById(id: string): Promise<Order | null>
  findByCheckoutRequestId(checkoutRequestId: string): Promise<Order | null>
}

export interface PaymentGateway {
  readonly method: PaymentMethod
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
