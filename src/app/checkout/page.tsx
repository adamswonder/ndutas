import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { SiteHeader } from "@/components/landing/site-header"
import { container } from "@/server/container"

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
          <CheckoutForm payment={container().paymentSetup} />
        </div>
      </main>
    </div>
  )
}
