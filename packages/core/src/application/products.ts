import { DomainError } from "../domain/errors"
import {
  productSlug,
  validateProductDetails,
  type MealCategory,
  type Product,
  type ProductDetails,
} from "../domain/product"
import type { ProductCatalog } from "./ports"

// A product as stored: the menu entry plus its place in the list and whether it was archived.
// Archived products disappear from the menu but stay on old orders.
export type StoredProduct = Product & { sortOrder: number; archivedAt: Date | null }

export interface ProductRepository extends ProductCatalog {
  findById(id: string): Promise<StoredProduct | null>
  // Everything, archived included, for the back office.
  listAll(): Promise<StoredProduct[]>
  save(product: StoredProduct): Promise<void>
}

type Deps = { products: ProductRepository; clock: { now(): Date } }

async function load(products: ProductRepository, id: string) {
  const product = await products.findById(id)
  if (!product) throw new DomainError("product_not_found", "Product not found.")
  return product
}

export function makeCreateProduct(deps: Deps) {
  return async function createProduct(input: ProductDetails): Promise<StoredProduct> {
    const details = validateProductDetails(input)
    const all = await deps.products.listAll()
    const taken = new Set(all.map((product) => product.id))
    const base = productSlug(details.name)
    let id = base
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`

    const product: StoredProduct = {
      id,
      ...details,
      available: true,
      // New products go to the end of their category.
      sortOrder: Math.max(0, ...all.filter((p) => p.category === details.category).map((p) => p.sortOrder)) + 1,
      archivedAt: null,
    }
    await deps.products.save(product)
    return product
  }
}

export function makeUpdateProduct(deps: Deps) {
  return async function updateProduct(id: string, input: ProductDetails): Promise<StoredProduct> {
    const product = { ...(await load(deps.products, id)), ...validateProductDetails(input) }
    await deps.products.save(product)
    return product
  }
}

// Staff can mark things sold out (or back in stock) during the day.
export function makeSetProductAvailability(deps: Deps) {
  return async function setAvailability(id: string, available: boolean): Promise<StoredProduct> {
    const product = { ...(await load(deps.products, id)), available }
    await deps.products.save(product)
    return product
  }
}

export function makeArchiveProduct(deps: Deps) {
  return async function archiveProduct(id: string, archived = true): Promise<StoredProduct> {
    const current = await load(deps.products, id)
    const product = { ...current, archivedAt: archived ? (current.archivedAt ?? deps.clock.now()) : null }
    await deps.products.save(product)
    return product
  }
}

// Owner drags products into a new menu order within one category. The ids must be exactly
// that category's products on the menu (not archived), so a stale screen can't scramble it.
export function makeReorderProducts(deps: Deps) {
  return async function reorderProducts(category: MealCategory, ids: readonly string[]): Promise<StoredProduct[]> {
    const current = (await deps.products.listAll()).filter(
      (product) => product.category === category && !product.archivedAt
    )
    const same =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      ids.every((id) => current.some((product) => product.id === id))
    if (!same) {
      throw new DomainError("invalid_product", "The menu changed while you were sorting. Please refresh and try again.")
    }
    const reordered = ids.map((id, index) => ({
      ...current.find((product) => product.id === id)!,
      sortOrder: index + 1,
    }))
    for (const product of reordered) await deps.products.save(product)
    return reordered
  }
}
