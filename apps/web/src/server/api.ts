import "server-only"

import type {
  ApiError,
  PaymentSetup,
  PlaceOrderRequest,
  PlaceOrderResponse,
  PublicOrderView,
} from "@ndutas/core"
import { cacheLife } from "next/cache"

// The storefront's only door to orders and payments: the Express API (apps/api).
// Shapes come from @ndutas/core contracts, so both sides change together.
const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "")

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiError }

const unreachable: ApiError = {
  error: "We couldn't reach Ndutas Kitchen right now. Please try again in a moment.",
}

async function call<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...init?.headers },
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    console.error(`API ${path} unreachable`, error)
    return { ok: false, status: 503, error: unreachable }
  }
  const body = await res.json().catch(() => null)
  if (res.ok) return { ok: true, data: body as T }
  return { ok: false, status: res.status, error: (body as ApiError | null) ?? unreachable }
}

export function placeOrder(request: PlaceOrderRequest) {
  return call<PlaceOrderResponse>("/orders", { method: "POST", body: JSON.stringify(request) })
}

// null when the order doesn't exist; throws if the API is down, so the page shows an error
// rather than a misleading "not found".
export async function getOrder(id: string): Promise<PublicOrderView | null> {
  const result = await call<PublicOrderView>(`/orders/${encodeURIComponent(id)}`)
  if (result.ok) return result.data
  if (result.status === 404) return null
  throw new Error(result.error.error)
}

export function retryPayment(id: string) {
  return call<PublicOrderView>(`/orders/${encodeURIComponent(id)}/retry`, { method: "POST" })
}

// Which checkout UI to show (Pochi steps or M-Pesa prompt). Changes only on redeploy of the
// API, so a few minutes of caching is plenty.
export async function getPaymentSetup(): Promise<PaymentSetup> {
  "use cache"
  cacheLife("minutes")
  const result = await call<PaymentSetup>("/payment-setup")
  if (!result.ok) throw new Error(result.error.error)
  return result.data
}
