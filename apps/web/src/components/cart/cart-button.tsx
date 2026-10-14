"use client"

import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "./cart-provider"

export function CartButton() {
  const { priced, setOpen } = useCart()
  const count = priced.itemCount

  return (
    <Button
      variant="outline"
      size="icon-lg"
      className="relative rounded-full"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
    >
      <ShoppingBagIcon />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-price text-[0.7rem] font-semibold text-primary-foreground tabular-nums">
          {count}
        </span>
      )}
    </Button>
  )
}

// "Order now" until something is in the cart, then the cart icon with its count.
export function HeaderCartAction() {
  const { priced } = useCart()

  if (priced.itemCount > 0) return <CartButton />

  return (
    <Button asChild size="lg" className="rounded-full px-4">
      <Link href="/#menu">
        Order<span className="max-sm:hidden">&nbsp;now</span>
        <ShoppingBagIcon data-icon="inline-end" />
      </Link>
    </Button>
  )
}
