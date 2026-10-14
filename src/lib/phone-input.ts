import { KENYAN_MOBILE_DIGITS } from "@/core/domain/phone"

// Formats a Kenyan mobile number while it is typed and stops it growing past
// a mobile number's length: "0712 345 678", "+254 712 345 678", "712 345 678".
export function formatPhoneInput(raw: string): string {
  const hasPlus = raw.trimStart().startsWith("+")
  const digits = raw.replace(/\D/g, "")

  if (hasPlus) {
    // Still typing the country code, or a non-Kenyan number the validator will flag.
    if (!digits.startsWith("254")) return `+${digits.slice(0, 15)}`
    return withPrefix("+254", digits.slice(3))
  }
  if (digits.startsWith("254") && digits.length > 3) return withPrefix("254", digits.slice(3))
  if (digits.startsWith("0")) {
    // 0 + the first three digits stay together: "0712 345 678".
    const [first = "", ...rest] = groups(digits.slice(1))
    return [`0${first}`, ...rest].join(" ")
  }
  return groups(digits).join(" ")
}

// The subscriber digits in threes, capped at a mobile number's length.
function groups(digits: string): string[] {
  return digits.slice(0, KENYAN_MOBILE_DIGITS).match(/.{1,3}/g) ?? []
}

function withPrefix(prefix: string, digits: string): string {
  return [prefix, ...groups(digits)].join(" ")
}
