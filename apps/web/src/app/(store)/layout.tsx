import { CartDrawer } from "@/components/cart/cart-drawer"
import { CartProvider } from "@/components/cart/cart-provider"
import { getProducts } from "@/server/api"

// The customer-facing site: everything here shares the cart and its drawer.
// The menu comes from the API (cached; refreshed when the back office changes it).
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const products = await getProducts()
  return (
    <CartProvider products={products}>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
