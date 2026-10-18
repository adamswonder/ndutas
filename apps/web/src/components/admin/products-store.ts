"use client"

import type {
  AdminProduct,
  AdminProductResponse,
  AdminProductsResponse,
  MealCategory,
  ProductOrderRequest,
  ProductRequest,
  UploadResponse,
} from "@ndutas/core"
import { create } from "zustand"
import { asStaff } from "./staff-fetch"

type ProductsState = {
  byId: Record<string, AdminProduct>
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  setAvailable: (id: string, available: boolean) => Promise<void>
  // Creates when id is null.
  save: (id: string | null, details: ProductRequest) => Promise<AdminProduct>
  setArchived: (id: string, archived: boolean) => Promise<void>
  // Owner drags a category into a new order (the full list of that category's ids).
  reorder: (category: MealCategory, ids: string[]) => Promise<void>
  // Bulk actions: run the single-item calls side by side; resolves to how many failed.
  setManyAvailable: (ids: string[], available: boolean) => Promise<number>
  archiveMany: (ids: string[]) => Promise<number>
  // Owner: uploads an already-shrunk photo and returns its public URL.
  uploadPhoto: (photo: Blob) => Promise<string>
}

async function countFailures(tasks: Promise<unknown>[]) {
  const results = await Promise.allSettled(tasks)
  return results.filter((result) => result.status === "rejected").length
}

export const useProductsStore = create<ProductsState>()((set, get) => {
  function put(product: AdminProduct) {
    set((state) => ({ byId: { ...state.byId, [product.id]: product } }))
  }

  return {
    byId: {},
    loading: false,
    loaded: false,
    error: null,

    async load() {
      set({ loading: true, error: null })
      try {
        const { products } = await asStaff<AdminProductsResponse>("/admin/products")
        set({ byId: Object.fromEntries(products.map((p) => [p.id, p])), loading: false, loaded: true })
      } catch (error) {
        set({ loading: false, error: error instanceof Error ? error.message : "Couldn't load products." })
      }
    },

    // Optimistic: the switch flips at once and flips back if the API refuses.
    async setAvailable(id, available) {
      const before = get().byId[id]
      if (before) put({ ...before, available })
      try {
        const { product } = await asStaff<AdminProductResponse>(`/admin/products/${id}/availability`, {
          method: "PATCH",
          body: { available },
        })
        put(product)
      } catch (error) {
        if (before) put(before)
        throw error
      }
    },

    async save(id, details) {
      const { product } = await asStaff<AdminProductResponse>(id ? `/admin/products/${id}` : "/admin/products", {
        method: id ? "PUT" : "POST",
        body: details,
      })
      put(product)
      return product
    },

    async setArchived(id, archived) {
      const { product } = await asStaff<AdminProductResponse>(`/admin/products/${id}/archive`, {
        method: "PATCH",
        body: { archived },
      })
      put(product)
    },

    // Optimistic: rows stay where they were dropped and jump back if the API refuses.
    async reorder(category, ids) {
      const before = get().byId
      const moved = Object.fromEntries(
        ids.flatMap((id, index) => (before[id] ? [[id, { ...before[id], sortOrder: index + 1 }]] : []))
      )
      set({ byId: { ...before, ...moved } })
      try {
        const { products } = await asStaff<AdminProductsResponse>("/admin/products/order", {
          method: "PUT",
          body: { category, ids } satisfies ProductOrderRequest,
        })
        set((state) => ({ byId: { ...state.byId, ...Object.fromEntries(products.map((p) => [p.id, p])) } }))
      } catch (error) {
        set({ byId: before })
        throw error
      }
    },

    setManyAvailable(ids, available) {
      return countFailures(ids.map((id) => get().setAvailable(id, available)))
    },

    archiveMany(ids) {
      return countFailures(ids.map((id) => get().setArchived(id, true)))
    },

    async uploadPhoto(photo) {
      const { url } = await asStaff<UploadResponse>("/admin/uploads/product-image", { method: "POST", body: photo })
      return url
    },
  }
})
