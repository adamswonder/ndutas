import type { AddressInfo } from "node:net"
import type { Server } from "node:http"
import type { OrderSocketMessage } from "@ndutas/core"
import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { WebSocket } from "ws"
import { createApiServer } from "./http-server.js"
import { createTestContainer } from "./test-support.js"

const { config, container } = await createTestContainer()
let server: Server
let base: string

const owner = { email: "shelma@example.com", name: "Shelma Maina", password: "correct horse battery", role: "owner" as const }
const goodOrder = { name: "Wanjiru", phone: "0712 345 678", items: [{ productId: "french-toast", quantity: 2 }] }

beforeAll(async () => {
  await container.createStaff(owner)
  server = createApiServer(container, config)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

async function token() {
  const res = await request(server).post("/admin/login").send({ email: owner.email, password: owner.password })
  return res.body.token as string
}

describe("public API", () => {
  it("reports health and the Pochi payment setup", async () => {
    await request(server).get("/health").expect(200, { ok: true })
    await request(server)
      .get("/payment-setup")
      .expect(200, { method: "manual", payTo: "0796 929 502", payToName: "Shelma Maina" })
  })

  it("rejects malformed and invalid orders", async () => {
    await request(server).post("/orders").send({ name: 1 }).expect(400)
    await request(server).post("/orders").set("content-type", "application/json").send("{oops").expect(400)
    const res = await request(server).post("/orders").send({ ...goodOrder, phone: "0812 345 678" }).expect(422)
    expect(res.body.fieldErrors.phone).toMatch(/07 or 01/)
  })

  it("places a Pochi order and shows it with the phone masked", async () => {
    const placed = await request(server).post("/orders").send(goodOrder).expect(201)
    const res = await request(server).get(`/orders/${placed.body.orderId}`).expect(200)
    expect(res.body).toMatchObject({
      status: "awaiting_verification",
      maskedPhone: "2547•••••678",
      total: 2300,
      instruction: { kind: "manual", payToName: "Shelma Maina" },
    })
    expect(res.body).not.toHaveProperty("customerPhone")
    await request(server).get("/orders/not-a-real-id").expect(404)
  })
})

describe("back office API", () => {
  it("requires a valid session", async () => {
    await request(server).get("/admin/orders").expect(401)
    await request(server).get("/admin/orders").set("authorization", "Bearer nonsense").expect(401)
    const wrong = await request(server)
      .post("/admin/login")
      .send({ email: owner.email, password: "wrong password" })
      .expect(401)
    expect(wrong.body.error).toBe("Wrong email or password.")
  })

  it("lists pending orders with the full phone, then confirms and rejects", async () => {
    const auth = `Bearer ${await token()}`
    const { body } = await request(server).post("/orders").send(goodOrder).expect(201)

    const pending = await request(server).get("/admin/orders?filter=pending").set("authorization", auth).expect(200)
    expect(pending.body.orders[0]).toMatchObject({ id: body.orderId, customerPhone: "254712345678" })

    const confirmed = await request(server)
      .post(`/admin/orders/${body.orderId}/confirm`)
      .set("authorization", auth)
      .send({ mpesaReceipt: "sjk4h7q2xz" })
      .expect(200)
    expect(confirmed.body.order).toMatchObject({ status: "paid", mpesaReceipt: "SJK4H7Q2XZ" })

    // Already paid: can't be rejected any more.
    await request(server).post(`/admin/orders/${body.orderId}/reject`).set("authorization", auth).send({}).expect(409)
    await request(server).get("/admin/orders?filter=nope").set("authorization", auth).expect(400)
  })

  it("allows the web origin for browser calls", async () => {
    const res = await request(server)
      .options("/admin/orders")
      .set("origin", "http://localhost:3000")
      .set("access-control-request-method", "GET")
      .set("access-control-request-headers", "authorization")
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000")
  })
})

describe("order WebSocket", () => {
  function connect(ticket?: string) {
    const ws = new WebSocket(`${base.replace("http", "ws")}/admin/ws${ticket ? `?ticket=${ticket}` : ""}`)
    const messages: OrderSocketMessage[] = []
    ws.on("message", (data) => messages.push(JSON.parse(String(data))))
    const next = async (type: OrderSocketMessage["type"]) => {
      for (let i = 0; i < 50; i++) {
        const found = messages.find((m) => m.type === type)
        if (found) return found
        await new Promise((r) => setTimeout(r, 20))
      }
      throw new Error(`No ${type} message`)
    }
    return { ws, next }
  }

  it("refuses connections without a valid ticket", async () => {
    const { ws } = connect("bad")
    const status = await new Promise<number>((resolve) =>
      ws.on("unexpected-response", (_req, res) => resolve(res.statusCode ?? 0))
    )
    expect(status).toBe(401)
  })

  it("pushes placed and updated orders to every signed-in owner", async () => {
    const auth = `Bearer ${await token()}`
    const ticket = async () =>
      (await request(server).post("/admin/ws-ticket").set("authorization", auth).expect(200)).body.ticket
    const a = connect(await ticket())
    const b = connect(await ticket())
    await a.next("ready")
    await b.next("ready")

    const { body } = await request(server).post("/orders").send(goodOrder).expect(201)
    for (const client of [a, b]) {
      const placed = await client.next("order.placed")
      expect(placed).toMatchObject({ order: { id: body.orderId, customerPhone: "254712345678" } })
    }

    await request(server).post(`/admin/orders/${body.orderId}/reject`).set("authorization", auth).send({ reason: "No payment" })
    expect(await a.next("order.updated")).toMatchObject({
      order: { id: body.orderId, status: "rejected", failureReason: "No payment" },
    })

    a.ws.close()
    b.ws.close()
  })
})
