import type * as React from "react"
import { SpinnerCustom } from "@/components/spinner-custom"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

// Full-card "please wait" state for slow, money-related steps: placing an
// order and waiting for the M-Pesa PIN.
export function ProcessingState({
  title,
  description,
  children,
  as: Heading = "h1",
  className,
}: {
  title: React.ReactNode
  description: React.ReactNode
  children?: React.ReactNode
  as?: "h1" | "h2"
  className?: string
}) {
  return (
    <Empty
      aria-live="polite"
      className={cn("rounded-2xl border border-solid border-border bg-card px-5 py-14 md:px-8 md:py-16", className)}
    >
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-primary">
          <SpinnerCustom className="size-6" />
        </EmptyMedia>
        <EmptyTitle>
          <Heading className="font-heading text-2xl font-normal tracking-tight md:text-3xl">
            {title}
          </Heading>
        </EmptyTitle>
        <EmptyDescription className="text-base/relaxed">{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  )
}
