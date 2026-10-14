"use server"

import { isDomainError } from "@/core/domain/errors"
import { container } from "@/server/container"

export type OrderActionResult = { ok: true } | { ok: false; error: string }

async function run(fn: () => Promise<unknown>): Promise<OrderActionResult> {
  try {
    await fn()
    return { ok: true }
  } catch (error) {
    if (isDomainError(error)) return { ok: false, error: error.message }
    throw error
  }
}

export async function retryPaymentAction(orderId: string) {
  if (typeof orderId !== "string") {
    return { ok: false, error: "Invalid request." } satisfies OrderActionResult
  }
  return run(() => container().retryPayment(orderId))
}
