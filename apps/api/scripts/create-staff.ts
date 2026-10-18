// Creates a back office login: `pnpm --filter @ndutas/api staff:create`.
// Uses Neon when DATABASE_URL is set, otherwise the local PGlite database.
// Prompts for the details so the password never lands in shell history.
import { createInterface } from "node:readline/promises"
import { isDomainError, type StaffRole } from "@ndutas/core"
import { loadConfig } from "../src/config.js"
import { buildContainer } from "../src/container.js"
import { connectDatabase } from "../src/db/connect.js"

const config = loadConfig()
console.log(`Creating a back office login in ${config.databaseUrl ? "Neon" : `local PGlite (${config.localDataDir})`}.`)

const rl = createInterface({ input: process.stdin, output: process.stdout })
const email = await rl.question("Email: ")
const name = await rl.question("Name: ")
const roleAnswer = (await rl.question("Role, owner or staff [owner]: ")).trim().toLowerCase()
const password = await rl.question("Password (10+ characters): ")
rl.close()

const role: StaffRole = roleAnswer === "staff" ? "staff" : "owner"

try {
  const container = buildContainer(config, await connectDatabase(config))
  const member = await container.createStaff({ email, name, password, role })
  console.log(`Created ${member.role} ${member.email}.`)
  process.exit(0)
} catch (error) {
  console.error(isDomainError(error) ? error.message : error)
  process.exit(1)
}
