import type { Staff, StaffRepository } from "@ndutas/core"
import { asc, eq } from "drizzle-orm"
import type { Db } from "./client.js"
import { staff } from "./schema.js"

export class DrizzleStaffRepository implements StaffRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<Staff | null> {
    const [row] = await this.db.select().from(staff).where(eq(staff.email, email)).limit(1)
    return row ?? null
  }

  async findById(id: string): Promise<Staff | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const [row] = await this.db.select().from(staff).where(eq(staff.id, id)).limit(1)
    return row ?? null
  }

  async list(): Promise<Staff[]> {
    return this.db.select().from(staff).orderBy(asc(staff.createdAt))
  }

  async save(member: Staff) {
    const { id: _id, createdAt: _createdAt, ...changes } = member
    await this.db.insert(staff).values(member).onConflictDoUpdate({ target: staff.id, set: changes })
  }
}
