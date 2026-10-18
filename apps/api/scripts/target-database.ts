// Lets the one-off scripts (db:migrate, staff:create) work on the live database with
// `--production`, without editing .env: PRODUCTION_DATABASE_URL(_UNPOOLED) in apps/api/.env
// take the place of the dev branch's DATABASE_URL(_UNPOOLED) for that run only.
// Import this before loadConfig() reads the environment.
export const production = process.argv.includes("--production")

if (production) {
  const url = process.env.PRODUCTION_DATABASE_URL
  if (!url) {
    console.error("Set PRODUCTION_DATABASE_URL (and PRODUCTION_DATABASE_URL_UNPOOLED) in apps/api/.env first.")
    process.exit(1)
  }
  process.env.DATABASE_URL = url
  process.env.DATABASE_URL_UNPOOLED = process.env.PRODUCTION_DATABASE_URL_UNPOOLED || url
}

export const target = production ? "the PRODUCTION database" : "the dev database"
