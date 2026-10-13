"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"
import { retryPaymentAction, submitManualPaymentAction } from "@/app/orders/[id]/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"

const POLL_MS = 3000
const GIVE_UP_MS = 2 * 60 * 1000

// Polls the status endpoint and refreshes the page as soon as the status changes.
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
    return (
      <p className="text-sm text-muted-foreground">Waiting for M-Pesa confirmation…</p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <p>Still waiting. If you&apos;ve already paid, check again.</p>
      <Button
        variant="outline"
        className="rounded-full"
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
        className="rounded-full"
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
          <Spinner data-icon="inline-start" />
        ) : (
          <RotateCcwIcon data-icon="inline-start" />
        )}
        Try again
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export function ManualCodeForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [error, setError] = React.useState<string>()
  const [pending, startTransition] = React.useTransition()

  return (
    <form
      className="flex flex-col gap-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const code = String(new FormData(event.currentTarget).get("code") ?? "")
        startTransition(async () => {
          const res = await submitManualPaymentAction(orderId, code)
          if (res.ok) router.refresh()
          else setError(res.error)
        })
      }}
    >
      <Label htmlFor="code">M-Pesa confirmation code</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="code"
          name="code"
          placeholder="e.g. SJK4H7Q2XZ"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={12}
          aria-invalid={!!error}
          aria-describedby={error ? "code-error" : undefined}
          className="h-11 font-price uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
        />
        <Button type="submit" className="h-11 rounded-full px-6" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Submit code
        </Button>
      </div>
      {error && (
        <p id="code-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
