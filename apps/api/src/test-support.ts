import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { loadConfig } from "./config.js"
import { buildContainer } from "./container.js"
import { connectDatabase } from "./db/connect.js"

// A complete API container on an in-memory PGlite database: real SQL and migrations,
// nothing left behind after the test run.
export async function createTestContainer(env: NodeJS.ProcessEnv = {}) {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-test-secret-test-secret!",
    WEB_ORIGIN: "http://localhost:3000",
    LOCAL_DB_DIR: "memory://",
    LOCAL_UPLOADS_DIR: mkdtempSync(path.join(tmpdir(), "ndutas-uploads-")),
    ...env,
  })
  const container = buildContainer(config, await connectDatabase(config))
  return { config, container }
}
