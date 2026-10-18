import { SpinnerCustom } from "@/components/spinner-custom"

// Shown while checkout loads (the payment setup from the API, then the saved cart).
export function CheckoutLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-sm text-muted-foreground"
    >
      <SpinnerCustom className="size-6 text-primary" />
      Loading checkout…
    </div>
  )
}
