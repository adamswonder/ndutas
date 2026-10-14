"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SpinnerCustom } from "@/components/spinner-custom"
import { cn } from "@/lib/utils"

// A confirmation dialog with one optional text field (M-Pesa code, rejection reason).
// Unlike ConfirmDialog it stays open while the request runs and shows the error if it fails.
export function DecisionDialog({
  trigger,
  icon,
  variant,
  title,
  description,
  fieldLabel,
  fieldPlaceholder,
  fieldClassName,
  confirmLabel,
  onConfirm,
}: {
  trigger: React.ReactElement
  icon: React.ReactNode
  variant: "default" | "destructive"
  title: string
  description: React.ReactNode
  fieldLabel: string
  fieldPlaceholder: string
  fieldClassName?: string
  confirmLabel: string
  onConfirm: (value: string) => Promise<void>
}) {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onConfirm(value.trim())
      setOpen(false)
      setValue("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <form onSubmit={submit} className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogMedia
              className={cn(
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                  : "bg-primary/10 text-primary dark:bg-primary/20"
              )}
            >
              {icon}
            </AlertDialogMedia>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2">
            <Label htmlFor={id}>{fieldLabel}</Label>
            <Input
              id={id}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={fieldPlaceholder}
              autoComplete="off"
              maxLength={200}
              className={cn("h-10", fieldClassName)}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" className="cursor-pointer" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit" variant={variant} className="cursor-pointer" disabled={pending}>
              {pending && <SpinnerCustom data-icon="inline-start" />}
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
