import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { createApiServer } from "./http-server.js"
import { createTestContainer } from "./test-support.js"

const { config, container } = await createTestContainer()
const server = createApiServer(container, config)
const owner = { email: "shelma@example.com", name: "Shelma Maina", password: "correct horse battery", role: "owner" as const }
const helper = { email: "jane@example.com", name: "Jane", password: "correct horse battery", role: "staff" as const }
const tokens: Record<string, string> = {}

beforeAll(async () => {
  for (const member of [owner, helper]) {
    await container.createStaff(member)
    const res = await request(server).post("/admin/login").send(member).expect(200)
    tokens[member.role] = `Bearer ${res.body.token}`
  }
})

const newProduct = {
  name: "Masala Chai Bun",
  description: "Soft bun, chai spice.",
  price: 350,
  image: "https://images.unsplash.com/photo-1",
  category: "breakfast",
}

describe("menu", () => {
  it("serves the seeded menu in category order", async () => {
    const res = await request(server).get("/products").expect(200)
    expect(res.body.products).toHaveLength(22)
    expect(res.body.products[0]).toEqual({
      id: "french-toast",
      name: "Berry French Toast",
      description: "Brioche, banana, blueberries, maple.",
      price: 1150,
      image: expect.stringMatching(/^https:\/\/images\.unsplash\.com/),
      category: "breakfast",
      available: true,
    })
    // No back office fields leak to the storefront.
    expect(res.body.products[0]).not.toHaveProperty("sortOrder")
  })
})

describe("back office products", () => {
  it("lets staff mark items sold out, which blocks ordering them", async () => {
    await request(server)
      .patch("/admin/products/egg-toast/availability")
      .set("authorization", tokens.staff)
      .send({ available: false })
      .expect(200)
    const order = await request(server)
      .post("/orders")
      .send({ name: "Wanjiru", phone: "0712345678", items: [{ productId: "egg-toast", quantity: 1 }] })
      .expect(422)
    expect(order.body.error).toMatch(/Sunny Egg Toast is sold out/)
    const menu = await request(server).get("/products")
    expect(menu.body.products.find((p: { id: string }) => p.id === "egg-toast").available).toBe(false)
  })

  it("keeps editing the menu to the owner", async () => {
    await request(server).post("/admin/products").set("authorization", tokens.staff).send(newProduct).expect(403)
    await request(server).put("/admin/products/french-toast").set("authorization", tokens.staff).send(newProduct).expect(403)
    await request(server)
      .patch("/admin/products/french-toast/archive")
      .set("authorization", tokens.staff)
      .send({ archived: true })
      .expect(403)
  })

  it("lets the owner reorder a category, which the menu then follows", async () => {
    const lunch = (await request(server).get("/products")).body.products
      .filter((p: { category: string }) => p.category === "lunch")
      .map((p: { id: string }) => p.id)
    const reversed = [...lunch].reverse()
    await request(server)
      .put("/admin/products/order")
      .set("authorization", tokens.staff)
      .send({ category: "lunch", ids: reversed })
      .expect(403)
    await request(server)
      .put("/admin/products/order")
      .set("authorization", tokens.owner)
      .send({ category: "lunch", ids: reversed.slice(1) })
      .expect(422)
    await request(server)
      .put("/admin/products/order")
      .set("authorization", tokens.owner)
      .send({ category: "lunch", ids: reversed })
      .expect(200)
    const menu = (await request(server).get("/products")).body.products
    expect(menu.filter((p: { category: string }) => p.category === "lunch").map((p: { id: string }) => p.id)).toEqual(reversed)
  })

  it("lets the owner add, edit and archive products", async () => {
    const created = await request(server).post("/admin/products").set("authorization", tokens.owner).send(newProduct).expect(201)
    expect(created.body.product).toMatchObject({ id: "masala-chai-bun", sortOrder: 7, available: true, archivedAt: null })

    const edited = await request(server)
      .put("/admin/products/masala-chai-bun")
      .set("authorization", tokens.owner)
      .send({ ...newProduct, price: 400 })
      .expect(200)
    expect(edited.body.product.price).toBe(400)

    await request(server)
      .put("/admin/products/masala-chai-bun")
      .set("authorization", tokens.owner)
      .send({ ...newProduct, price: -1 })
      .expect(422)

    await request(server)
      .patch("/admin/products/masala-chai-bun/archive")
      .set("authorization", tokens.owner)
      .send({ archived: true })
      .expect(200)
    const menu = await request(server).get("/products")
    expect(menu.body.products.some((p: { id: string }) => p.id === "masala-chai-bun")).toBe(false)

    const all = await request(server).get("/admin/products").set("authorization", tokens.staff).expect(200)
    expect(all.body.products.find((p: { id: string }) => p.id === "masala-chai-bun").archivedAt).toEqual(expect.any(String))
    await request(server).put("/admin/products/nope").set("authorization", tokens.owner).send(newProduct).expect(404)
  })
})
