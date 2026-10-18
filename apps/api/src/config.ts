// Everything the API reads from the environment, in one place.
export type Config = {
  port: number
  // Origins allowed to call the back office endpoints from a browser.
  webOrigins: string[]
  jwtSecret: Uint8Array
  // Neon: pooled URL for queries, direct (unpooled) URL for LISTEN/NOTIFY.
  databaseUrl?: string
  databaseUrlUnpooled?: string
  // Without DATABASE_URL: where the local PGlite database lives ("memory://" for tests).
  localDataDir: string
  payment:
    | { method: "manual"; payTo: string; payToName: string }
    | { method: "stk" }
  // Where to tell the storefront that the menu changed (its /api/revalidate route).
  webRevalidateUrl?: string
  revalidateSecret?: string
  // Product photo uploads go to Vercel Blob, authenticated either by a read-write token, or
  // (how Vercel connects stores now) by BLOB_STORE_ID plus the function's own OIDC identity.
  // Otherwise a local folder that the API serves itself (publicUrl is how browsers reach it).
  blobToken?: string
  blobStoreId?: string
  localUploadsDir: string
  publicUrl: string
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
  if (production && !env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in production.")
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
    localDataDir: env.LOCAL_DB_DIR || ".data/pglite",
    webRevalidateUrl: env.WEB_REVALIDATE_URL || undefined,
    blobToken: env.BLOB_READ_WRITE_TOKEN || undefined,
    blobStoreId: env.BLOB_STORE_ID || undefined,
    localUploadsDir: env.LOCAL_UPLOADS_DIR || ".data/uploads",
    publicUrl: (env.PUBLIC_API_URL || `http://localhost:${env.PORT || 4000}`).replace(/\/$/, ""),
    revalidateSecret: env.REVALIDATE_SECRET || undefined,
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
