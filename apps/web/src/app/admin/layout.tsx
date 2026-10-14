import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Back office · Ndutas Kitchen",
  robots: { index: false, follow: false },
}

// The owner's back office. It has no cart; it talks to the API from the browser.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-svh flex-1 flex-col">{children}</div>
}
