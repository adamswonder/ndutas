import { DomainError } from "../domain/errors"

// The people who can sign in to the back office (the owner, and later any staff).
export type Owner = {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
}

export type OwnerView = { id: string; email: string; name: string }

export interface OwnerRepository {
  findByEmail(email: string): Promise<Owner | null>
  findById(id: string): Promise<Owner | null>
  save(owner: Owner): Promise<void>
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
}

export const MIN_PASSWORD_LENGTH = 10

export function toOwnerView(owner: Owner): OwnerView {
  return { id: owner.id, email: owner.email, name: owner.name }
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

type Deps = {
  owners: OwnerRepository
  passwords: PasswordHasher
  ids: { ownerId(): string }
  clock: { now(): Date }
}

// Same message for an unknown email and a wrong password, so neither leaks which emails exist.
export function makeLogIn(deps: Pick<Deps, "owners" | "passwords">) {
  return async function logIn(email: string, password: string): Promise<OwnerView> {
    const owner = await deps.owners.findByEmail(normaliseEmail(email))
    const ok = owner ? await deps.passwords.verify(password, owner.passwordHash) : false
    if (!owner || !ok) {
      throw new DomainError("invalid_credentials", "Wrong email or password.")
    }
    return toOwnerView(owner)
  }
}

export function makeCreateOwner(deps: Deps) {
  return async function createOwner(input: {
    email: string
    name: string
    password: string
  }): Promise<OwnerView> {
    const email = normaliseEmail(input.email)
    const name = input.name.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new DomainError("invalid_owner", "Enter a valid email address.")
    }
    if (!name) throw new DomainError("invalid_owner", "Enter the owner's name.")
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new DomainError(
        "invalid_owner",
        `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`
      )
    }
    if (await deps.owners.findByEmail(email)) {
      throw new DomainError("invalid_owner", "An owner with that email already exists.")
    }
    const owner: Owner = {
      id: deps.ids.ownerId(),
      email,
      name,
      passwordHash: await deps.passwords.hash(input.password),
      createdAt: deps.clock.now(),
    }
    await deps.owners.save(owner)
    return toOwnerView(owner)
  }
}
