import { loadConfig } from "./config.js"
import { buildContainer, seedDevOwner } from "./container.js"
import { connectDatabase } from "./db/connect.js"
import { createApiServer } from "./http-server.js"

// The one API instance for this process.
// - On Vercel (Express preset), this file is the entry point: the default export is the
//   Node http.Server carrying both Express and the back office WebSocket.
// - Locally, src/local.ts imports it and calls listen().
const config = loadConfig()
const container = buildContainer(config, await connectDatabase(config))
await seedDevOwner(container, config)
export const server = createApiServer(container, config)
export { config }
export default server
