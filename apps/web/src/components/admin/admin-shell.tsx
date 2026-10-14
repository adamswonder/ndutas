"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOutIcon, UtensilsCrossedIcon } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { SpinnerCustom } from "@/components/spinner-custom"
import { useIsClient } from "@/hooks/use-is-client"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"
import { useAuthStore } from "./auth-store"
import { useOrdersStore, type ConnectionState } from "./orders-store"
import { useOrderSocket } from "./use-order-socket"

const connectionLabel: Record<ConnectionState, { label: string; dot: string }> = {
  live: { label: "Live", dot: "bg-emerald-500" },
  connecting: { label: "Connecting…", dot: "bg-amber-500 animate-pulse" },
  reconnecting: { label: "Reconnecting…", dot: "bg-amber-500 animate-pulse" },
}

// Signed-in frame for back office pages: header, live status, log out, and the order socket.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isClient = useIsClient()
  const token = useAuthStore((state) => state.token)

  React.useEffect(() => {
    if (isClient && !token) router.replace("/admin/login")
  }, [isClient, token, router])

  if (!isClient || !token) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <SpinnerCustom className="size-6 text-primary" />
      </div>
    )
  }
  return <SignedIn>{children}</SignedIn>
}

function SignedIn({ children }: { children: React.ReactNode }) {
  useOrderSocket()
  const owner = useAuthStore((state) => state.owner)
  const connection = useOrdersStore((state) => state.connection)
  const status = connectionLabel[connection]

  function logOut() {
    useOrdersStore.getState().reset()
    useAuthStore.getState().logOut()
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UtensilsCrossedIcon className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block font-heading font-semibold whitespace-nowrap">{site.name}</span>
              <span className="block text-xs text-muted-foreground">Back office</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
              <span className={cn("size-2 rounded-full", status.dot)} aria-hidden />
              {status.label}
            </span>
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" className="cursor-pointer rounded-full">
                  <LogOutIcon data-icon="inline-start" />
                  <span className="max-sm:sr-only">Log out</span>
                </Button>
              }
              variant="default"
              icon={<LogOutIcon />}
              title="Log out?"
              description={`You'll stop getting new order alerts${owner ? `, ${owner.name}` : ""}.`}
              confirmLabel="Log out"
              onConfirm={logOut}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  )
}
