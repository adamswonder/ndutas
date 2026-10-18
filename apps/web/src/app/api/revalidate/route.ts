import { revalidateTag } from "next/cache"

// Called by the API after the back office changes the menu, so the cached "products" data
// is thrown away at once. Protected by a shared secret (REVALIDATE_SECRET on both sides).
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const { tag } = (await request.json().catch(() => ({}))) as { tag?: string }
  if (tag !== "products") {
    return Response.json({ error: "unknown tag" }, { status: 400 })
  }
  revalidateTag(tag, { expire: 0 })
  return Response.json({ revalidated: tag })
}
