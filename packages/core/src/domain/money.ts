import { DomainError } from "./errors"

// Whole Kenyan shillings. M-Pesa only moves whole shillings, so there are no cents.
export type Kes = number

export function kes(amount: number): Kes {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new DomainError("invalid_amount", `Invalid KES amount: ${amount}`)
  }
  return amount
}

export function multiply(unitPrice: Kes, quantity: number): Kes {
  return kes(unitPrice * quantity)
}

export function sum(amounts: readonly Kes[]): Kes {
  return kes(amounts.reduce((total, amount) => total + amount, 0))
}
