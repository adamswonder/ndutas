"use server"

import { retryPayment } from "@/server/api"

export type OrderActionResult = { ok: true } | { ok: false; error: string }

export async function retryPaymentAction(orderId: string): Promise<OrderActionResult> {
  if (typeof orderId !== "string") return { ok: false, error: "Invalid request." }
  const result = await retryPayment(orderId)
  return result.ok ? { ok: true } : { ok: false, error: result.error.error }
}
