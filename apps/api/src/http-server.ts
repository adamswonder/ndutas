import { createServer } from "node:http"
import { createApp } from "./express-app.js"
import type { Config } from "./config.js"
import type { Container } from "./container.js"
import { attachOrderSockets } from "./realtime/socket-hub.js"

// The Express app and the order WebSocket on one HTTP server, as Vercel expects for
// WebSockets in a Node function (see api/server.ts).
export function createApiServer(container: Container, config: Config) {
  const server = createServer(createApp(container, config))
  attachOrderSockets(server, container)
  return server
}
