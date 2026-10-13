import type * as React from "react"
import { LoaderIcon } from "lucide-react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// The spoked "custom" spinner from the shadcn spinner examples.
function SpinnerCustom({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

// Full-card "please wait" state for slow, money-related steps: placing an
// order, waiting for the M-Pesa PIN, waiting for a manual payment check.
export function ProcessingState({
  title,
  description,
  children,
  as: Heading = "h1",
  spinner = "default",
  className,
}: {
  title: React.ReactNode
  description: React.ReactNode
  children?: React.ReactNode
  as?: "h1" | "h2"
  spinner?: "default" | "custom"
  className?: string
}) {
  const SpinnerIcon = spinner === "custom" ? SpinnerCustom : Spinner

  return (
    <Empty
      aria-live="polite"
      className={cn("rounded-2xl border border-solid border-border bg-card px-5 py-14 md:px-8 md:py-16", className)}
    >
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-primary">
          <SpinnerIcon className="size-6" />
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
