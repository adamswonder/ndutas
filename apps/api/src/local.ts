// Local development: `pnpm --filter @ndutas/api dev` (reads apps/api/.env).
import { config, ready, server } from "./server.js"

await ready
server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`)
})
