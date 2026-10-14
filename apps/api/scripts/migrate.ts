// Applies the SQL in ./drizzle to the database in DATABASE_URL: `pnpm --filter @ndutas/api db:migrate`.
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("Set DATABASE_URL in apps/api/.env first.")
  process.exit(1)
}

await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" })
console.log("Migrations applied.")
