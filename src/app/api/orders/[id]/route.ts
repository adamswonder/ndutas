import { container } from "@/server/container"

// Lightweight status endpoint polled by the order page while payment is pending.
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params
  const order = await container().getOrder(id)
  if (!order) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }
  return Response.json(
    { status: order.status },
    { headers: { "Cache-Control": "no-store" } }
  )
}
