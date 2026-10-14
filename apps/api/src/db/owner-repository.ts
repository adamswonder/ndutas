import type { Owner, OwnerRepository } from "@ndutas/core"
import { eq } from "drizzle-orm"
import type { Db } from "./client.js"
import { owners } from "./schema.js"

export class DrizzleOwnerRepository implements OwnerRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<Owner | null> {
    const [row] = await this.db.select().from(owners).where(eq(owners.email, email)).limit(1)
    return row ?? null
  }

  async findById(id: string): Promise<Owner | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const [row] = await this.db.select().from(owners).where(eq(owners.id, id)).limit(1)
    return row ?? null
  }

  async save(owner: Owner) {
    const { id: _id, createdAt: _createdAt, ...changes } = owner
    await this.db.insert(owners).values(owner).onConflictDoUpdate({ target: owners.id, set: changes })
  }
}
