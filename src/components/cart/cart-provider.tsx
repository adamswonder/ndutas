"use client"

import * as React from "react"
import {
  addItem,
  priceCart,
  quantityOf,
  removeItem,
  setQuantity,
  type CartLine,
  type PricedCart,
} from "@/core/domain/cart"
import type { Product } from "@/core/domain/product"
import { cartStore } from "./cart-store"

type CartContextValue = {
  lines: CartLine[]
  priced: PricedCart
  quantityOf: (productId: string) => number
  add: (productId: string) => void
  setQty: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  open: boolean
  setOpen: (open: boolean) => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

export function CartProvider({
  products,
  children,
}: {
  products: Product[]
  children: React.ReactNode
}) {
  const lines = React.useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  )
  const [open, setOpen] = React.useState(false)

  const value = React.useMemo<CartContextValue>(() => {
    const update = (fn: (current: CartLine[]) => CartLine[]) =>
      cartStore.set(fn(cartStore.getSnapshot()))
    return {
      lines,
      priced: priceCart(lines, products),
      quantityOf: (productId) => quantityOf(lines, productId),
      add: (productId) => update((current) => addItem(current, productId)),
      setQty: (productId, quantity) =>
        update((current) => setQuantity(current, productId, Math.max(0, quantity))),
      remove: (productId) => update((current) => removeItem(current, productId)),
      clear: () => cartStore.set([]),
      open,
      setOpen,
    }
  }, [lines, products, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = React.useContext(CartContext)
  if (!context) throw new Error("useCart must be used within <CartProvider>")
  return context
}
