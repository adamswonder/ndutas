"use client"

import type { CellContext, HeaderContext, RowData } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import type { Features } from "./features"

// The checkbox column: the header selects the whole page, rows select themselves.
export function SelectAllCheckbox<TData extends RowData>({ table }: HeaderContext<Features, TData, unknown>) {
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all on this page"
        className="cursor-pointer"
      />
    </div>
  )
}

export function SelectRowCheckbox<TData extends RowData>({ row }: CellContext<Features, TData, unknown>) {
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="cursor-pointer"
      />
    </div>
  )
}
