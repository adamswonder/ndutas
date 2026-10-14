import { maskPhone } from "@/core/domain/phone"
import type { Order } from "@/core/domain/order"

// What the order page is allowed to show: no full phone number leaves the server.
export type OrderView = {
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

export function toOrderView(order: Order): OrderView {
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
