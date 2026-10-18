"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardListIcon, PackageIcon, type LucideIcon } from "lucide-react"
import type { StaffRole } from "@ndutas/core"
import { cn } from "@/lib/utils"
import { useAuthStore } from "./auth-store"

// Back office sections. `ownerOnly` pages are hidden from staff (the API refuses them too).
const sections: { href: string; label: string; icon: LucideIcon; ownerOnly?: boolean }[] = [
  { href: "/admin/orders", label: "Orders", icon: ClipboardListIcon },
  { href: "/admin/products", label: "Products", icon: PackageIcon },
]

export function canSee(role: StaffRole | undefined, section: { ownerOnly?: boolean }) {
  return !section.ownerOnly || role === "owner"
}

export function AdminNav() {
  const pathname = usePathname()
  const role = useAuthStore((state) => state.staff?.role)

  return (
    <nav aria-label="Back office" className="-mb-px flex gap-1 overflow-x-auto">
      {sections.filter((section) => canSee(role, section)).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
