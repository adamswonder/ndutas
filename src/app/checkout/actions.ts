"use server"

import { isDomainError } from "@/core/domain/errors"
import { container } from "@/server/container"

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error?: string; fieldErrors?: { name?: string; phone?: string } }

export async function placeOrderAction(input: {
  name: string
  phone: string
  items: { productId: string; quantity: number }[]
}): Promise<PlaceOrderResult> {
  // Server actions are public endpoints: check the shape before trusting it.
  if (
    typeof input?.name !== "string" ||
    typeof input?.phone !== "string" ||
    !Array.isArray(input?.items) ||
    input.items.length > 100 ||
    !input.items.every(
      (item) => typeof item?.productId === "string" && typeof item?.quantity === "number"
    )
  ) {
    return { ok: false, error: "Something went wrong. Please refresh and try again." }
  }

  try {
    const order = await container().placeOrder({
      name: input.name,
      phone: input.phone,
      items: input.items.map(({ productId, quantity }) => ({ productId, quantity })),
    })
    return { ok: true, orderId: order.id }
  } catch (error) {
    if (!isDomainError(error)) throw error
    if (error.code === "invalid_name") return { ok: false, fieldErrors: { name: error.message } }
    if (error.code === "invalid_phone") return { ok: false, fieldErrors: { phone: error.message } }
    return { ok: false, error: error.message }
  }
}
