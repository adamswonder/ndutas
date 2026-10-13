import { DomainError } from "./errors"
import { multiply, sum, type Kes } from "./money"
import type { Product } from "./product"

export const MAX_QUANTITY_PER_LINE = 20

export type CartLine = { productId: string; quantity: number }

export type PricedLine = { product: Product; quantity: number; lineTotal: Kes }

export type PricedCart = {
  lines: PricedLine[]
  itemCount: number
  subtotal: Kes
}

function assertQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new DomainError("invalid_quantity", `Invalid quantity: ${quantity}`)
  }
}

export function setQuantity(
  lines: readonly CartLine[],
  productId: string,
  quantity: number
): CartLine[] {
  assertQuantity(quantity)
  const capped = Math.min(quantity, MAX_QUANTITY_PER_LINE)
  if (capped === 0) return removeItem(lines, productId)
  if (!lines.some((line) => line.productId === productId)) {
    return [...lines, { productId, quantity: capped }]
  }
  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: capped } : line
  )
}

export function addItem(
  lines: readonly CartLine[],
  productId: string,
  quantity = 1
): CartLine[] {
  assertQuantity(quantity)
  const current = lines.find((line) => line.productId === productId)?.quantity ?? 0
  return setQuantity(lines, productId, current + quantity)
}

export function removeItem(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId)
}

export function quantityOf(lines: readonly CartLine[], productId: string): number {
  return lines.find((line) => line.productId === productId)?.quantity ?? 0
}

// Lines whose product is no longer in the catalog are dropped.
export function priceCart(
  lines: readonly CartLine[],
  products: readonly Product[]
): PricedCart {
  const byId = new Map(products.map((product) => [product.id, product]))
  const priced = lines.flatMap((line) => {
    const product = byId.get(line.productId)
    if (!product || line.quantity <= 0) return []
    return [{ product, quantity: line.quantity, lineTotal: multiply(product.price, line.quantity) }]
  })
  return {
    lines: priced,
    itemCount: priced.reduce((count, line) => count + line.quantity, 0),
    subtotal: sum(priced.map((line) => line.lineTotal)),
  }
}
