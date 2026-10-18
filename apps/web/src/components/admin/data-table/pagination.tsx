"use client"

import type { RowData } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { AdminTable } from "./features"

// "N of M row(s) selected" · Rows per page · Page x of y · first/prev/next/last.
export function Pagination<TData extends RowData>({
  table,
  extra,
}: {
  table: AdminTable<TData>
  extra?: React.ReactNode
}) {
  const { pageIndex, pageSize } = table.state.pagination
  const pageCount = Math.max(table.getPageCount(), 1)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected
        </span>
        {extra}
      </div>
      <div className="ml-auto flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 max-md:hidden">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger id="rows-per-page" size="sm" className="w-20 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={`${size}`} className="cursor-pointer">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm font-medium tabular-nums">
          Page {Math.min(pageIndex + 1, pageCount)} of {pageCount}
        </span>
        <div className="flex items-center gap-1.5">
          <PageButton
            label="First page"
            className="max-md:hidden"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeftIcon />
          </PageButton>
          <PageButton label="Previous page" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon />
          </PageButton>
          <PageButton label="Next page" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRightIcon />
          </PageButton>
          <PageButton
            label="Last page"
            className="max-md:hidden"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRightIcon />
          </PageButton>
        </div>
      </div>
    </div>
  )
}

function PageButton({ label, className, ...props }: React.ComponentProps<typeof Button> & { label: string }) {
  return <Button variant="outline" size="icon" className={cn("size-8 cursor-pointer", className)} aria-label={label} {...props} />
}
