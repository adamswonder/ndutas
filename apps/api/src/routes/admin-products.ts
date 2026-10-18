import {
  toAdminProduct,
  type AdminProductResponse,
  type AdminProductsResponse,
  type ProductArchiveRequest,
  type ProductAvailabilityRequest,
  type ProductOrderRequest,
  type ProductRequest,
} from "@ndutas/core"
import { Router, type Response } from "express"
import type { Container } from "../container.js"
import { HttpError } from "../errors.js"
import { requireRole } from "./guards.js"

// /admin/products: anyone signed in can mark items sold out; only the owner edits the menu.
export function adminProductRoutes(container: Container) {
  const router = Router()

  function sendProduct(res: Response, product: Parameters<typeof toAdminProduct>[0]) {
    container.menuChanged()
    res.json({ product: toAdminProduct(product) } satisfies AdminProductResponse)
  }

  router.get("/", async (_req, res) => {
    const products = await container.products.listAll()
    res.json({ products: products.map(toAdminProduct) } satisfies AdminProductsResponse)
  })

  router.patch("/:id/availability", async (req, res) => {
    const { available } = (req.body ?? {}) as Partial<ProductAvailabilityRequest>
    if (typeof available !== "boolean") throw new HttpError(400, "Say whether it is available.")
    sendProduct(res, await container.setProductAvailability(req.params.id, available))
  })

  router.post("/", requireRole("owner"), async (req, res) => {
    const product = await container.createProduct(parseDetails(req.body))
    container.menuChanged()
    res.status(201).json({ product: toAdminProduct(product) } satisfies AdminProductResponse)
  })

  // Before "/:id", or Express would read "order" as a product id.
  router.put("/order", requireRole("owner"), async (req, res) => {
    const { category, ids } = (req.body ?? {}) as Partial<ProductOrderRequest>
    if (typeof category !== "string" || !Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
      throw new HttpError(400, "Send the category and the product ids in their new order.")
    }
    const products = await container.reorderProducts(category, ids)
    container.menuChanged()
    res.json({ products: products.map(toAdminProduct) } satisfies AdminProductsResponse)
  })

  router.put("/:id", requireRole("owner"), async (req, res) => {
    sendProduct(res, await container.updateProduct(String(req.params.id), parseDetails(req.body)))
  })

  router.patch("/:id/archive", requireRole("owner"), async (req, res) => {
    const { archived } = (req.body ?? {}) as Partial<ProductArchiveRequest>
    if (typeof archived !== "boolean") throw new HttpError(400, "Say whether to archive it.")
    sendProduct(res, await container.archiveProduct(String(req.params.id), archived))
  })

  return router
}

function parseDetails(body: unknown): ProductRequest {
  const input = (body ?? {}) as Partial<Record<keyof ProductRequest, unknown>>
  if (
    typeof input.name !== "string" ||
    typeof input.description !== "string" ||
    typeof input.price !== "number" ||
    typeof input.image !== "string" ||
    typeof input.category !== "string"
  ) {
    throw new HttpError(400, "Fill in the name, description, price, photo and category.")
  }
  return {
    name: input.name,
    description: input.description,
    price: input.price,
    image: input.image,
    category: input.category as ProductRequest["category"],
  }
}
