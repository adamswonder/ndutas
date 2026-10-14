import { AdminShell } from "@/components/admin/admin-shell"
import { OrdersDashboard } from "@/components/admin/orders-dashboard"

export default function AdminPage() {
  return (
    <AdminShell>
      <OrdersDashboard />
    </AdminShell>
  )
}
