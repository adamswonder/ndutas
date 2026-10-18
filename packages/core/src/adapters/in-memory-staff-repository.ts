import type { Staff, StaffRepository } from "../application/staff"

// Stand-in for the staff table in core's unit tests.
export class InMemoryStaffRepository implements StaffRepository {
  constructor(private readonly members = new Map<string, Staff>()) {}

  async findByEmail(email: string) {
    for (const member of this.members.values()) {
      if (member.email === email) return structuredClone(member)
    }
    return null
  }

  async findById(id: string) {
    const member = this.members.get(id)
    return member ? structuredClone(member) : null
  }

  async list() {
    return [...this.members.values()]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((member) => structuredClone(member))
  }

  async save(member: Staff) {
    this.members.set(member.id, structuredClone(member))
  }
}
