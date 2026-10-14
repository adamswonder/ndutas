import type { Owner, OwnerRepository } from "../application/owners"

// Stand-in for the owners table in tests and local development without DATABASE_URL.
export class InMemoryOwnerRepository implements OwnerRepository {
  constructor(private readonly owners = new Map<string, Owner>()) {}

  async findByEmail(email: string) {
    for (const owner of this.owners.values()) {
      if (owner.email === email) return structuredClone(owner)
    }
    return null
  }

  async findById(id: string) {
    const owner = this.owners.get(id)
    return owner ? structuredClone(owner) : null
  }

  async save(owner: Owner) {
    this.owners.set(owner.id, structuredClone(owner))
  }
}
