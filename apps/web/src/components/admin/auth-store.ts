"use client"

import type { LoginResponse, OwnerView } from "@ndutas/core"
import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import { adminFetch } from "./admin-api"

type AuthState = {
  token: string | null
  owner: OwnerView | null
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
      // Not persisted; the owner stays signed in for this page view only.
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
      owner: null,
      notice: null,
      async logIn(email, password) {
        const { token, owner } = await adminFetch<LoginResponse>("/admin/login", {
          method: "POST",
          body: { email, password },
        })
        set({ token, owner, notice: null })
      },
      logOut(notice) {
        set({ token: null, owner: null, notice: notice ?? null })
      },
    }),
    {
      name: "ndutas.admin.v1",
      storage: createJSONStorage(() => sessionStore),
      partialize: ({ token, owner }) => ({ token, owner }),
    }
  )
)
