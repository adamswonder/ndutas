"use client"

import type { LoginResponse, StaffView } from "@ndutas/core"
import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import { adminFetch } from "./admin-api"

type AuthState = {
  token: string | null
  staff: StaffView | null
  // Shown on the login page after the session runs out.
  notice: string | null
  logIn: (email: string, password: string) => Promise<void>
  logOut: (notice?: string) => void
}

// sessionStorage: the session ends with the tab, and storage can be blocked (private mode).
const sessionStore: StateStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      // Not persisted; they stay signed in for this page view only.
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Nothing to clear.
    }
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      staff: null,
      notice: null,
      async logIn(email, password) {
        const { token, staff } = await adminFetch<LoginResponse>("/admin/login", {
          method: "POST",
          body: { email, password },
        })
        set({ token, staff, notice: null })
      },
      logOut(notice) {
        set({ token: null, staff: null, notice: notice ?? null })
      },
    }),
    {
      // v2: the session holds a staff member (with role), not an owner.
      name: "ndutas.admin.v2",
      storage: createJSONStorage(() => sessionStore),
      partialize: ({ token, staff }) => ({ token, staff }),
    }
  )
)
