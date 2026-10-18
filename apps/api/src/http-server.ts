import { createServer } from "node:http"
import type { Express } from "express"
import { createApp } from "./express-app.js"
import type { Config } from "./config.js"
import type { Container } from "./container.js"
import { attachOrderSockets } from "./realtime/socket-hub.js"

// The Express app and the order WebSocket on one HTTP server, as Vercel expects for
// WebSockets in a Node function (see src/server.ts).
export function createApiServer(container: Container, config: Config, app: Express = createApp(container, config)) {
  const server = createServer(app)
  attachOrderSockets(server, container)
  return server
}
