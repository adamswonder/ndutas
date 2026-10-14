"use client"

import * as React from "react"
import type { OrderSocketMessage, WsTicketResponse } from "@ndutas/core"
import { toast } from "sonner"
import { formatPrice } from "@/lib/format"
import { AdminApiError, adminFetch, orderSocketUrl } from "./admin-api"
import { useAuthStore } from "./auth-store"
import { useOrdersStore } from "./orders-store"

const MAX_DELAY_MS = 30_000

// Keeps a WebSocket open to the API while the owner is signed in. Vercel closes sockets at
// the function's max duration (about 5 minutes), so closing is normal: reconnect with
// backoff, and refetch the list each time the socket is ready so nothing is missed.
export function useOrderSocket() {
  const token = useAuthStore((state) => state.token)

  React.useEffect(() => {
    if (!token) return
    const orders = useOrdersStore.getState
    let socket: WebSocket | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let delay = 1000
    let stopped = false
    let everConnected = false

    function retryLater() {
      if (stopped) return
      orders().setConnection("reconnecting")
      clearTimeout(timer)
      timer = setTimeout(connect, delay)
      delay = Math.min(delay * 2, MAX_DELAY_MS)
    }

    async function connect() {
      if (stopped) return
      orders().setConnection(everConnected ? "reconnecting" : "connecting")
      let ticket: string
      try {
        ;({ ticket } = await adminFetch<WsTicketResponse>("/admin/ws-ticket", {
          method: "POST",
          token,
        }))
      } catch (error) {
        if (error instanceof AdminApiError && error.status === 401) {
          useAuthStore.getState().logOut("Your session ended. Please sign in again.")
          return
        }
        retryLater()
        return
      }
      if (stopped) return

      const ws = new WebSocket(orderSocketUrl(ticket))
      socket = ws
      ws.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as OrderSocketMessage
        if (message.type === "ready") {
          everConnected = true
          delay = 1000
          orders().setConnection("live")
          void orders().load()
          return
        }
        const isNew = message.type === "order.placed" && !orders().byId[message.order.id]
        orders().upsert(message.order, { isNew })
        if (isNew) announce(message.order.reference, message.order.customerName, message.order.total)
      }
      ws.onclose = () => {
        if (socket === ws) socket = null
        retryLater()
      }
    }

    // Phones pause background tabs; reconnect straight away when the owner comes back.
    function onVisible() {
      if (document.visibilityState !== "visible" || socket) return
      clearTimeout(timer)
      delay = 1000
      void connect()
    }

    void connect()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
      socket?.close()
    }
  }, [token])
}

function announce(reference: string, customerName: string, total: number) {
  toast.success(`New order ${reference}`, {
    description: `${customerName} · ${formatPrice(total)}`,
  })
  chime()
}

// A short two-note chime made in the browser, so there is no audio file to load.
// Browsers only allow it after the owner has interacted with the page (signing in counts).
function chime() {
  try {
    const audio = new AudioContext()
    const notes = [880, 1320]
    notes.forEach((frequency, i) => {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const start = audio.currentTime + i * 0.18
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3)
      oscillator.connect(gain).connect(audio.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.32)
    })
    setTimeout(() => void audio.close(), 1000)
  } catch {
    // No audio available; the toast is enough.
  }
}
