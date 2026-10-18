import { isActiveStaff, toStaffView, type StaffRole, type StaffView } from "@ndutas/core"
import type { RequestHandler, Response } from "express"
import type { Container } from "../container.js"
import { HttpError } from "../errors.js"

type Locals = { staff: StaffView }

export function currentStaff(res: Response): StaffView {
  return (res.locals as Locals).staff
}

// A signed-in, active back office account. The account is re-read on every request, so
// disabling someone or changing their role takes effect straight away.
export function requireStaff(container: Container): RequestHandler {
  return async (req, res, next) => {
    const token = /^Bearer (.+)$/.exec(req.get("authorization") ?? "")?.[1]
    const staffId = token ? await container.auth.verifySession(token) : null
    const member = staffId ? await container.staff.findById(staffId) : null
    if (!isActiveStaff(member)) throw new HttpError(401, "Please sign in again.")
    ;(res.locals as Locals).staff = toStaffView(member)
    next()
  }
}

// Owner-only areas (reports, accounts, settings). Use after requireStaff.
export function requireRole(role: StaffRole): RequestHandler {
  return (_req, res, next) => {
    if (currentStaff(res).role !== role) {
      throw new HttpError(403, "Only the owner can do that.")
    }
    next()
  }
}
