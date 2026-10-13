"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

// Asks before anything destructive or hard to undo: removing cart items,
// logging out, owner actions in the back office. `trigger` must be a single
// element that accepts a ref (usually a <Button>).
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "destructive",
  icon = <Trash2Icon />,
  onConfirm,
}: {
  trigger: React.ReactElement
  title: React.ReactNode
  description: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  variant?: "destructive" | "default"
  icon?: React.ReactNode
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          {icon && (
            <AlertDialogMedia
              className={cn(
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                  : "bg-primary/10 text-primary dark:bg-primary/20"
              )}
            >
              {icon}
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
