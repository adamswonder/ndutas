"use server"

import { placeOrder } from "@/server/api"

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error?: string; fieldErrors?: { name?: string; phone?: string } }

export async function placeOrderAction(input: {
  name: string
  phone: string
  items: { productId: string; quantity: number }[]
}): Promise<PlaceOrderResult> {
  // Server actions are public endpoints: check the shape before passing it on.
  // The API checks again and re-prices everything from the catalog.
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

  const result = await placeOrder({
    name: input.name,
    phone: input.phone,
    items: input.items.map(({ productId, quantity }) => ({ productId, quantity })),
  })
  if (result.ok) return { ok: true, orderId: result.data.orderId }
  if (result.error.fieldErrors) return { ok: false, fieldErrors: result.error.fieldErrors }
  return { ok: false, error: result.error.error }
}
