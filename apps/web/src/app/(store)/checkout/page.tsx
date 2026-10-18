import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { CheckoutLoading } from "@/components/checkout/checkout-loading"
import { SiteHeader } from "@/components/landing/site-header"
import { getPaymentSetup } from "@/server/api"

export const metadata: Metadata = { title: "Checkout · Ndutas Kitchen" }

export default function CheckoutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <Button asChild variant="ghost" size="sm" className="-ml-2.5 mb-4 rounded-full text-muted-foreground">
          <Link href="/#menu">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to menu
          </Link>
        </Button>
        <h1 className="font-heading text-4xl tracking-tight md:text-5xl">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Confirm your order, then pay with M-Pesa.
        </p>
        <div className="mt-8">
          <Suspense fallback={<CheckoutLoading />}>
            <Checkout />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

// Read at request time (not at build), so the page builds even when the API is down and
// switching PAYMENT_METHOD on the API takes effect without rebuilding the storefront.
async function Checkout() {
  await connection()
  const payment = await getPaymentSetup().catch(() => null)
  if (!payment) {
    return (
      <div role="alert" className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <h2 className="font-heading text-2xl">We can&apos;t take orders right now</h2>
        <p className="mt-2 text-muted-foreground">
          Something is wrong on our side. Your cart is saved, so please try again in a few minutes.
        </p>
      </div>
    )
  }
  return <CheckoutForm payment={payment} />
}
