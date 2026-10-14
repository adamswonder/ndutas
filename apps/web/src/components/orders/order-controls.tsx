"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"
import { retryPaymentAction } from "@/app/(store)/orders/[id]/actions"
import { Button } from "@/components/ui/button"
import { SpinnerCustom } from "@/components/spinner-custom"

const POLL_MS = 3000
const GIVE_UP_MS = 2 * 60 * 1000

// Polls the status endpoint during an STK push and refreshes the page as soon as the
// status changes. Pochi orders don't poll: the owner may not be online to confirm.
export function StatusPoller({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter()
  const [timedOut, setTimedOut] = React.useState(false)

  React.useEffect(() => {
    if (timedOut) return
    const startedAt = Date.now()
    const timer = setInterval(async () => {
      if (Date.now() - startedAt > GIVE_UP_MS) {
        clearInterval(timer)
        setTimedOut(true)
        return
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" })
        const body = (await res.json()) as { status?: string }
        if (body.status && body.status !== status) {
          clearInterval(timer)
          router.refresh()
        }
      } catch {
        // Network blip: try again on the next tick.
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [orderId, status, router, timedOut])

  if (!timedOut) {
    return <p className="text-sm text-muted-foreground">Waiting for M-Pesa confirmation…</p>
  }

  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <p>Still waiting. If you&apos;ve already paid, check again.</p>
      <Button
        variant="outline"
        className="cursor-pointer rounded-full"
        onClick={() => {
          setTimedOut(false)
          router.refresh()
        }}
      >
        Check again
      </Button>
    </div>
  )
}

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [error, setError] = React.useState<string>()
  const [pending, startTransition] = React.useTransition()

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        className="cursor-pointer rounded-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await retryPaymentAction(orderId)
            if (res.ok) router.refresh()
            else setError(res.error)
          })
        }
      >
        {pending ? (
          <SpinnerCustom data-icon="inline-start" />
        ) : (
          <RotateCcwIcon data-icon="inline-start" />
        )}
        Try again
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

