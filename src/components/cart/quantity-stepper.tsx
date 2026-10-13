"use client"

import type * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { MAX_QUANTITY_PER_LINE } from "@/core/domain/cart"
import { cn } from "@/lib/utils"

export function QuantityStepper({
  name,
  quantity,
  onChange,
  className,
}: {
  name: string
  quantity: number
  onChange: (quantity: number) => void
  className?: string
}) {
  return (
    <div
      className={cn("inline-flex items-center rounded-full border border-border bg-background", className)}
    >
      {quantity === 1 ? (
        // Going below one removes the line, so confirm first.
        <RemoveItemDialog name={name} onConfirm={() => onChange(0)}>
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={`Remove ${name}`}>
            <MinusIcon />
          </Button>
        </RemoveItemDialog>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          onClick={() => onChange(quantity - 1)}
          aria-label={`One less ${name}`}
        >
          <MinusIcon />
        </Button>
      )}
      <span className="min-w-6 text-center font-price text-sm font-medium tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY_PER_LINE}
        aria-label={`One more ${name}`}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

export function RemoveItemDialog({
  name,
  onConfirm,
  children,
}: {
  name: string
  onConfirm: () => void
  children: React.ReactElement
}) {
  return (
    <ConfirmDialog
      trigger={children}
      title={`Remove ${name}?`}
      description="It will be taken out of your cart. You can add it again from the menu."
      confirmLabel="Remove"
      onConfirm={onConfirm}
    />
  )
}
