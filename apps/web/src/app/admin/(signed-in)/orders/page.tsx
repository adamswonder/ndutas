import type { Metadata } from "next"
import { OrdersDashboard } from "@/components/admin/orders-dashboard"

export const metadata: Metadata = { title: "Orders · Ndutas Kitchen" }

// Signed-in only and rendered in the browser (AdminShell waits for the session), so there is
// nothing for Next to prerender here; skip its instant-navigation check for this page.
export const instant = false

export default function AdminOrdersPage() {
  return <OrdersDashboard />
}
