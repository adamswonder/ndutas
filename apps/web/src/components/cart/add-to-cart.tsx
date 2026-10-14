"use client"

import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCart } from "./cart-provider"
import { QuantityStepper } from "./quantity-stepper"

export function AddToCart({ productId, name }: { productId: string; name: string }) {
  const cart = useCart()
  const quantity = cart.quantityOf(productId)

  if (quantity > 0) {
    return (
      <QuantityStepper
        name={name}
        quantity={quantity}
        onChange={(next) => cart.setQty(productId, next)}
      />
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="cursor-pointer rounded-full hover:border-primary hover:bg-primary hover:text-primary-foreground"
      onClick={() => {
        cart.add(productId)
        toast.success(`${name} added to cart`, {
          action: { label: "View cart", onClick: () => cart.setOpen(true) },
        })
      }}
      aria-label={`Add ${name} to cart`}
    >
      <PlusIcon data-icon="inline-start" />
      Add
    </Button>
  )
}
