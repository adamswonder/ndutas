import { DomainError } from "../domain/errors"

// The people who sign in to the back office. The owner can do everything; staff help
// with daily work (orders, products, stock) but don't see reports, accounts or settings.
export type StaffRole = "owner" | "staff"

export type Staff = {
  id: string
  email: string
  name: string
  role: StaffRole
  passwordHash: string
  createdAt: Date
  disabledAt: Date | null
}

export type StaffView = { id: string; email: string; name: string; role: StaffRole }

export interface StaffRepository {
  findByEmail(email: string): Promise<Staff | null>
  findById(id: string): Promise<Staff | null>
  list(): Promise<Staff[]>
  save(staff: Staff): Promise<void>
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
}

export const MIN_PASSWORD_LENGTH = 10

export function toStaffView(staff: Staff): StaffView {
  return { id: staff.id, email: staff.email, name: staff.name, role: staff.role }
}

export function isActiveStaff(staff: Staff | null): staff is Staff {
  return !!staff && !staff.disabledAt
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

type Deps = {
  staff: StaffRepository
  passwords: PasswordHasher
  ids: { staffId(): string }
  clock: { now(): Date }
}

// Same message for an unknown email, a wrong password and a disabled account, so the
// form never reveals which emails exist.
export function makeLogIn(deps: Pick<Deps, "staff" | "passwords">) {
  return async function logIn(email: string, password: string): Promise<StaffView> {
    const member = await deps.staff.findByEmail(normaliseEmail(email))
    const ok = member ? await deps.passwords.verify(password, member.passwordHash) : false
    if (!ok || !isActiveStaff(member)) {
      throw new DomainError("invalid_credentials", "Wrong email or password.")
    }
    return toStaffView(member)
  }
}

export function makeCreateStaff(deps: Deps) {
  return async function createStaff(input: {
    email: string
    name: string
    password: string
    role: StaffRole
  }): Promise<StaffView> {
    const email = normaliseEmail(input.email)
    const name = input.name.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new DomainError("invalid_staff", "Enter a valid email address.")
    }
    if (!name) throw new DomainError("invalid_staff", "Enter their name.")
    if (input.role !== "owner" && input.role !== "staff") {
      throw new DomainError("invalid_staff", "Choose a role.")
    }
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new DomainError(
        "invalid_staff",
        `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`
      )
    }
    if (await deps.staff.findByEmail(email)) {
      throw new DomainError("invalid_staff", "Someone with that email already has an account.")
    }
    const member: Staff = {
      id: deps.ids.staffId(),
      email,
      name,
      role: input.role,
      passwordHash: await deps.passwords.hash(input.password),
      createdAt: deps.clock.now(),
      disabledAt: null,
    }
    await deps.staff.save(member)
    return toStaffView(member)
  }
}
