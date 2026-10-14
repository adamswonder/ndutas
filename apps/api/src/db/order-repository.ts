import type { KenyanPhone, Order, OrderQuery, OrderRepository } from "@ndutas/core"
import { and, desc, eq, inArray, lt, type SQL } from "drizzle-orm"
import type { Db } from "./client.js"
import { orders } from "./schema.js"

type Row = typeof orders.$inferSelect

function toRow(order: Order): Row {
  const instruction = order.payment.instruction ?? null
  return {
    id: order.id,
    reference: order.reference,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    method: order.payment.method,
    status: order.status,
    total: order.total,
    lines: order.lines,
    instruction,
    checkoutRequestId: instruction?.kind === "stk" ? instruction.checkoutRequestId : null,
    mpesaReceipt: order.payment.mpesaReceipt ?? null,
    failureReason: order.payment.failureReason ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function toOrder(row: Row): Order {
  return {
    id: row.id,
    reference: row.reference,
    customer: { name: row.customerName, phone: row.customerPhone as KenyanPhone },
    lines: row.lines,
    total: row.total,
    status: row.status,
    payment: {
      method: row.method,
      instruction: row.instruction ?? undefined,
      mpesaReceipt: row.mpesaReceipt ?? undefined,
      failureReason: row.failureReason ?? undefined,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: Db) {}

  async save(order: Order) {
    const row = toRow(order)
    const { id: _id, createdAt: _createdAt, ...changes } = row
    await this.db.insert(orders).values(row).onConflictDoUpdate({ target: orders.id, set: changes })
  }

  async findById(id: string) {
    // Order ids are UUIDs; anything else can't exist (and would make Postgres throw).
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1)
    return row ? toOrder(row) : null
  }

  async findByCheckoutRequestId(checkoutRequestId: string) {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.checkoutRequestId, checkoutRequestId))
      .limit(1)
    return row ? toOrder(row) : null
  }

  async list({ statuses, limit, before }: OrderQuery) {
    const filters: SQL[] = []
    if (statuses) filters.push(inArray(orders.status, [...statuses]))
    if (before) filters.push(lt(orders.createdAt, before))
    const rows = await this.db
      .select()
      .from(orders)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
    return rows.map(toOrder)
  }
}
