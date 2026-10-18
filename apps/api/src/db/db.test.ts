import { PGlite } from "@electric-sql/pglite"
import type { Order, Staff } from "@ndutas/core"
import { kes } from "@ndutas/core"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { beforeAll, describe, expect, it } from "vitest"
import type { Db } from "./client.js"
import { DrizzleOrderRepository } from "./order-repository.js"
import { DrizzleStaffRepository } from "./staff-repository.js"
import * as schema from "./schema.js"

// A real Postgres engine in-process: runs the generated migrations, then exercises the
// repositories' row mapping, filters and upserts exactly as Neon will see them.
let db: Db

beforeAll(async () => {
  const pg = drizzle(new PGlite(), { schema })
  await migrate(pg, { migrationsFolder: "./drizzle" })
  db = pg as unknown as Db
})

function order(overrides: Partial<Order> & { id: string; createdAt: Date }): Order {
  return {
    reference: `NDT-${overrides.id.slice(0, 5).toUpperCase()}`,
    customer: { name: "Wanjiru", phone: "254712345678" as Order["customer"]["phone"] },
    lines: [{ productId: "a", name: "A", unitPrice: kes(1150), quantity: 2, lineTotal: kes(2300) }],
    total: kes(2300),
    status: "awaiting_verification",
    payment: {
      method: "manual",
      instruction: { kind: "manual", payTo: "0796 929 502", payToName: "Shelma Maina", amount: kes(2300), reference: "NDT-1" },
    },
    updatedAt: overrides.createdAt,
    ...overrides,
  }
}

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
]

describe("DrizzleOrderRepository", () => {
  it("round-trips an order, including JSON lines and the payment instruction", async () => {
    const repo = new DrizzleOrderRepository(db)
    const saved = order({ id: ids[0], createdAt: new Date("2026-10-14T08:00:00Z") })
    await repo.save(saved)
    expect(await repo.findById(ids[0])).toEqual(saved)
    expect(await repo.findById("not-a-uuid")).toBeNull()
    expect(await repo.findById("99999999-9999-4999-8999-999999999999")).toBeNull()
  })

  it("updates in place on save and keeps the original createdAt", async () => {
    const repo = new DrizzleOrderRepository(db)
    const first = (await repo.findById(ids[0]))!
    await repo.save({
      ...first,
      status: "paid",
      payment: { ...first.payment, mpesaReceipt: "SJK4H7Q2XZ" },
      updatedAt: new Date("2026-10-14T09:00:00Z"),
      createdAt: new Date("2030-01-01T00:00:00Z"),
    })
    expect(await repo.findById(ids[0])).toMatchObject({
      status: "paid",
      payment: { mpesaReceipt: "SJK4H7Q2XZ" },
      createdAt: new Date("2026-10-14T08:00:00Z"),
      updatedAt: new Date("2026-10-14T09:00:00Z"),
    })
  })

  it("lists newest first with status filters and paging", async () => {
    const repo = new DrizzleOrderRepository(db)
    await repo.save(order({ id: ids[1], createdAt: new Date("2026-10-14T10:00:00Z") }))
    await repo.save(order({ id: ids[2], createdAt: new Date("2026-10-14T11:00:00Z"), status: "rejected" }))

    expect((await repo.list({ limit: 10 })).map((o) => o.id)).toEqual([ids[2], ids[1], ids[0]])
    expect((await repo.list({ limit: 10, statuses: ["awaiting_verification"] })).map((o) => o.id)).toEqual([ids[1]])
    expect((await repo.list({ limit: 1, before: new Date("2026-10-14T11:00:00Z") })).map((o) => o.id)).toEqual([ids[1]])
  })

  it("finds STK orders by checkout request id", async () => {
    const repo = new DrizzleOrderRepository(db)
    const id = "44444444-4444-4444-8444-444444444444"
    await repo.save(
      order({
        id,
        createdAt: new Date("2026-10-14T12:00:00Z"),
        status: "pending_payment",
        payment: { method: "stk", instruction: { kind: "stk", checkoutRequestId: "ws_CO_1" } },
      })
    )
    expect((await repo.findByCheckoutRequestId("ws_CO_1"))?.id).toBe(id)
    expect(await repo.findByCheckoutRequestId("ws_CO_nope")).toBeNull()
  })
})

describe("DrizzleStaffRepository", () => {
  it("stores staff with roles, lists them and enforces unique emails", async () => {
    const repo = new DrizzleStaffRepository(db)
    const owner: Staff = {
      id: "55555555-5555-4555-8555-555555555555",
      email: "shelma@example.com",
      name: "Shelma Maina",
      role: "owner",
      passwordHash: "$2a$12$hash",
      createdAt: new Date("2026-10-14T08:00:00Z"),
      disabledAt: null,
    }
    const helper: Staff = {
      ...owner,
      id: "77777777-7777-4777-8777-777777777777",
      email: "jane@example.com",
      name: "Jane",
      role: "staff",
      createdAt: new Date("2026-10-14T09:00:00Z"),
    }
    await repo.save(owner)
    await repo.save(helper)
    expect(await repo.findByEmail("shelma@example.com")).toEqual(owner)
    expect((await repo.list()).map((m) => m.role)).toEqual(["owner", "staff"])

    const disabledAt = new Date("2026-10-15T08:00:00Z")
    await repo.save({ ...helper, disabledAt })
    expect((await repo.findById(helper.id))?.disabledAt).toEqual(disabledAt)
    await expect(repo.save({ ...owner, id: "66666666-6666-4666-8666-666666666666" })).rejects.toThrow()
  })
})
