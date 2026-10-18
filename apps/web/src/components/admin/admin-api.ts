import type { ApiError } from "@ndutas/core"

// The back office talks to the Express API straight from the browser (Bearer token),
// including the WebSocket for live orders.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "")

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export async function adminFetch<T>(
  path: string,
  { token, method = "GET", body }: { token?: string | null; method?: string; body?: unknown } = {}
): Promise<T> {
  // A Blob (an uploaded photo) goes as-is with its own type; anything else as JSON.
  const isFile = body instanceof Blob
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": isFile ? body.type : "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isFile ? body : JSON.stringify(body),
    })
  } catch {
    throw new AdminApiError("Can't reach the server. Check your internet connection.", 0)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminApiError((data as ApiError | null)?.error ?? "Something went wrong.", res.status)
  }
  return data as T
}

export function orderSocketUrl(ticket: string) {
  return `${API_URL.replace(/^http/, "ws")}/admin/ws?ticket=${encodeURIComponent(ticket)}`
}
