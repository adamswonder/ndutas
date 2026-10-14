import { isDomainError, type ApiError, type DomainErrorCode } from "@ndutas/core"
import type { ErrorRequestHandler } from "express"

// A request the API refuses before it reaches a use case (bad JSON shape, missing auth...).
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

const statusByCode: Partial<Record<DomainErrorCode, number>> = {
  order_not_found: 404,
  invalid_credentials: 401,
  invalid_transition: 409,
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isDomainError(error)) {
    const body: ApiError = { error: error.message, code: error.code }
    if (error.code === "invalid_name") body.fieldErrors = { name: error.message }
    if (error.code === "invalid_phone") body.fieldErrors = { phone: error.message }
    res.status(statusByCode[error.code] ?? 422).json(body)
    return
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message } satisfies ApiError)
    return
  }
  // express.json() rejects malformed bodies with a 400 "entity.parse.failed".
  if (error?.type === "entity.parse.failed" || error?.type === "entity.too.large") {
    res.status(400).json({ error: "Invalid request body." } satisfies ApiError)
    return
  }
  console.error(error)
  res.status(500).json({ error: "Something went wrong. Please try again." } satisfies ApiError)
}
