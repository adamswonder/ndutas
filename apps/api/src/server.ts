import { loadConfig } from "./config.js"
import { buildContainer, seedDevOwner } from "./container.js"
import { createApiServer } from "./http-server.js"

// The one API instance for this process, shared by api/server.ts (Vercel) and src/local.ts.
const config = loadConfig()
const container = buildContainer(config)
export const ready = seedDevOwner(container, config)
export const server = createApiServer(container, config)
export { config }
