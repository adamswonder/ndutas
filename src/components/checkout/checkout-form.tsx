"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingBagIcon } from "lucide-react"
import { placeOrderAction, type PlaceOrderResult } from "@/app/checkout/actions"
import { useCart } from "@/components/cart/cart-provider"
import { QuantityStepper } from "@/components/cart/quantity-stepper"
import { ProcessingState } from "@/components/processing-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIsClient } from "@/hooks/use-is-client"
import { formatPrice } from "@/lib/format"

export function CheckoutForm() {
  const cart = useCart()
  const router = useRouter()
  const isClient = useIsClient()
  const [failure, setFailure] = React.useState<Extract<PlaceOrderResult, { ok: false }> | null>(null)
  const [placedOrderId, setPlacedOrderId] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const { lines, itemCount, subtotal } = cart.priced

  if (!isClient) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted/60" aria-hidden />
  }

  // Only while the redirect is in flight. With cacheComponents, Next keeps this
  // page's state alive (React <Activity>) after we leave, so a lasting "success"
  // flag would greet the customer again on their next visit to /checkout.
  if (pending && placedOrderId) {
    return (
      <ProcessingState
        as="h2"
        title="Processing your order"
        description="Please wait while we set up your M-Pesa payment. Do not refresh the page."
      />
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/30 px-6 py-16 text-center">
        <ShoppingBagIcon className="size-8 text-primary" strokeWidth={1.5} />
        <h2 className="font-heading text-2xl">Your cart is empty</h2>
        <p className="text-muted-foreground">Pick a few meals and come back to check out.</p>
        <Button asChild className="rounded-full">
          <Link href="/#menu">Browse menu</Link>
        </Button>
      </div>
    )
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    startTransition(async () => {
      const res = await placeOrderAction({
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      })
      if (!res.ok) {
        setFailure(res)
        return
      }
      setFailure(null)
      setPlacedOrderId(res.orderId)
      cart.clear()
      // Inside the transition, so `pending` stays true until the order page is shown.
      router.push(`/orders/${res.orderId}`)
    })
  }

  const fieldErrors = failure?.fieldErrors
  const formError = failure?.error

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_24rem]">
      <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 md:p-6">
          <div>
            <h2 className="font-heading text-xl">Your details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We use these to tie the order to you and send the M-Pesa prompt.
            </p>
          </div>

          <Field id="name" label="Full name" error={fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              aria-invalid={!!fieldErrors?.name}
              aria-describedby={fieldErrors?.name ? "name-error" : undefined}
              className="h-11"
            />
          </Field>

          <Field
            id="phone"
            label="M-Pesa phone number"
            hint="The Safaricom number that will pay, e.g. 0712 345 678."
            error={fieldErrors?.phone}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07XX XXX XXX"
              required
              aria-invalid={!!fieldErrors?.phone}
              aria-describedby={fieldErrors?.phone ? "phone-error" : "phone-hint"}
              className="h-11"
            />
          </Field>
        </section>

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={pending}>
          {pending ? (
            <>
              <Spinner data-icon="inline-start" />
              Placing order…
            </>
          ) : (
            <>
              Pay <span className="font-price tabular-nums">{formatPrice(subtotal)}</span> with M-Pesa
            </>
          )}
        </Button>
      </form>

      <aside className="h-fit rounded-2xl border border-border bg-card p-5 md:p-6 lg:sticky lg:top-6">
        <h2 className="font-heading text-xl">Order summary</h2>
        <p className="text-sm text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
        <ul className="mt-4 divide-y divide-dashed divide-border">
          {lines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="flex gap-3 py-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-heading text-sm font-semibold">{product.name}</p>
                  <p className="shrink-0 font-price text-sm font-medium tabular-nums">
                    {formatPrice(lineTotal)}
                  </p>
                </div>
                <QuantityStepper
                  name={product.name}
                  quantity={quantity}
                  onChange={(next) => cart.setQty(product.id, next)}
                  className="self-start"
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="font-medium">Total</span>
          <span className="font-price text-xl font-semibold tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </div>
      </aside>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
