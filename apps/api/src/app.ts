import cors from "cors"
import express from "express"
import type { Config } from "./config.js"
import type { Container } from "./container.js"
import { errorHandler, HttpError } from "./errors.js"
import { adminRoutes } from "./routes/admin.js"
import { publicRoutes } from "./routes/public.js"

export function createApp(container: Container, config: Config) {
  const app = express()
  app.disable("x-powered-by")
  app.set("trust proxy", true)
  app.use(express.json({ limit: "20kb" }))

  app.use(publicRoutes(container))
  // Only the back office runs in a browser, so only it needs CORS.
  app.use(
    "/admin",
    cors({ origin: config.webOrigins, allowedHeaders: ["Content-Type", "Authorization"] }),
    adminRoutes(container)
  )

  app.use((_req, _res, next) => next(new HttpError(404, "Not found.")))
  app.use(errorHandler)
  return app
}
