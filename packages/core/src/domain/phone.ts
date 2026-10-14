import { parsePhoneNumberFromString } from "libphonenumber-js/mobile"
import { DomainError } from "./errors"

// Normalised MSISDN: 2547XXXXXXXX or 2541XXXXXXXX, the format Daraja expects.
export type KenyanPhone = string & { readonly __brand: "KenyanPhone" }

// Kenyan mobile numbers have 9 digits after the country code or leading 0,
// for both the older 07XX and the newer 01XX ranges.
export const KENYAN_MOBILE_DIGITS = 9

export type PhoneProblem = "empty" | "not_kenyan" | "too_short" | "too_long" | "not_mobile"

export type PhoneCheck =
  | { ok: true; phone: KenyanPhone }
  | { ok: false; problem: PhoneProblem; message: string }

const example = "like 0712 345 678 or 0110 345 678"

const messages: Record<PhoneProblem, string> = {
  empty: "Enter your M-Pesa phone number.",
  not_kenyan: "Use a Kenyan (+254) mobile number.",
  too_short: `That number is too short. Kenyan mobile numbers have 10 digits, ${example}.`,
  too_long: `That number is too long. Kenyan mobile numbers have 10 digits, ${example}.`,
  not_mobile: `Enter a Kenyan mobile number starting with 07 or 01, ${example}.`,
}

// The digits after +254 / 254 / 0, or null if the number has another country code.
export function kenyanSubscriberDigits(input: string): string | null {
  const compact = input.replace(/[^\d+]/g, "")
  if (compact.startsWith("+")) {
    return compact.startsWith("+254") ? compact.slice(4).replace(/\D/g, "") : null
  }
  if (compact.startsWith("254") && compact.length > KENYAN_MOBILE_DIGITS) return compact.slice(3)
  if (compact.startsWith("0")) return compact.slice(1)
  return compact
}

export function checkKenyanPhone(input: string): PhoneCheck {
  const fail = (problem: PhoneProblem): PhoneCheck => ({ ok: false, problem, message: messages[problem] })

  if (!input.trim()) return fail("empty")
  const digits = kenyanSubscriberDigits(input)
  if (digits === null) return fail("not_kenyan")
  if (digits.length < KENYAN_MOBILE_DIGITS) return fail("too_short")
  if (digits.length > KENYAN_MOBILE_DIGITS) return fail("too_long")

  // libphonenumber's mobile metadata knows which 07XX / 01XX ranges are allocated.
  const parsed = parsePhoneNumberFromString(`+254${digits}`)
  if (!parsed || parsed.country !== "KE" || !parsed.isValid()) return fail("not_mobile")

  return { ok: true, phone: parsed.number.slice(1) as KenyanPhone }
}

export function parseKenyanPhone(input: string): KenyanPhone {
  const result = checkKenyanPhone(input)
  if (!result.ok) throw new DomainError("invalid_phone", result.message)
  return result.phone
}

export function maskPhone(phone: KenyanPhone): string {
  return `${phone.slice(0, 4)}•••••${phone.slice(-3)}`
}
