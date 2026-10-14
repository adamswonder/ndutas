import {
  MAX_ORDERS_PER_PAGE,
  ORDER_FILTERS,
  toAdminOrderView,
  toOwnerView,
  type ConfirmOrderRequest,
  type LoginRequest,
  type LoginResponse,
  type OrderFilter,
  type OrderResponse,
  type OrdersResponse,
  type OwnerView,
  type RejectOrderRequest,
  type WsTicketResponse,
} from "@ndutas/core"
import { Router, type RequestHandler } from "express"
import type { Container } from "../container.js"
import { HttpError } from "../errors.js"

type Locals = { owner: OwnerView }

// The back office's endpoints, called from the owner's browser with a Bearer session token.
export function adminRoutes(container: Container) {
  const router = Router()

  router.post("/login", async (req, res) => {
    const { email, password } = (req.body ?? {}) as Partial<LoginRequest>
    if (typeof email !== "string" || typeof password !== "string") {
      throw new HttpError(400, "Enter your email and password.")
    }
    const owner = await container.logIn(email, password)
    const token = await container.auth.issueSession(owner)
    res.json({ token, owner } satisfies LoginResponse)
  })

  // Everything below needs a signed-in owner.
  const requireOwner: RequestHandler = async (req, res, next) => {
    const token = /^Bearer (.+)$/.exec(req.get("authorization") ?? "")?.[1]
    const ownerId = token ? await container.auth.verifySession(token) : null
    // Re-read the owner so a deleted account loses access straight away.
    const owner = ownerId ? await container.owners.findById(ownerId) : null
    if (!owner) throw new HttpError(401, "Please sign in again.")
    ;(res.locals as Locals).owner = toOwnerView(owner)
    next()
  }
  router.use(requireOwner)

  router.get("/me", (_req, res) => {
    res.json({ owner: (res.locals as Locals).owner })
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
    const ticket = await container.auth.issueWsTicket((res.locals as Locals).owner.id)
    res.json({ ticket } satisfies WsTicketResponse)
  })

  return router
}
