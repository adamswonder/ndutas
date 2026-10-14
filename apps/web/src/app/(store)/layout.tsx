import { meals } from "@ndutas/core"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { CartProvider } from "@/components/cart/cart-provider"

// The customer-facing site: everything here shares the cart and its drawer.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  // The menu is shared static data in @ndutas/core until the back office manages it.
  return (
    <CartProvider products={meals}>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
