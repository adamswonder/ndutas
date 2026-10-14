import type { CartLine } from "@ndutas/core"

// External store for cart lines, persisted to localStorage and read with
// useSyncExternalStore so server and client render the same empty cart first.
const KEY = "ndutas.cart.v1"
const EMPTY: CartLine[] = []
const listeners = new Set<() => void>()
let lines: CartLine[] | null = null

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false
  const line = value as Record<string, unknown>
  return (
    typeof line.productId === "string" &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0
  )
}

function read(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : []
  } catch {
    return []
  }
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== KEY) return
      lines = read()
      listener()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", onStorage)
    }
  },
  getSnapshot(): CartLine[] {
    lines ??= read()
    return lines
  },
  getServerSnapshot(): CartLine[] {
    return EMPTY
  },
  set(next: CartLine[]) {
    lines = next
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Storage can be full or blocked; the cart still works for this page view.
    }
    listeners.forEach((listener) => listener())
  },
}
