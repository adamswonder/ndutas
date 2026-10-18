"use client"

import { AdminApiError, adminFetch } from "./admin-api"
import { useAuthStore } from "./auth-store"

// Calls the API as the signed-in staff member. An expired session sends them back to the
// login; "owner only" (403) errors are left for the caller to show.
export async function asStaff<T>(path: string, init: { method?: string; body?: unknown } = {}) {
  const { token, logOut } = useAuthStore.getState()
  try {
    return await adminFetch<T>(path, { ...init, token })
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      logOut("Your session ended. Please sign in again.")
    }
    throw error
  }
}
