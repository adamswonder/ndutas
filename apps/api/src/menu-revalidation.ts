import { waitUntil } from "@vercel/functions"
import type { Config } from "./config.js"

// The storefront caches the menu (Next "use cache" tagged "products"). After the back office
// changes a product, tell it to refresh so customers see the change within seconds.
// Best effort: if the call fails, the cache still expires on its own within the hour.
export function createMenuRevalidator(config: Config) {
  return function menuChanged() {
    if (!config.webRevalidateUrl || !config.revalidateSecret) return
    const task = fetch(config.webRevalidateUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": config.revalidateSecret },
      body: JSON.stringify({ tag: "products" }),
      signal: AbortSignal.timeout(5000),
    })
      .then((response) => {
        // Vercel's build sees fetch's Response as an empty type (@types/node leaves it empty
        // whenever something declares a global `onmessage`), so read the two fields we need
        // through `unknown`, which type-checks however Response is defined.
        const { ok, status } = response as unknown as { ok: boolean; status: number }
        if (!ok) console.error(`Menu revalidation failed: ${status}`)
      })
      .catch((error) => console.error("Menu revalidation failed", error))
    if (process.env.VERCEL) waitUntil(task)
  }
}
