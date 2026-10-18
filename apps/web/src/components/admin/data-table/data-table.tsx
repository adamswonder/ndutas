"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FlexRender, type Row, type RowData } from "@tanstack/react-table"
import { GripVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { AdminTable, Features } from "./features"

type RowProps = Omit<React.ComponentProps<typeof TableRow>, "children">

// Drag-to-reorder. `enabled` false (searching, sorted by a column, mixed categories...)
// renders plain rows and disabled handles.
export type SortableRows = {
  enabled: boolean
  onReorder: (ids: string[]) => void
  disabledHint?: string
}

export function DataTable<TData extends RowData>({
  table,
  empty,
  rowProps,
  sortable,
}: {
  table: AdminTable<TData>
  empty: React.ReactNode
  rowProps?: (row: Row<Features, TData>) => RowProps
  sortable?: SortableRows
}) {
  const rows = table.getRowModel().rows
  const columnCount = table.getVisibleLeafColumns().length

  const body = rows.length ? (
    rows.map((row) =>
      sortable?.enabled ? (
        <DraggableRow key={row.id} row={row} rowProps={rowProps?.(row)} />
      ) : (
        <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined} {...rowProps?.(row)}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              <FlexRender cell={cell} />
            </TableCell>
          ))}
        </TableRow>
      )
    )
  ) : (
    <TableRow>
      <TableCell colSpan={columnCount} className="h-32 text-center text-muted-foreground">
        {empty}
      </TableCell>
    </TableRow>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* On phones the table scrolls sideways inside this border, never the page. */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className="text-xs font-semibold tracking-wide uppercase">
                    {header.isPlaceholder ? null : <FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {sortable?.enabled && rows.length ? (
            <SortableBody rows={rows} onReorder={sortable.onReorder}>
              {body}
            </SortableBody>
          ) : (
            <TableBody>{body}</TableBody>
          )}
        </Table>
      </div>
    </div>
  )
}

function SortableBody<TData extends RowData>({
  rows,
  onReorder,
  children,
}: {
  rows: Row<Features, TData>[]
  onReorder: (ids: string[]) => void
  children: React.ReactNode
}) {
  const id = React.useId()
  const ids = rows.map((row) => row.id)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, {})
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <TableBody>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </TableBody>
    </DndContext>
  )
}

// The drag handle reads its listeners from the row it sits in.
type Handle = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">
const HandleContext = React.createContext<Handle | null>(null)

function DraggableRow<TData extends RowData>({ row, rowProps }: { row: Row<Features, TData>; rowProps?: RowProps }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id })
  const handle = React.useMemo(() => ({ attributes, listeners }), [attributes, listeners])
  return (
    <HandleContext.Provider value={handle}>
      <TableRow
        ref={setNodeRef}
        data-state={row.getIsSelected() ? "selected" : undefined}
        data-dragging={isDragging}
        {...rowProps}
        className={cn(
          "relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:bg-card data-[dragging=true]:opacity-90 data-[dragging=true]:shadow-lg",
          rowProps?.className
        )}
        style={{ transform: CSS.Transform.toString(transform), transition }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            <FlexRender cell={cell} />
          </TableCell>
        ))}
      </TableRow>
    </HandleContext.Provider>
  )
}

export function DragHandle({ label, disabledHint }: { label: string; disabledHint?: string }) {
  const handle = React.useContext(HandleContext)
  if (!handle) {
    return (
      <Button variant="ghost" size="icon-sm" disabled title={disabledHint} aria-label={disabledHint ?? "Reordering is off"}>
        <GripVerticalIcon className="text-muted-foreground/40" />
      </Button>
    )
  }
  return (
    <Button
      {...handle.attributes}
      {...handle.listeners}
      variant="ghost"
      size="icon-sm"
      className="cursor-grab touch-none text-muted-foreground hover:bg-transparent active:cursor-grabbing"
      aria-label={`Drag to reorder ${label}`}
    >
      <GripVerticalIcon />
    </Button>
  )
}
