import type { IncomingMessage, Server } from "node:http"
import type { Duplex } from "node:stream"
import { isActiveStaff, toAdminOrderView, type OrderSocketMessage } from "@ndutas/core"
import { WebSocket, WebSocketServer } from "ws"
import type { Container } from "../container.js"
import type { FeedEvent } from "./feed.js"

const HEARTBEAT_MS = 25_000

// Live order alerts for signed-in staff: GET /admin/ws?ticket=<one-minute ticket>.
// Each API instance pushes to the sockets it holds; the feed (LISTEN/NOTIFY on Neon)
// tells every instance about orders placed anywhere. Vercel closes sockets at the
// function's max duration, so clients reconnect and refetch (see the web back office).
export function attachOrderSockets(server: Server, container: Container) {
  const wss = new WebSocketServer({ noServer: true })
  const alive = new WeakMap<WebSocket, boolean>()
  let unsubscribe: (() => void) | null = null

  async function broadcast(event: FeedEvent) {
    const order = await container.getOrder(event.orderId)
    if (!order) return
    const message: OrderSocketMessage = { type: event.type, order: toAdminOrderView(order) }
    const data = JSON.stringify(message)
    for (const socket of wss.clients) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data)
    }
  }

  server.on("upgrade", async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? "/", "http://localhost")
    const ticket = url.searchParams.get("ticket")
    const staffId =
      url.pathname.endsWith("/admin/ws") && ticket
        ? await container.auth.verifyWsTicket(ticket)
        : null
    if (!staffId || !isActiveStaff(await container.staff.findById(staffId))) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n")
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req))
  })

  wss.on("connection", (ws) => {
    alive.set(ws, true)
    ws.on("pong", () => alive.set(ws, true))
    ws.on("error", () => ws.terminate())
    ws.on("close", () => {
      if (wss.clients.size === 0) {
        unsubscribe?.()
        unsubscribe = null
      }
    })
    unsubscribe ??= container.feed.subscribe((event) => {
      broadcast(event).catch((error) => console.error("Order broadcast failed", error))
    })
    ws.send(JSON.stringify({ type: "ready" } satisfies OrderSocketMessage))
  })

  // Drop sockets that stopped answering pings (sleeping laptops, dead networks).
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.get(ws)) {
        ws.terminate()
        continue
      }
      alive.set(ws, false)
      ws.ping()
    }
  }, HEARTBEAT_MS)
  heartbeat.unref()
  server.on("close", () => clearInterval(heartbeat))

  return wss
}
