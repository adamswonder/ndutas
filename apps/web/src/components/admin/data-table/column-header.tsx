"use client"

import type { Column, RowData } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Features } from "./features"

// A header that sorts its column: click for ascending, again for descending, again to clear.
export function ColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  align = "left",
}: {
  column: Column<Features, TData, TValue>
  title: string
  align?: "left" | "right"
}) {
  if (!column.getCanSort()) {
    return <div className={cn(align === "right" && "text-right")}>{title}</div>
  }
  const sorted = column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ChevronsUpDownIcon
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 uppercase hover:text-foreground",
        align === "right" && "ml-auto flex"
      )}
      aria-label={`Sort by ${title}`}
    >
      {title}
      <Icon className={cn("size-3.5", !sorted && "text-muted-foreground/60")} />
    </button>
  )
}
