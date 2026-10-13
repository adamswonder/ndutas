import { CircleCheckIcon, CircleXIcon, WalletIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { ProcessingState } from "@/components/processing-state"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ManualCodeForm, RetryPaymentButton, StatusPoller } from "./order-controls"
import type { OrderView } from "./order-view"

export function OrderStatus({ order }: { order: OrderView }) {
  return (
    <div className="flex flex-col gap-6">
      <StatusCard order={order} />
      <OrderSummary order={order} />
    </div>
  )
}

function StatusCard({ order }: { order: OrderView }) {
  const total = <span className="font-price tabular-nums">{formatPrice(order.total)}</span>

  switch (order.status) {
    case "paid":
      return (
        <Panel icon={CircleCheckIcon} tone="success" title="Order confirmed">
          <p>
            Thank you, {order.customerName}! We&apos;ve received your payment of {total}.
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-price font-medium tabular-nums">{order.reference}</dd>
            {order.mpesaReceipt && (
              <>
                <dt className="text-muted-foreground">M-Pesa receipt</dt>
                <dd className="font-price font-medium tabular-nums">{order.mpesaReceipt}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="font-price tabular-nums">{order.maskedPhone}</dd>
          </dl>
          <Button asChild variant="outline" className="self-start rounded-full">
            <Link href="/#menu">Back to menu</Link>
          </Button>
        </Panel>
      )

    case "awaiting_verification":
      return (
        <ProcessingState
          title="We're confirming your payment"
          description={
            <>
              Thanks, {order.customerName}. We&apos;re checking M-Pesa code{" "}
              <span className="font-price font-medium tracking-wider text-foreground">
                {order.manualCode}
              </span>{" "}
              for {total}. This page updates once it&apos;s confirmed.
            </>
          }
        >
          <StatusPoller orderId={order.id} status={order.status} />
        </ProcessingState>
      )

    case "payment_failed":
    case "rejected":
      return (
        <Panel icon={CircleXIcon} tone="error" title="Payment didn't go through">
          <p>{order.failureReason ?? "The payment was not completed."}</p>
          <p className="text-sm text-muted-foreground">
            Your order is saved. You can try paying again.
          </p>
          <RetryPaymentButton orderId={order.id} />
        </Panel>
      )

    case "pending_payment":
      if (order.instruction?.kind === "manual") {
        const { payTo, payToName, reference } = order.instruction
        return (
          <Panel icon={WalletIcon} tone="pending" title="Pay with M-Pesa">
            <ol className="flex list-decimal flex-col gap-2 pl-5">
              <li>
                Open M-Pesa and choose <strong>Send Money</strong>.
              </li>
              <li>
                Send {total} to{" "}
                <span className="font-price font-medium whitespace-nowrap tabular-nums">{payTo}</span> ({payToName}).
              </li>
              <li>
                Enter the code from your M-Pesa SMS below. Your order reference is{" "}
                <span className="font-price font-medium whitespace-nowrap tabular-nums">{reference}</span>.
              </li>
            </ol>
            <ManualCodeForm orderId={order.id} />
          </Panel>
        )
      }
      return (
        <ProcessingState
          title="Check your phone"
          spinner="custom"
          description={
            <>
              We&apos;ve sent an M-Pesa prompt to{" "}
              <span className="font-price text-foreground tabular-nums">{order.maskedPhone}</span>.
              Enter your M-Pesa PIN to pay {total}. Keep this page open, it updates by itself.
            </>
          }
        >
          <StatusPoller orderId={order.id} status={order.status} />
        </ProcessingState>
      )
  }
}

const tones = {
  success: "bg-primary text-primary-foreground",
  pending: "bg-muted text-foreground",
  error: "bg-destructive/10 text-destructive",
}

function Panel({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: LucideIcon
  tone: keyof typeof tones
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:p-8"
    >
      <span className={cn("flex size-12 items-center justify-center rounded-full", tones[tone])}>
        <Icon className="size-6" />
      </span>
      <h1 className="font-heading text-3xl tracking-tight md:text-4xl">{title}</h1>
      {children}
    </section>
  )
}

function OrderSummary({ order }: { order: OrderView }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-heading text-xl whitespace-nowrap">Order {order.reference}</h2>
        <span className="text-sm text-muted-foreground">for {order.customerName}</span>
      </div>
      <ul className="mt-4 divide-y divide-dashed divide-border">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex items-baseline justify-between gap-4 py-3">
            <span>
              <span className="font-price tabular-nums">{line.quantity} ×</span> {line.name}
            </span>
            <span className="shrink-0 font-price tabular-nums">{formatPrice(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
        <span className="font-medium">Total</span>
        <span className="font-price text-xl font-semibold tabular-nums">
          {formatPrice(order.total)}
        </span>
      </div>
    </section>
  )
}
