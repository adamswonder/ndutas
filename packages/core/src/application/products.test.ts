import { describe, expect, it } from "vitest"
import { InMemoryOrderRepository } from "../adapters/in-memory-order-repository"
import { InMemoryProductRepository } from "../adapters/in-memory-product-repository"
import { kes } from "../domain/money"
import { productSlug, validateProductDetails, type ProductDetails } from "../domain/product"
import { makePlaceOrder } from "./place-order"
import type { PaymentGateway } from "./ports"
import {
  makeArchiveProduct,
  makeCreateProduct,
  makeReorderProducts,
  makeSetProductAvailability,
  makeUpdateProduct,
  type StoredProduct,
} from "./products"

const toast: StoredProduct = {
  id: "french-toast",
  name: "Berry French Toast",
  description: "Brioche, berries.",
  price: kes(1150),
  image: "https://images.unsplash.com/photo-1",
  category: "breakfast",
  available: true,
  sortOrder: 1,
  archivedAt: null,
}

const details: ProductDetails = {
  name: "  Masala   Chai Bun ",
  description: "Soft bun, chai spice.",
  price: 350,
  image: "https://images.unsplash.com/photo-2",
  category: "breakfast",
}

function setup() {
  const products = new InMemoryProductRepository([toast])
  const deps = { products, clock: { now: () => new Date("2026-10-14T08:00:00Z") } }
  return {
    products,
    create: makeCreateProduct(deps),
    update: makeUpdateProduct(deps),
    setAvailable: makeSetProductAvailability(deps),
    archive: makeArchiveProduct(deps),
  }
}

describe("product rules", () => {
  it("cleans up details and rejects bad ones", () => {
    expect(validateProductDetails(details)).toMatchObject({ name: "Masala Chai Bun" })
    expect(() => validateProductDetails({ ...details, price: 10.5 })).toThrow(/whole-shilling/)
    expect(() => validateProductDetails({ ...details, price: 0 })).toThrow(/price/)
    expect(() => validateProductDetails({ ...details, name: "x" })).toThrow(/name/)
    expect(() => validateProductDetails({ ...details, category: "snacks" as never })).toThrow(/breakfast/)
    expect(() => validateProductDetails({ ...details, image: "http://x.y/a.jpg" })).toThrow(/https/)
    expect(validateProductDetails({ ...details, image: "http://localhost:4000/uploads/a.webp" }).image).toMatch(/localhost/)
  })

  it("makes readable ids", () => {
    expect(productSlug("Berry French Toast")).toBe("berry-french-toast")
    expect(productSlug("Mama's Chapati & Beans!")).toBe("mama-s-chapati-beans")
  })
})

describe("product use cases", () => {
  it("creates products with unique ids at the end of their category", async () => {
    const app = setup()
    const first = await app.create(details)
    const second = await app.create(details)
    expect(first).toMatchObject({ id: "masala-chai-bun", sortOrder: 2, available: true, archivedAt: null })
    expect(second.id).toBe("masala-chai-bun-2")
  })

  it("updates details without touching availability or order", async () => {
    const app = setup()
    await app.setAvailable("french-toast", false)
    const updated = await app.update("french-toast", { ...details, name: "French Toast", price: 1200 })
    expect(updated).toMatchObject({ id: "french-toast", name: "French Toast", price: 1200, available: false, sortOrder: 1 })
    await expect(app.update("nope", details)).rejects.toThrow("Product not found.")
  })

  it("archives products off the menu and can restore them", async () => {
    const app = setup()
    await app.archive("french-toast")
    expect(await app.products.all()).toEqual([])
    expect((await app.products.listAll())[0].archivedAt).toEqual(new Date("2026-10-14T08:00:00Z"))
    await app.archive("french-toast", false)
    expect((await app.products.all()).map((p) => p.id)).toEqual(["french-toast"])
  })
})

describe("reordering the menu", () => {
  const second: StoredProduct = { ...toast, id: "egg-toast", name: "Egg Toast", sortOrder: 2 }
  const archived: StoredProduct = { ...toast, id: "old-toast", sortOrder: 3, archivedAt: new Date() }

  function reorderSetup() {
    const products = new InMemoryProductRepository([toast, second, archived])
    const reorder = makeReorderProducts({ products, clock: { now: () => new Date() } })
    return { products, reorder }
  }

  it("rewrites the category's order as 1..n", async () => {
    const { products, reorder } = reorderSetup()
    await reorder("breakfast", ["egg-toast", "french-toast"])
    expect((await products.all()).map((p) => [p.id, p.sortOrder])).toEqual([
      ["egg-toast", 1],
      ["french-toast", 2],
    ])
  })

  it("refuses a stale or partial list", async () => {
    const { reorder } = reorderSetup()
    await expect(reorder("breakfast", ["french-toast"])).rejects.toThrow(/refresh/)
    await expect(reorder("breakfast", ["french-toast", "french-toast"])).rejects.toThrow(/refresh/)
    await expect(reorder("breakfast", ["french-toast", "old-toast"])).rejects.toThrow(/refresh/)
    await expect(reorder("lunch", ["french-toast", "egg-toast"])).rejects.toThrow(/refresh/)
  })
})

describe("ordering sold-out products", () => {
  it("refuses to place an order that includes a sold-out item", async () => {
    const products = new InMemoryProductRepository([{ ...toast, available: false }])
    const gateway: PaymentGateway = {
      method: "manual",
      describe: () => ({ method: "manual", payTo: "0796929502", payToName: "Shelma Maina" }),
      start: async (order) => ({ kind: "manual", payTo: "0796929502", payToName: "Shelma Maina", amount: order.total, reference: order.reference }),
    }
    const placeOrder = makePlaceOrder({
      catalog: products,
      orders: new InMemoryOrderRepository(),
      gateway,
      ids: { orderId: () => "o1", orderReference: () => "NDT-1" },
      clock: { now: () => new Date() },
    })
    await expect(
      placeOrder({ name: "Amara", phone: "0712345678", items: [{ productId: "french-toast", quantity: 1 }] })
    ).rejects.toThrow("Berry French Toast is sold out right now.")
  })
})
