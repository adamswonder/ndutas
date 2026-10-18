import type { ProductRepository, StoredProduct } from "../application/products"

// Stand-in for the products table in core's unit tests.
export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, StoredProduct>()

  constructor(initial: readonly StoredProduct[] = []) {
    for (const product of initial) this.products.set(product.id, structuredClone(product))
  }

  private menu() {
    return this.listSync().filter((product) => !product.archivedAt)
  }

  private listSync() {
    return [...this.products.values()]
      .sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder)
      .map((product) => structuredClone(product))
  }

  async all() {
    return this.menu()
  }

  async findByIds(ids: readonly string[]) {
    const wanted = new Set(ids)
    return this.menu().filter((product) => wanted.has(product.id))
  }

  async findById(id: string) {
    const product = this.products.get(id)
    return product ? structuredClone(product) : null
  }

  async listAll() {
    return this.listSync()
  }

  async save(product: StoredProduct) {
    this.products.set(product.id, structuredClone(product))
  }
}
