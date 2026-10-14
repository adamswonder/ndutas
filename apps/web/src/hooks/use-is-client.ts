"use client"

import * as React from "react"

const subscribe = () => () => {}

// False during server rendering and hydration, true afterwards. Use it to avoid
// flashing "empty" UI before client-only state (like the saved cart) is available.
export function useIsClient() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
