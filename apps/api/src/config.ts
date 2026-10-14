// Everything the API reads from the environment, in one place.
export type Config = {
  port: number
  // Origins allowed to call the back office endpoints from a browser.
  webOrigins: string[]
  jwtSecret: Uint8Array
  // Neon: pooled URL for queries, direct (unpooled) URL for LISTEN/NOTIFY.
  databaseUrl?: string
  databaseUrlUnpooled?: string
  payment:
    | { method: "manual"; payTo: string; payToName: string }
    | { method: "stk" }
  // Local development without a database: seed one back office login.
  devOwner?: { email: string; password: string; name: string }
}

const DEV_JWT_SECRET = "dev-only-secret-change-me-dev-only-secret"

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === "production" || !!env.VERCEL
  const jwtSecret = env.JWT_SECRET || (production ? undefined : DEV_JWT_SECRET)
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.")
  }

  return {
    port: Number(env.PORT || 4000),
    webOrigins: (env.WEB_ORIGIN || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    jwtSecret: new TextEncoder().encode(jwtSecret),
    databaseUrl: env.DATABASE_URL || undefined,
    databaseUrlUnpooled: env.DATABASE_URL_UNPOOLED || env.DATABASE_URL || undefined,
    // Pochi la Biashara until the client has a Till/Paybill; then set PAYMENT_METHOD=stk.
    payment:
      env.PAYMENT_METHOD === "stk"
        ? { method: "stk" }
        : {
            method: "manual",
            payTo: env.MPESA_PAY_TO || "0796 929 502",
            payToName: env.MPESA_PAY_TO_NAME || "Shelma Maina",
          },
    devOwner:
      !production && env.DEV_OWNER_EMAIL && env.DEV_OWNER_PASSWORD
        ? {
            email: env.DEV_OWNER_EMAIL,
            password: env.DEV_OWNER_PASSWORD,
            name: env.DEV_OWNER_NAME || "Owner",
          }
        : undefined,
  }
}
