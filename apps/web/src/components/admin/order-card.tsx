"use client"

import { CircleCheckIcon, PhoneIcon, XIcon } from "lucide-react"
import type { AdminOrderView } from "@ndutas/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { DecisionDialog } from "./decision-dialog"
import { useOrdersStore } from "./orders-store"

const statusLabel: Record<AdminOrderView["status"], { label: string; className: string }> = {
  awaiting_verification: { label: "Pending", className: "bg-primary/10 text-primary" },
  paid: { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
  payment_failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
  pending_payment: { label: "Awaiting PIN", className: "bg-muted text-muted-foreground" },
}

// 254712345678 → 0712 345 678, the way the owner sees it in her M-Pesa messages.
function localPhone(msisdn: string) {
  const local = `0${msisdn.slice(3)}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return relative.format(-minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (hours < 24) return relative.format(-hours, "hour")
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
}

export function OrderCard({ order }: { order: AdminOrderView }) {
  const isNew = useOrdersStore((state) => !!state.unseen[order.id])
  const { confirm, reject, markSeen } = useOrdersStore.getState()
  const status = statusLabel[order.status]
  const pending = order.status === "awaiting_verification"
  const phone = localPhone(order.customerPhone)

  return (
    <article
      onPointerEnter={() => markSeen(order.id)}
      onFocus={() => markSeen(order.id)}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-colors md:p-5",
        isNew ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-price text-lg font-semibold tabular-nums">{order.reference}</h3>
          {isNew && <Badge className="rounded-full">New</Badge>}
        </div>
        <time dateTime={order.createdAt} className="text-sm text-muted-foreground">
          {timeAgo(order.createdAt)}
        </time>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{order.customerName}</p>
          <a
            href={`tel:+${order.customerPhone}`}
            className="inline-flex items-center gap-1.5 font-price text-sm text-muted-foreground tabular-nums hover:text-primary"
          >
            <PhoneIcon className="size-3.5" />
            {phone}
          </a>
        </div>
        <Badge variant="secondary" className={cn("rounded-full", status.className)}>
          {status.label}
        </Badge>
      </div>

      <ul className="divide-y divide-dashed divide-border text-sm">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-4 py-1.5">
            <span>
              <span className="font-price tabular-nums">{line.quantity} ×</span> {line.name}
            </span>
            <span className="shrink-0 font-price tabular-nums">{formatPrice(line.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-medium">Total</span>
        <span className="font-price text-lg font-semibold tabular-nums">{formatPrice(order.total)}</span>
      </div>

      {order.status === "paid" && order.mpesaReceipt && (
        <p className="text-sm text-muted-foreground">
          M-Pesa code <span className="font-price font-medium text-foreground">{order.mpesaReceipt}</span>
        </p>
      )}
      {(order.status === "rejected" || order.status === "payment_failed") && order.failureReason && (
        <p className="text-sm text-muted-foreground">{order.failureReason}</p>
      )}

      {pending && (
        <div className="grid grid-cols-2 gap-2">
          <DecisionDialog
            trigger={
              <Button variant="outline" className="cursor-pointer rounded-full hover:border-destructive hover:text-destructive">
                <XIcon data-icon="inline-start" />
                Reject
              </Button>
            }
            icon={<XIcon />}
            variant="destructive"
            title={`Reject ${order.reference}?`}
            description={`Only if no Pochi payment of ${formatPrice(order.total)} came from ${phone}. The customer will see this reason.`}
            fieldLabel="Reason (optional)"
            fieldPlaceholder="We couldn't find a matching M-Pesa payment."
            confirmLabel="Reject order"
            onConfirm={(reason) => reject(order.id, reason)}
          />
          <DecisionDialog
            trigger={
              <Button className="cursor-pointer rounded-full">
                <CircleCheckIcon data-icon="inline-start" />
                Confirm
              </Button>
            }
            icon={<CircleCheckIcon />}
            variant="default"
            title={`Confirm ${order.reference}?`}
            description={`You received ${formatPrice(order.total)} on Pochi la Biashara from ${phone} (${order.customerName}).`}
            fieldLabel="M-Pesa code (optional)"
            fieldPlaceholder="e.g. SJK4H7Q2XZ"
            fieldClassName="font-price uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
            confirmLabel="Confirm payment"
            onConfirm={(code) => confirm(order.id, code || undefined)}
          />
        </div>
      )}
    </article>
  )
}
