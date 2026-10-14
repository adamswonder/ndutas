import bcrypt from "bcryptjs"
import { jwtVerify, SignJWT } from "jose"
import type { OwnerView, PasswordHasher } from "@ndutas/core"

export const bcryptHasher: PasswordHasher = {
  hash: (password) => bcrypt.hash(password, 12),
  verify: (password, hash) => bcrypt.compare(password, hash),
}

const ISSUER = "ndutas-api"
const SESSION_HOURS = 12
const TICKET_SECONDS = 60

// Two kinds of token, told apart by audience:
// - "admin": the back office session, sent as a Bearer header.
// - "ws": a one-minute ticket for opening the WebSocket, so the session token never
//   appears in a URL (and in logs).
export function createAuth(secret: Uint8Array) {
  async function sign(subject: string, audience: "admin" | "ws", expiresIn: string) {
    return new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(subject)
      .setIssuer(ISSUER)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret)
  }

  async function verify(token: string, audience: "admin" | "ws"): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: ISSUER,
        audience,
        algorithms: ["HS256"],
      })
      return payload.sub ?? null
    } catch {
      return null
    }
  }

  return {
    issueSession: (owner: OwnerView) => sign(owner.id, "admin", `${SESSION_HOURS}h`),
    verifySession: (token: string) => verify(token, "admin"),
    issueWsTicket: (ownerId: string) => sign(ownerId, "ws", `${TICKET_SECONDS}s`),
    verifyWsTicket: (ticket: string) => verify(ticket, "ws"),
  }
}

export type Auth = ReturnType<typeof createAuth>
