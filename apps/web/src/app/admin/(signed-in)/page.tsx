import { redirect } from "next/navigation"

// Only redirects (signed-in pages render in the browser), so skip instant-navigation checks.
export const instant = false

// The Overview dashboard comes later (M6); until then the back office opens on Orders.
export default function AdminHome() {
  redirect("/admin/orders")
}
