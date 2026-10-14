// Creates a back office login: `pnpm --filter @ndutas/api owner:create`.
// Prompts for the details so the password never lands in shell history.
import { createInterface } from "node:readline/promises"
import { isDomainError } from "@ndutas/core"
import { loadConfig } from "../src/config.js"
import { buildContainer } from "../src/container.js"

const config = loadConfig()
if (!config.databaseUrl) {
  console.error("Set DATABASE_URL in apps/api/.env first (owners are stored in Neon).")
  process.exit(1)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const email = await rl.question("Email: ")
const name = await rl.question("Name: ")
const password = await rl.question("Password (10+ characters): ")
rl.close()

try {
  const owner = await buildContainer(config).createOwner({ email, name, password })
  console.log(`Created owner ${owner.email}.`)
} catch (error) {
  console.error(isDomainError(error) ? error.message : error)
  process.exit(1)
}
