import { AdminShell } from "@/components/admin/admin-shell"

// Every signed-in back office page shares one shell, so the live order socket stays
// connected while moving between pages.
export default function SignedInLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>
}
