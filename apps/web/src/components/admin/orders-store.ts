"use client"

import {
  ORDER_FILTERS,
  type AdminOrderView,
  type OrderFilter,
  type OrderResponse,
  type OrdersResponse,
} from "@ndutas/core"
import { create } from "zustand"
import { asStaff } from "./staff-fetch"

export type ConnectionState = "connecting" | "live" | "reconnecting"

type OrdersState = {
  byId: Record<string, AdminOrderView>
  filter: OrderFilter
  loading: boolean
  loaded: boolean
  error: string | null
  nextBefore: string | null
  // Orders that arrived while nobody was looking at them.
  unseen: Record<string, true>
  connection: ConnectionState
  setFilter: (filter: OrderFilter) => void
  load: () => Promise<void>
  loadMore: () => Promise<void>
  upsert: (order: AdminOrderView, options?: { isNew?: boolean }) => void
  markSeen: (id: string) => void
  setConnection: (connection: ConnectionState) => void
  confirm: (id: string, mpesaReceipt?: string) => Promise<void>
  reject: (id: string, reason: string) => Promise<void>
  reset: () => void
}

const initial = {
  byId: {},
  filter: "pending" as OrderFilter,
  loading: false,
  loaded: false,
  error: null,
  nextBefore: null,
  unseen: {},
  connection: "connecting" as ConnectionState,
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
  ...initial,

  setFilter(filter) {
    set({ filter, nextBefore: null })
    void get().load()
  },

  // Also the safety net after every (re)connect: anything missed while offline shows up here.
  async load() {
    const { filter } = get()
    set({ loading: true, error: null })
    try {
      const res = await asStaff<OrdersResponse>(`/admin/orders?filter=${filter}`)
      set((state) => {
        const byId = { ...state.byId }
        const unseen = { ...state.unseen }
        for (const order of res.orders) {
          if (state.loaded && !byId[order.id] && order.status === "awaiting_verification") {
            unseen[order.id] = true
          }
          byId[order.id] = order
        }
        return { byId, unseen, loading: false, loaded: true, nextBefore: res.nextBefore }
      })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Couldn't load orders." })
    }
  },

  async loadMore() {
    const { filter, nextBefore } = get()
    if (!nextBefore) return
    set({ loading: true })
    try {
      const res = await asStaff<OrdersResponse>(
        `/admin/orders?filter=${filter}&before=${encodeURIComponent(nextBefore)}`
      )
      set((state) => ({
        byId: { ...state.byId, ...Object.fromEntries(res.orders.map((o) => [o.id, o])) },
        nextBefore: res.nextBefore,
        loading: false,
      }))
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Couldn't load orders." })
    }
  },

  upsert(order, options) {
    set((state) => ({
      byId: { ...state.byId, [order.id]: order },
      unseen: options?.isNew ? { ...state.unseen, [order.id]: true } : state.unseen,
    }))
  },

  markSeen(id) {
    if (!get().unseen[id]) return
    set((state) => {
      const unseen = { ...state.unseen }
      delete unseen[id]
      return { unseen }
    })
  },

  setConnection(connection) {
    set({ connection })
  },

  // Optimistic: the card updates at once and rolls back if the API refuses.
  async confirm(id, mpesaReceipt) {
    const before = get().byId[id]
    if (before) get().upsert({ ...before, status: "paid", mpesaReceipt })
    try {
      const { order } = await asStaff<OrderResponse>(`/admin/orders/${id}/confirm`, {
        method: "POST",
        body: { mpesaReceipt },
      })
      get().upsert(order)
      get().markSeen(id)
    } catch (error) {
      if (before) get().upsert(before)
      throw error
    }
  },

  async reject(id, reason) {
    const before = get().byId[id]
    if (before) get().upsert({ ...before, status: "rejected", failureReason: reason })
    try {
      const { order } = await asStaff<OrderResponse>(`/admin/orders/${id}/reject`, {
        method: "POST",
        body: { reason },
      })
      get().upsert(order)
      get().markSeen(id)
    } catch (error) {
      if (before) get().upsert(before)
      throw error
    }
  },

  reset() {
    set(initial)
  },
}))

// The orders the current tab shows, newest first.
export function selectVisibleOrders(state: Pick<OrdersState, "byId" | "filter">) {
  const statuses: readonly string[] | undefined = ORDER_FILTERS[state.filter]
  return Object.values(state.byId)
    .filter((order) => !statuses || statuses.includes(order.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function selectPendingCount(state: Pick<OrdersState, "byId">) {
  return Object.values(state.byId).filter((order) => order.status === "awaiting_verification").length
}
