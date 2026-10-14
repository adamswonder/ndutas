import {
  DomainError,
  toPublicOrderView,
  type PlaceOrderRequest,
  type PlaceOrderResponse,
  type PaymentSetup,
  type PublicOrderView,
} from "@ndutas/core"
import { Router } from "express"
import type { Container } from "../container.js"
import { HttpError } from "../errors.js"

// The storefront's endpoints. apps/web calls these server-to-server.
export function publicRoutes(container: Container) {
  const router = Router()

  router.get("/health", (_req, res) => {
    res.json({ ok: true })
  })

  router.get("/payment-setup", (_req, res) => {
    res.json(container.paymentSetup satisfies PaymentSetup)
  })

  router.post("/orders", async (req, res) => {
    const order = await container.placeOrder(parsePlaceOrder(req.body))
    res.status(201).json({ orderId: order.id } satisfies PlaceOrderResponse)
  })

  router.get("/orders/:id", async (req, res) => {
    const order = await container.getOrder(req.params.id)
    if (!order) throw new DomainError("order_not_found", "Order not found.")
    res.json(toPublicOrderView(order) satisfies PublicOrderView)
  })

  router.post("/orders/:id/retry", async (req, res) => {
    const order = await container.retryPayment(req.params.id)
    res.json(toPublicOrderView(order) satisfies PublicOrderView)
  })

  return router
}

// The API is public: check the shape before anything trusts it. Prices never come from here.
function parsePlaceOrder(body: unknown): PlaceOrderRequest {
  const input = body as Partial<PlaceOrderRequest> | undefined
  if (
    typeof input?.name !== "string" ||
    typeof input.phone !== "string" ||
    !Array.isArray(input.items) ||
    input.items.length > 100 ||
    !input.items.every(
      (item) => typeof item?.productId === "string" && typeof item?.quantity === "number"
    )
  ) {
    throw new HttpError(400, "Something went wrong. Please refresh and try again.")
  }
  return {
    name: input.name,
    phone: input.phone,
    items: input.items.map(({ productId, quantity }) => ({ productId, quantity })),
  }
}
