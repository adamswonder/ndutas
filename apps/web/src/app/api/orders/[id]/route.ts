import { getOrder } from "@/server/api"

// Lightweight status endpoint polled by the order page while an M-Pesa prompt is pending.
// Proxies the API so the browser only ever talks to this site.
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params
  const order = await getOrder(id).catch(() => undefined)
  if (order === undefined) {
    return Response.json({ error: "unavailable" }, { status: 503 })
  }
  if (!order) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }
  return Response.json({ status: order.status }, { headers: { "Cache-Control": "no-store" } })
}
