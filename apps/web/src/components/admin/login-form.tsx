"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { UtensilsCrossedIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SpinnerCustom } from "@/components/spinner-custom"
import { useIsClient } from "@/hooks/use-is-client"
import { site } from "@/lib/site"
import { useAuthStore } from "./auth-store"

export function LoginForm() {
  const router = useRouter()
  const isClient = useIsClient()
  const token = useAuthStore((state) => state.token)
  const notice = useAuthStore((state) => state.notice)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (isClient && token) router.replace("/admin")
  }, [isClient, token, router])

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    try {
      await useAuthStore.getState().logIn(String(form.get("email")), String(form.get("password")))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't sign in.")
      setPending(false)
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 md:p-8">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <UtensilsCrossedIcon className="size-5" />
      </span>
      <h1 className="mt-4 font-heading text-2xl">{site.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to the back office.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        {(error ?? notice) && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error ?? notice}
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 cursor-pointer rounded-full" disabled={pending}>
          {pending && <SpinnerCustom data-icon="inline-start" />}
          Sign in
        </Button>
      </form>
    </div>
  )
}
