import type { Metadata } from "next"
import { ProductsManager } from "@/components/admin/products-manager"

export const metadata: Metadata = { title: "Products · Ndutas Kitchen" }

// Signed-in only and rendered in the browser (AdminShell waits for the session), so there is
// nothing for Next to prerender here; skip its instant-navigation check for this page.
export const instant = false

export default function AdminProductsPage() {
  return <ProductsManager />
}
