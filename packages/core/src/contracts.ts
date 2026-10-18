// The JSON shapes the API sends and accepts, shared by apps/api and apps/web.
// Change these first when an endpoint changes, so both sides stay in step.
import type { Order, OrderStatus } from "./domain/order"
import { maskPhone } from "./domain/phone"
import type { StaffView } from "./application/staff"
import type { StoredProduct } from "./application/products"
import type { Product, ProductDetails } from "./domain/product"

// What a customer may see about their order: the phone number is masked.
export type PublicOrderView = {
  id: string
  reference: string
  status: Order["status"]
  method: Order["payment"]["method"]
  customerName: string
  maskedPhone: string
  lines: Order["lines"]
  total: number
  instruction: Order["payment"]["instruction"]
  mpesaReceipt?: string
  failureReason?: string
}

// The owner sees the full number, to match Pochi payments by the payer's phone.
export type AdminOrderView = PublicOrderView & {
  customerPhone: string
  createdAt: string
  updatedAt: string
}

export function toPublicOrderView(order: Order): PublicOrderView {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    method: order.payment.method,
    customerName: order.customer.name,
    maskedPhone: maskPhone(order.customer.phone),
    lines: order.lines,
    total: order.total,
    instruction: order.payment.instruction,
    mpesaReceipt: order.payment.mpesaReceipt,
    failureReason: order.payment.failureReason,
  }
}

export function toAdminOrderView(order: Order): AdminOrderView {
  return {
    ...toPublicOrderView(order),
    customerPhone: order.customer.phone,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

// Errors: `fieldErrors` points at checkout fields; `code` is a DomainErrorCode when there is one.
export type ApiError = {
  error: string
  code?: string
  fieldErrors?: { name?: string; phone?: string }
}

export type PlaceOrderRequest = {
  name: string
  phone: string
  items: { productId: string; quantity: number }[]
}
export type PlaceOrderResponse = { orderId: string }

// The storefront menu (sold-out items included, archived ones not).
export type ProductsResponse = { products: Product[] }

// Back office.
export type LoginRequest = { email: string; password: string }
export type LoginResponse = { token: string; staff: StaffView }

export const ORDER_FILTERS = {
  pending: ["awaiting_verification"],
  confirmed: ["paid"],
  rejected: ["rejected", "payment_failed"],
  all: undefined,
} as const satisfies Record<string, readonly OrderStatus[] | undefined>

export type OrderFilter = keyof typeof ORDER_FILTERS

export type OrdersResponse = { orders: AdminOrderView[]; nextBefore: string | null }
export type ConfirmOrderRequest = { mpesaReceipt?: string }
export type RejectOrderRequest = { reason?: string }
export type OrderResponse = { order: AdminOrderView }
export type WsTicketResponse = { ticket: string }

// Messages on the back office WebSocket.
export type OrderSocketMessage =
  | { type: "ready" }
  | { type: "order.placed" | "order.updated"; order: AdminOrderView }

// Back office products.
export type AdminProduct = Omit<StoredProduct, "archivedAt"> & { archivedAt: string | null }
export type AdminProductsResponse = { products: AdminProduct[] }
export type AdminProductResponse = { product: AdminProduct }
export type ProductRequest = ProductDetails
export type ProductAvailabilityRequest = { available: boolean }
export type ProductArchiveRequest = { archived: boolean }
export type UploadResponse = { url: string }
export type ProductOrderRequest = { category: Product["category"]; ids: string[] }

export function toAdminProduct(product: StoredProduct): AdminProduct {
  return { ...product, archivedAt: product.archivedAt?.toISOString() ?? null }
}

export function toMenuProduct({ id, name, description, price, image, category, available }: Product): Product {
  return { id, name, description, price, image, category, available }
}
