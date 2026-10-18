import type { AdminOrderView } from "@ndutas/core"

// How each order status reads in the back office: a coloured dot plus a word.
export const orderStatus: Record<AdminOrderView["status"], { label: string; text: string; dot: string }> = {
  awaiting_verification: { label: "Pending", text: "text-primary", dot: "bg-primary" },
  paid: { label: "Confirmed", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", text: "text-destructive", dot: "bg-destructive" },
  payment_failed: { label: "Failed", text: "text-destructive", dot: "bg-destructive" },
  pending_payment: { label: "Awaiting PIN", text: "text-muted-foreground", dot: "bg-muted-foreground" },
}

export const paymentLabel: Record<AdminOrderView["method"], string> = {
  manual: "Pochi la Biashara",
  stk: "M-Pesa prompt",
}

// 254712345678 → 0712 345 678, the way the owner sees it in her M-Pesa messages.
export function localPhone(msisdn: string) {
  const local = `0${msisdn.slice(3)}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
const dateTime = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" })

export function formatOrderDate(iso: string) {
  return dateTime.format(new Date(iso))
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return relative.format(-minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (hours < 24) return relative.format(-hours, "hour")
  return formatOrderDate(iso)
}

// "2 × Berry French Toast" or "2 × Berry French Toast +1 more".
export function itemsSummary(order: AdminOrderView) {
  const [first, ...rest] = order.lines
  if (!first) return ""
  return `${first.quantity} × ${first.name}${rest.length ? ` +${rest.length} more` : ""}`
}
