import type * as React from "react"
import { LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// The spoked spinner from the shadcn spinner examples, used across the payment flow.
export function SpinnerCustom({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}
