import { describe, expect, it } from "vitest"
import { InMemoryOrderRepository } from "../adapters/in-memory-order-repository"
import { InMemoryStaffRepository } from "../adapters/in-memory-staff-repository"
import { StaticCatalog } from "../catalog/static-catalog"
import { toAdminOrderView, toPublicOrderView } from "../contracts"
import type { Product } from "../domain/product"
import {
  makeConfirmManualPayment,
  makeListOrders,
  makeRejectManualPayment,
  makeRetryPayment,
} from "./manage-order"
import { makeCreateStaff, makeLogIn, type PasswordHasher } from "./staff"
import { makePlaceOrder } from "./place-order"
import type { OrderEvent, PaymentGateway } from "./ports"

const products: Product[] = [
  { id: "a", name: "A", description: "", price: 1150, image: "", category: "lunch", available: true },
]

const pochi: PaymentGateway = {
  method: "manual",
  describe: () => ({ method: "manual", payTo: "0796929502", payToName: "Shelma Maina" }),
  start: async (order) => ({
    kind: "manual",
    payTo: "0796929502",
    payToName: "Shelma Maina",
    amount: order.total,
    reference: order.reference,
  }),
}

function setup() {
  let n = 0
  let minutes = 0
  const events: OrderEvent[] = []
  const deps = {
    catalog: new StaticCatalog(products),
    orders: new InMemoryOrderRepository(),
    gateway: pochi,
    ids: { orderId: () => `order-${++n}`, orderReference: () => `NDT-${n}` },
    // Each call is a minute later, so orders have distinct createdAt values.
    clock: { now: () => new Date(Date.UTC(2026, 9, 14, 9, minutes++)) },
    events: { publish: async (event: OrderEvent) => void events.push(event) },
  }
  const place = makePlaceOrder(deps)
  const order = (phone = "0712345678") =>
    place({ name: "Amara", phone, items: [{ productId: "a", quantity: 1 }] })
  return {
    deps,
    events,
    order,
    list: makeListOrders(deps),
    confirm: makeConfirmManualPayment(deps),
    reject: makeRejectManualPayment(deps),
    retry: makeRetryPayment(deps),
  }
}

describe("order events", () => {
  it("announces placed orders and owner decisions", async () => {
    const app = setup()
    const placed = await app.order()
    await app.confirm(placed.id)
    expect(app.events.map((e) => [e.type, e.order.status])).toEqual([
      ["order.placed", "awaiting_verification"],
      ["order.updated", "paid"],
    ])
  })

  it("still places the order when publishing fails", async () => {
    const app = setup()
    app.deps.events.publish = async () => {
      throw new Error("socket hub down")
    }
    const placed = await makePlaceOrder(app.deps)({
      name: "Amara",
      phone: "0712345678",
      items: [{ productId: "a", quantity: 1 }],
    })
    expect(await app.deps.orders.findById(placed.id)).not.toBeNull()
  })

  it("uses a default reason when the owner rejects without one", async () => {
    const app = setup()
    const placed = await app.order()
    const rejected = await app.reject(placed.id, "   ")
    expect(rejected.payment.failureReason).toMatch(/matching M-Pesa payment/)
    expect(app.events.at(-1)?.type).toBe("order.updated")
  })
})

describe("listOrders", () => {
  it("returns newest first, filters by status and pages with `before`", async () => {
    const app = setup()
    const first = await app.order()
    const second = await app.order()
    const third = await app.order()
    await app.confirm(second.id)

    expect((await app.list()).map((o) => o.id)).toEqual([third.id, second.id, first.id])
    expect((await app.list({ statuses: ["awaiting_verification"] })).map((o) => o.id)).toEqual([
      third.id,
      first.id,
    ])
    expect((await app.list({ limit: 1, before: third.createdAt })).map((o) => o.id)).toEqual([
      second.id,
    ])
  })

  it("clamps the page size", async () => {
    const app = setup()
    await app.order()
    expect(await app.list({ limit: 0 })).toHaveLength(1)
  })
})

describe("order views", () => {
  it("masks the phone for customers but not for the owner", async () => {
    const placed = await setup().order()
    expect(toPublicOrderView(placed)).toMatchObject({ maskedPhone: "2547•••••678" })
    expect(toPublicOrderView(placed)).not.toHaveProperty("customerPhone")
    expect(toAdminOrderView(placed)).toMatchObject({
      customerPhone: "254712345678",
      createdAt: placed.createdAt.toISOString(),
    })
  })
})

describe("staff accounts", () => {
  // Reversible fake: enough to prove the use cases never store the plain password.
  const passwords: PasswordHasher = {
    hash: async (p) => `hashed:${p}`,
    verify: async (p, h) => h === `hashed:${p}`,
  }

  function accounts() {
    let n = 0
    const deps = {
      staff: new InMemoryStaffRepository(),
      passwords,
      ids: { staffId: () => `staff-${++n}` },
      clock: { now: () => new Date() },
    }
    return { deps, create: makeCreateStaff(deps), logIn: makeLogIn(deps) }
  }

  it("creates an owner with a hashed password and lets them log in", async () => {
    const { deps, create, logIn } = accounts()
    await create({ email: " Shelma@Example.com ", name: "Shelma Maina", password: "correct horse", role: "owner" })
    expect((await deps.staff.findByEmail("shelma@example.com"))?.passwordHash).toBe("hashed:correct horse")
    expect(await logIn("SHELMA@example.com", "correct horse")).toEqual({
      id: "staff-1",
      email: "shelma@example.com",
      name: "Shelma Maina",
      role: "owner",
    })
  })

  it("gives the same error for a wrong password, an unknown email and a disabled account", async () => {
    const { deps, create, logIn } = accounts()
    const helper = await create({ email: "jane@example.com", name: "Jane", password: "correct horse", role: "staff" })
    await expect(logIn("jane@example.com", "nope")).rejects.toThrow("Wrong email or password.")
    await expect(logIn("who@example.com", "correct horse")).rejects.toThrow("Wrong email or password.")
    const stored = (await deps.staff.findById(helper.id))!
    await deps.staff.save({ ...stored, disabledAt: new Date() })
    await expect(logIn("jane@example.com", "correct horse")).rejects.toThrow("Wrong email or password.")
  })

  it("rejects weak passwords, bad emails, unknown roles and duplicates", async () => {
    const { create } = accounts()
    const base = { name: "S", password: "correct horse", role: "staff" as const }
    await expect(create({ ...base, email: "x" })).rejects.toThrow(/email/)
    await expect(create({ ...base, email: "s@e.co", password: "short" })).rejects.toThrow(/10/)
    await expect(create({ ...base, email: "s@e.co", role: "boss" as never })).rejects.toThrow(/role/)
    await create({ ...base, email: "s@e.co" })
    await expect(create({ ...base, email: "S@E.co" })).rejects.toThrow(/already/)
  })
})
