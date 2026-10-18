import {
  MAX_ORDERS_PER_PAGE,
  ORDER_FILTERS,
  toAdminOrderView,
  type ConfirmOrderRequest,
  type LoginRequest,
  type LoginResponse,
  type OrderFilter,
  type OrderResponse,
  type OrdersResponse,
  type RejectOrderRequest,
  type WsTicketResponse,
} from "@ndutas/core"
import { Router } from "express"
import type { Container } from "../container.js"
import { HttpError } from "../errors.js"
import { adminProductRoutes } from "./admin-products.js"
import { adminUploadRoutes } from "./admin-uploads.js"
import { currentStaff, requireStaff } from "./guards.js"

// The back office's endpoints, called from the browser with a Bearer session token.
export function adminRoutes(container: Container) {
  const router = Router()

  router.post("/login", async (req, res) => {
    const { email, password } = (req.body ?? {}) as Partial<LoginRequest>
    if (typeof email !== "string" || typeof password !== "string") {
      throw new HttpError(400, "Enter your email and password.")
    }
    const staff = await container.logIn(email, password)
    const token = await container.auth.issueSession(staff)
    res.json({ token, staff } satisfies LoginResponse)
  })

  // Everything below needs a signed-in, active staff member.
  router.use(requireStaff(container))

  router.use("/products", adminProductRoutes(container))
  router.use("/uploads", adminUploadRoutes(container))

  router.get("/me", (_req, res) => {
    res.json({ staff: currentStaff(res) })
  })

  router.get("/orders", async (req, res) => {
    const filter = (req.query.filter ?? "pending") as OrderFilter
    if (!Object.hasOwn(ORDER_FILTERS, filter)) throw new HttpError(400, "Unknown filter.")
    const before = typeof req.query.before === "string" ? new Date(req.query.before) : undefined
    if (before && Number.isNaN(before.getTime())) throw new HttpError(400, "Invalid date.")
    const limit = Math.min(Math.max(Math.trunc(Number(req.query.limit)) || 50, 1), MAX_ORDERS_PER_PAGE)

    const orders = await container.listOrders({ statuses: ORDER_FILTERS[filter], before, limit })
    const last = orders.at(-1)
    res.json({
      orders: orders.map(toAdminOrderView),
      nextBefore: orders.length === limit && last ? last.createdAt.toISOString() : null,
    } satisfies OrdersResponse)
  })

  router.post("/orders/:id/confirm", async (req, res) => {
    const { mpesaReceipt } = (req.body ?? {}) as ConfirmOrderRequest
    if (mpesaReceipt !== undefined && typeof mpesaReceipt !== "string") {
      throw new HttpError(400, "Invalid M-Pesa code.")
    }
    const order = await container.confirmManualPayment(req.params.id, mpesaReceipt)
    res.json({ order: toAdminOrderView(order) } satisfies OrderResponse)
  })

  router.post("/orders/:id/reject", async (req, res) => {
    const { reason } = (req.body ?? {}) as RejectOrderRequest
    if (reason !== undefined && typeof reason !== "string") throw new HttpError(400, "Invalid reason.")
    const order = await container.rejectManualPayment(req.params.id, reason ?? "")
    res.json({ order: toAdminOrderView(order) } satisfies OrderResponse)
  })

  router.post("/ws-ticket", async (_req, res) => {
    const ticket = await container.auth.issueWsTicket(currentStaff(res).id)
    res.json({ ticket } satisfies WsTicketResponse)
  })

  return router
}
