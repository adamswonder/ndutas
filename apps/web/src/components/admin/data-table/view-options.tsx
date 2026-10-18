"use client"

import type { RowData } from "@tanstack/react-table"
import { ChevronDownIcon, Columns3Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminTable } from "./features"

// "Columns": show or hide the columns that can be hidden. Labels come from meta.label.
export function ViewOptions<TData extends RowData>({ table }: { table: AdminTable<TData> }) {
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide())
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 cursor-pointer">
          <Columns3Icon data-icon="inline-start" />
          <span className="max-lg:hidden">Columns</span>
          <ChevronDownIcon data-icon="inline-end" className="max-lg:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
            onSelect={(event) => event.preventDefault()}
            className="cursor-pointer"
          >
            {(column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
