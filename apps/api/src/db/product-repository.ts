import type { ProductRepository, StoredProduct } from "@ndutas/core"
import { and, asc, eq, inArray, isNull } from "drizzle-orm"
import type { Db } from "./client.js"
import { products } from "./schema.js"

const menuOrder = [asc(products.category), asc(products.sortOrder), asc(products.name)]

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: Db) {}

  // The menu: archived products are left out, sold-out ones stay (shown as "Sold out").
  async all(): Promise<StoredProduct[]> {
    return this.db.select().from(products).where(isNull(products.archivedAt)).orderBy(...menuOrder)
  }

  async findByIds(ids: readonly string[]): Promise<StoredProduct[]> {
    if (ids.length === 0) return []
    return this.db
      .select()
      .from(products)
      .where(and(inArray(products.id, [...ids]), isNull(products.archivedAt)))
  }

  async findById(id: string): Promise<StoredProduct | null> {
    const [row] = await this.db.select().from(products).where(eq(products.id, id)).limit(1)
    return row ?? null
  }

  async listAll(): Promise<StoredProduct[]> {
    return this.db.select().from(products).orderBy(...menuOrder)
  }

  async save(product: StoredProduct) {
    const { id: _id, ...changes } = product
    await this.db.insert(products).values(product).onConflictDoUpdate({ target: products.id, set: changes })
  }
}
