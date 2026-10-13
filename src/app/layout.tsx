import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono, Libre_Baskerville } from "next/font/google";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { Toaster } from "@/components/ui/sonner";
import { container } from "@/server/container";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ndutas Kitchen",
  description: "Packaged food, ready to order",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const products = await container().catalog.all();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${libreBaskerville.variable} ${figtree.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider products={products}>
          {children}
          <CartDrawer />
          <Toaster position="top-center" />
        </CartProvider>
      </body>
    </html>
  );
}
