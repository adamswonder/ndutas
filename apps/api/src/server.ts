import { loadConfig } from "./config.js"
import { buildContainer, seedDevOwner } from "./container.js"
import { connectDatabase } from "./db/connect.js"
import { createApiServer } from "./http-server.js"

// The one API instance for this process, shared by api/server.ts (Vercel) and src/local.ts.
const config = loadConfig()
const container = buildContainer(config, await connectDatabase(config))
await seedDevOwner(container, config)
export const server = createApiServer(container, config)
export { config }
