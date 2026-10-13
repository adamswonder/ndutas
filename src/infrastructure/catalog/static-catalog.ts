import type { ProductCatalog } from "@/core/application/ports"
import type { Product } from "@/core/domain/product"

// Serves the hard-coded menu until products live in a database.
export class StaticCatalog implements ProductCatalog {
  constructor(private readonly products: readonly Product[]) {}

  async all() {
    return [...this.products]
  }

  async findByIds(ids: readonly string[]) {
    const wanted = new Set(ids)
    return this.products.filter((product) => wanted.has(product.id))
  }
}
