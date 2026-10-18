// Local development: `pnpm --filter @ndutas/api dev` (reads apps/api/.env).
import { config, server } from "./server.js"

server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`)
})
