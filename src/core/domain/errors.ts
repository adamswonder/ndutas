export type DomainErrorCode =
  | "invalid_amount"
  | "invalid_phone"
  | "invalid_name"
  | "invalid_quantity"
  | "empty_cart"
  | "unknown_product"
  | "invalid_mpesa_code"
  | "invalid_transition"
  | "order_not_found"

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string
  ) {
    super(message)
    this.name = "DomainError"
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}
