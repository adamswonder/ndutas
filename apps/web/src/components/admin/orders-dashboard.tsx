"use client"

import * as React from "react"
import {
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table"
import { DownloadIcon, InboxIcon, RotateCcwIcon } from "lucide-react"
import type { AdminOrderView, OrderFilter } from "@ndutas/core"
import { SpinnerCustom } from "@/components/spinner-custom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { downloadCsv } from "./data-table/csv"
import { DataTable } from "./data-table/data-table"
import { features } from "./data-table/features"
import { Pagination } from "./data-table/pagination"
import { TableSearch } from "./data-table/search"
import { ViewOptions } from "./data-table/view-options"
import { OrderDetails } from "./order-details"
import { formatOrderDate, localPhone, orderStatus, paymentLabel } from "./order-format"
import { orderColumns } from "./orders-columns"
import { selectVisibleOrders, useOrdersStore } from "./orders-store"

const tabs: { value: OrderFilter; label: string; empty: string }[] = [
  { value: "pending", label: "Pending", empty: "No orders waiting for confirmation." },
  { value: "confirmed", label: "Confirmed", empty: "No confirmed orders yet." },
  { value: "rejected", label: "Rejected", empty: "No rejected orders." },
  { value: "all", label: "All", empty: "No orders yet." },
]

// Columns that start hidden on phones (the owner can still turn them on).
const hiddenOnPhones: ColumnVisibilityState = { date: false, items: false, payment: false }

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater
}

export function OrdersDashboard() {
  const byId = useOrdersStore((state) => state.byId)
  const filter = useOrdersStore((state) => state.filter)
  const loading = useOrdersStore((state) => state.loading)
  const loaded = useOrdersStore((state) => state.loaded)
  const error = useOrdersStore((state) => state.error)
  const nextBefore = useOrdersStore((state) => state.nextBefore)
  const unseen = useOrdersStore((state) => state.unseen)
  const { setFilter, load, loadMore, markSeen } = useOrdersStore.getState()
  const isPhone = useMediaQuery("(max-width: 767px)")

  const [search, setSearch] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [chosenColumns, setChosenColumns] = React.useState<ColumnVisibilityState>({})
  const [openId, setOpenId] = React.useState<string | null>(null)

  const orders = React.useMemo(() => selectVisibleOrders({ byId, filter }), [byId, filter])
  const counts = React.useMemo(() => {
    const all = Object.values(byId)
    return {
      pending: all.filter((o) => o.status === "awaiting_verification").length,
    }
  }, [byId])

  // Search across reference, customer name and phone (typed as 07…, 01… or 254…).
  const data = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return orders
    const digits = term.replace(/\D/g, "").replace(/^0/, "")
    return orders.filter(
      (o) =>
        o.reference.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        (digits.length >= 3 && o.customerPhone.includes(digits))
    )
  }, [orders, search])

  const columns = React.useMemo(() => orderColumns({ onOpen: (order) => setOpenId(order.id) }), [])
  // The user's own choices win; phones just start with fewer columns.
  const columnVisibility = React.useMemo(
    () => ({ ...(isPhone ? hiddenOnPhones : {}), ...chosenColumns }),
    [isPhone, chosenColumns]
  )

  // Live updates (new orders, confirmations) change the data; keep the owner on their page,
  // but never past the last one.
  const lastPage = Math.max(Math.ceil(data.length / pagination.pageSize) - 1, 0)
  const page = { ...pagination, pageIndex: Math.min(pagination.pageIndex, lastPage) }

  const table = useTable({
    features,
    data,
    columns,
    state: { sorting, rowSelection, pagination: page, columnVisibility },
    autoResetPageIndex: false,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: (updater) => setChosenColumns(resolve(updater, columnVisibility)),
  })

  function changeTab(value: OrderFilter) {
    setRowSelection({})
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    setFilter(value)
  }

  function exportCsv() {
    const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
    const rows = (selected.length ? selected : data).map((o: AdminOrderView) => ({
      Order: o.reference,
      Date: formatOrderDate(o.createdAt),
      Customer: o.customerName,
      Phone: localPhone(o.customerPhone),
      Items: o.lines.map((l) => `${l.quantity} x ${l.name}`).join("; "),
      Payment: paymentLabel[o.method],
      "M-Pesa code": o.mpesaReceipt ?? "",
      Status: orderStatus[o.status].label,
      "Total (KES)": o.total,
    }))
    downloadCsv(`ndutas-orders-${filter}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  const current = tabs.find((tab) => tab.value === filter) ?? tabs[0]
  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">Orders</h1>
        <p className="mt-1 text-muted-foreground">Confirm Pochi la Biashara payments once the money is in.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(value) => changeTab(value as OrderFilter)}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer">
                {tab.label}
                {tab.value === "pending" && counts.pending > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 rounded-full px-1.5 font-price tabular-nums">
                    {counts.pending}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            placeholder="Search order, name or phone"
          />
          <ViewOptions table={table} />
          <Button
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer"
            onClick={exportCsv}
            disabled={data.length === 0}
          >
            <DownloadIcon data-icon="inline-start" />
            <span className="max-sm:sr-only">{selectedCount ? `Export ${selectedCount}` : "Export"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
          <Button size="sm" variant="outline" className="cursor-pointer rounded-full" onClick={() => void load()}>
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
        </div>
      )}

      {!loaded && loading ? (
        <div className="flex justify-center py-20">
          <SpinnerCustom className="size-6 text-primary" />
        </div>
      ) : (
        <>
          <DataTable
            table={table}
            empty={
              <span className="flex flex-col items-center gap-2">
                <InboxIcon className="size-7 text-primary" strokeWidth={1.5} />
                {search ? "No orders match your search." : current.empty}
              </span>
            }
            rowProps={(row) => ({
              onPointerEnter: () => markSeen(row.original.id),
              onFocus: () => markSeen(row.original.id),
              className: cn(unseen[row.original.id] && "bg-primary/5"),
            })}
          />
          <Pagination
            table={table}
            extra={
              nextBefore && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto cursor-pointer p-0"
                  disabled={loading}
                  onClick={() => void loadMore()}
                >
                  {loading && <SpinnerCustom data-icon="inline-start" />}
                  Load older orders
                </Button>
              )
            }
          />
        </>
      )}

      <OrderDetails orderId={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}
