"use client"

import * as React from "react"
import { CircleCheckIcon, CircleXIcon } from "lucide-react"
import type { AdminOrderView } from "@ndutas/core"
import { formatPrice } from "@/lib/format"
import { DecisionDialog } from "./decision-dialog"
import { localPhone } from "./order-format"
import { useOrdersStore } from "./orders-store"

// Confirm and Reject for a pending Pochi order, each asking first in a DecisionDialog.
// Either pass a trigger button (the details drawer), or control it with open/onOpenChange
// (the table's row menu).
type DialogProps = {
  order: AdminOrderView
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ConfirmOrderDialog({ order, ...props }: DialogProps) {
  const phone = localPhone(order.customerPhone)
  return (
    <DecisionDialog
      {...props}
      icon={<CircleCheckIcon />}
      variant="default"
      title={`Confirm ${order.reference}?`}
      description={`You received ${formatPrice(order.total)} on Pochi la Biashara from ${phone} (${order.customerName}).`}
      fieldLabel="M-Pesa code (optional)"
      fieldPlaceholder="e.g. SJK4H7Q2XZ"
      fieldClassName="font-price uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
      confirmLabel="Confirm payment"
      onConfirm={(code) => useOrdersStore.getState().confirm(order.id, code || undefined)}
    />
  )
}

export function RejectOrderDialog({ order, ...props }: DialogProps) {
  const phone = localPhone(order.customerPhone)
  return (
    <DecisionDialog
      {...props}
      icon={<CircleXIcon />}
      variant="destructive"
      title={`Reject ${order.reference}?`}
      description={`Only if no Pochi payment of ${formatPrice(order.total)} came from ${phone}. The customer will see this reason.`}
      fieldLabel="Reason (optional)"
      fieldPlaceholder="We couldn't find a matching M-Pesa payment."
      confirmLabel="Reject order"
      onConfirm={(reason) => useOrdersStore.getState().reject(order.id, reason)}
    />
  )
}
