"use client"

import * as React from "react"
import { InboxIcon, RotateCcwIcon } from "lucide-react"
import type { OrderFilter } from "@ndutas/core"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpinnerCustom } from "@/components/spinner-custom"
import { OrderCard } from "./order-card"
import { selectPendingCount, selectVisibleOrders, useOrdersStore } from "./orders-store"

const tabs: { value: OrderFilter; label: string; empty: string }[] = [
  { value: "pending", label: "Pending", empty: "No orders waiting for confirmation." },
  { value: "confirmed", label: "Confirmed", empty: "No confirmed orders yet." },
  { value: "rejected", label: "Rejected", empty: "No rejected orders." },
  { value: "all", label: "All", empty: "No orders yet." },
]

export function OrdersDashboard() {
  const byId = useOrdersStore((state) => state.byId)
  const filter = useOrdersStore((state) => state.filter)
  const loading = useOrdersStore((state) => state.loading)
  const loaded = useOrdersStore((state) => state.loaded)
  const error = useOrdersStore((state) => state.error)
  const nextBefore = useOrdersStore((state) => state.nextBefore)
  const { setFilter, load, loadMore } = useOrdersStore.getState()

  const visible = React.useMemo(() => selectVisibleOrders({ byId, filter }), [byId, filter])
  const pendingCount = React.useMemo(() => selectPendingCount({ byId }), [byId])
  const current = tabs.find((tab) => tab.value === filter) ?? tabs[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Confirm Pochi la Biashara payments once the money is in.
          </p>
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as OrderFilter)}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer">
                {tab.label}
                {tab.value === "pending" && pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 font-price text-[0.7rem] text-primary-foreground tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-foreground/30 px-6 py-16 text-center text-muted-foreground">
          <InboxIcon className="size-8 text-primary" strokeWidth={1.5} />
          {current.empty}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {nextBefore && (
        <Button
          variant="outline"
          className="cursor-pointer self-center rounded-full"
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading && <SpinnerCustom data-icon="inline-start" />}
          Load older orders
        </Button>
      )}
    </div>
  )
}
