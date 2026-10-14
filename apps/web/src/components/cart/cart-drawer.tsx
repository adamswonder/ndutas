"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBagIcon, Trash2Icon } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { formatPrice } from "@/lib/format"
import { useCart } from "./cart-provider"
import { QuantityStepper, RemoveItemDialog } from "./quantity-stepper"

export function CartDrawer() {
  const cart = useCart()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { lines, itemCount, subtotal } = cart.priced

  return (
    <Drawer
      open={cart.open}
      onOpenChange={cart.setOpen}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader className="flex-row items-center justify-between gap-3 border-b border-border">
          <div className="flex flex-col gap-0.5 text-left">
            <DrawerTitle className="text-xl">Your cart</DrawerTitle>
            <DrawerDescription>
              {itemCount === 0
                ? "Nothing here yet."
                : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            </DrawerDescription>
          </div>
          {lines.length > 0 && <ClearCartButton onConfirm={cart.clear} />}
        </DrawerHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingBagIcon className="size-6" />
            </span>
            <p className="text-muted-foreground">Add a few meals and they&apos;ll show up here.</p>
            <DrawerClose asChild>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/#menu">Browse menu</Link>
              </Button>
            </DrawerClose>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-dashed divide-border overflow-y-auto px-4">
              {lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.id} className="flex gap-3 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                    <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-heading font-semibold">{product.name}</p>
                        <p className="font-price text-xs text-muted-foreground tabular-nums">
                          {formatPrice(product.price)} each
                        </p>
                      </div>
                      <p className="shrink-0 font-price font-medium tabular-nums">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <QuantityStepper
                        name={product.name}
                        quantity={quantity}
                        onChange={(next) => cart.setQty(product.id, next)}
                      />
                      <RemoveItemDialog
                        name={product.name}
                        onConfirm={() => cart.remove(product.id)}
                      >
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${product.name}`}>
                          <Trash2Icon />
                        </Button>
                      </RemoveItemDialog>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <DrawerFooter className="border-t border-border">
              <div className="flex items-center justify-between text-base">
                <span className="font-medium">Subtotal</span>
                <span className="font-price text-lg font-semibold tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DrawerClose asChild>
                  <Button variant="outline" size="lg" className="h-11 rounded-full hover:cursor-pointer">
                    Buy More
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button asChild size="lg" className="h-11 rounded-full">
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function ClearCartButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon data-icon="inline-start" />
          Clear
        </Button>
      }
      title="Clear your cart?"
      description="This removes every meal from your cart. You can add them again from the menu."
      confirmLabel="Clear cart"
      onConfirm={onConfirm}
    />
  )
}
