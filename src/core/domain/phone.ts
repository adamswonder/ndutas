import { DomainError } from "./errors"

// Normalised Safaricom-style MSISDN: 2547XXXXXXXX or 2541XXXXXXXX, the format Daraja expects.
export type KenyanPhone = string & { readonly __brand: "KenyanPhone" }

const pattern = /^(?:\+?254|0)?([17]\d{8})$/

export function parseKenyanPhone(input: string): KenyanPhone {
  const digits = input.replace(/[\s\-()]/g, "")
  const match = pattern.exec(digits)
  if (!match) {
    throw new DomainError(
      "invalid_phone",
      "Enter a valid Kenyan phone number, like 0712 345 678."
    )
  }
  return `254${match[1]}` as KenyanPhone
}

export function maskPhone(phone: KenyanPhone): string {
  return `${phone.slice(0, 4)}•••••${phone.slice(-3)}`
}
