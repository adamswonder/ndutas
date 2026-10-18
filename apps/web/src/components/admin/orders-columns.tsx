"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { CircleCheckIcon, CircleXIcon, EllipsisVerticalIcon, EyeIcon } from "lucide-react"
import type { AdminOrderView } from "@ndutas/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ColumnHeader } from "./data-table/column-header"
import type { Features } from "./data-table/features"
import { SelectAllCheckbox, SelectRowCheckbox } from "./data-table/select-column"
import { ConfirmOrderDialog, RejectOrderDialog } from "./order-decisions"
import { formatOrderDate, itemsSummary, localPhone, orderStatus, paymentLabel, timeAgo } from "./order-format"
import { useOrdersStore } from "./orders-store"

const column = createColumnHelper<Features, AdminOrderView>()

export function orderColumns({ onOpen }: { onOpen: (order: AdminOrderView) => void }) {
  return column.columns([
    column.display({
      id: "select",
      header: SelectAllCheckbox,
      cell: SelectRowCheckbox,
      enableSorting: false,
      enableHiding: false,
    }),
    column.accessor("reference", {
      header: ({ column }) => <ColumnHeader column={column} title="Order" />,
      cell: ({ row }) => <OrderReference order={row.original} onOpen={onOpen} />,
      enableHiding: false,
      meta: { label: "Order" },
    }),
    column.accessor("createdAt", {
      id: "date",
      header: ({ column }) => <ColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <time
          dateTime={row.original.createdAt}
          title={formatOrderDate(row.original.createdAt)}
          className="whitespace-nowrap text-muted-foreground"
        >
          {timeAgo(row.original.createdAt)}
        </time>
      ),
      meta: { label: "Date" },
    }),
    column.accessor("customerName", {
      id: "customer",
      header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="min-w-36">
          <p className="font-medium">{row.original.customerName}</p>
          <a
            href={`tel:+${row.original.customerPhone}`}
            className="font-price text-xs text-muted-foreground tabular-nums hover:text-primary"
          >
            {localPhone(row.original.customerPhone)}
          </a>
        </div>
      ),
      meta: { label: "Customer" },
    }),
    column.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => <span className="block max-w-56 truncate">{itemsSummary(row.original)}</span>,
      meta: { label: "Items" },
    }),
    column.accessor("method", {
      id: "payment",
      header: ({ column }) => <ColumnHeader column={column} title="Payment" />,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p>{paymentLabel[row.original.method]}</p>
          {row.original.mpesaReceipt && (
            <p className="font-price text-xs tracking-wider text-muted-foreground">{row.original.mpesaReceipt}</p>
          )}
        </div>
      ),
      meta: { label: "Payment" },
    }),
    column.accessor("status", {
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <OrderStatusDot status={row.original.status} />,
      meta: { label: "Status" },
    }),
    column.accessor("total", {
      header: ({ column }) => <ColumnHeader column={column} title="Total" align="right" />,
      cell: ({ row }) => (
        <div className="text-right font-price font-medium whitespace-nowrap tabular-nums">
          {formatPrice(row.original.total)}
        </div>
      ),
      meta: { label: "Total" },
    }),
    column.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <OrderActions order={row.original} onOpen={onOpen} />,
      enableHiding: false,
    }),
  ])
}

function OrderReference({ order, onOpen }: { order: AdminOrderView; onOpen: (order: AdminOrderView) => void }) {
  const isNew = useOrdersStore((state) => !!state.unseen[order.id])
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(order)}
        className="cursor-pointer font-price font-semibold whitespace-nowrap tabular-nums hover:text-primary hover:underline"
      >
        {order.reference}
      </button>
      {isNew && <Badge className="rounded-full">New</Badge>}
    </div>
  )
}

export function OrderStatusDot({ status }: { status: AdminOrderView["status"] }) {
  const style = orderStatus[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium whitespace-nowrap", style.text)}>
      <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  )
}

// ⋮ menu per row. Confirm and Reject only apply to orders waiting for the owner; for the
// rest they stay visible but disabled, so the menu always reads the same.
function OrderActions({ order, onOpen }: { order: AdminOrderView; onOpen: (order: AdminOrderView) => void }) {
  const [dialog, setDialog] = React.useState<"confirm" | "reject" | null>(null)
  const pending = order.status === "awaiting_verification"

  return (
    <div className="flex justify-end">
      {/* Non-modal, so closing the menu doesn't fight the dialog it opens for focus. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer text-muted-foreground data-[state=open]:bg-muted"
            aria-label={`Actions for ${order.reference}`}
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="cursor-pointer" onSelect={() => onOpen(order)}>
            <EyeIcon />
            View details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" disabled={!pending} onSelect={() => setDialog("confirm")}>
            <CircleCheckIcon className="text-primary" />
            Confirm payment
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            disabled={!pending}
            onSelect={() => setDialog("reject")}
          >
            <CircleXIcon />
            Reject order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {pending && (
        <>
          <ConfirmOrderDialog
            order={order}
            open={dialog === "confirm"}
            onOpenChange={(open) => setDialog(open ? "confirm" : null)}
          />
          <RejectOrderDialog
            order={order}
            open={dialog === "reject"}
            onOpenChange={(open) => setDialog(open ? "reject" : null)}
          />
        </>
      )}
    </div>
  )
}
