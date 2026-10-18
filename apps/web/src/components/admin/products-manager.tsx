"use client"

import * as React from "react"
import {
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table"
import {
  ArchiveIcon,
  CircleCheckIcon,
  CircleOffIcon,
  DownloadIcon,
  FilterIcon,
  PackageIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react"
import type { AdminProduct, MealCategory } from "@ndutas/core"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SpinnerCustom } from "@/components/spinner-custom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/use-media-query"
import { menuCategories } from "@/lib/categories"
import { useAuthStore } from "./auth-store"
import { downloadCsv } from "./data-table/csv"
import { DataTable } from "./data-table/data-table"
import { features } from "./data-table/features"
import { Pagination } from "./data-table/pagination"
import { TableSearch } from "./data-table/search"
import { ViewOptions } from "./data-table/view-options"
import { ProductDrawer } from "./product-drawer"
import { productColumns, productStatus } from "./products-columns"
import { useProductsStore } from "./products-store"

type CategoryFilter = MealCategory | "all"

const categoryRank = Object.fromEntries(menuCategories.map((c, i) => [c.id, i])) as Record<MealCategory, number>
const hiddenOnPhones: ColumnVisibilityState = { category: false, status: false }

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater
}

export function ProductsManager() {
  const byId = useProductsStore((state) => state.byId)
  const loaded = useProductsStore((state) => state.loaded)
  const error = useProductsStore((state) => state.error)
  const isOwner = useAuthStore((state) => state.staff?.role === "owner")
  const isPhone = useMediaQuery("(max-width: 767px)")

  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState<CategoryFilter>("all")
  const [showArchived, setShowArchived] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [chosenColumns, setChosenColumns] = React.useState<ColumnVisibilityState>({})
  const [sheet, setSheet] = React.useState<{ open: boolean; product: AdminProduct | null }>({
    open: false,
    product: null,
  })
  const [bulkBusy, setBulkBusy] = React.useState(false)

  React.useEffect(() => {
    void useProductsStore.getState().load()
  }, [])

  const all = React.useMemo(() => Object.values(byId), [byId])
  const archivedCount = all.filter((p) => p.archivedAt).length

  // Menu order: by category, then the owner's chosen order within it.
  const data = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    return all
      .filter((p) => (showArchived ? !!p.archivedAt : !p.archivedAt))
      .filter((p) => category === "all" || p.category === category)
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
      .sort((a, b) => categoryRank[a.category] - categoryRank[b.category] || a.sortOrder - b.sortOrder)
  }, [all, search, category, showArchived])

  // Dragging only makes sense on one category's live menu, in menu order.
  const dragHint = !isOwner
    ? undefined
    : showArchived
      ? "Archived products aren't on the menu"
      : category === "all"
        ? "Pick a category in Filter to reorder it"
        : search
          ? "Clear the search to reorder"
          : sorting.length
            ? "Clear the column sort to reorder"
            : undefined
  const canDrag = isOwner && !dragHint

  const columns = React.useMemo(
    () => productColumns({ isOwner, dragHint, onEdit: (product) => setSheet({ open: true, product }) }),
    [isOwner, dragHint]
  )
  const columnVisibility = React.useMemo(
    () => ({ ...(isPhone ? hiddenOnPhones : {}), ...chosenColumns, drag: isOwner, actions: isOwner }),
    [isPhone, chosenColumns, isOwner]
  )

  // Live updates (new orders, confirmations) change the data; keep the owner on their page,
  // but never past the last one.
  const lastPage = Math.max(Math.ceil(data.length / pagination.pageSize) - 1, 0)
  const page = { ...pagination, pageIndex: Math.min(pagination.pageIndex, lastPage) }

  const table = useTable({
    features,
    data,
    columns,
    state: { sorting, rowSelection, pagination: page, columnVisibility },
    autoResetPageIndex: false,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: (updater) => setChosenColumns(resolve(updater, columnVisibility)),
  })

  function resetPaging() {
    setRowSelection({})
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  // The drop only reorders the visible page; splice it back into the whole category.
  async function onReorder(pageIds: string[]) {
    if (category === "all") return
    const full = data.map((p) => p.id)
    const start = full.indexOf(table.getRowModel().rows[0]?.id ?? "")
    if (start < 0) return
    full.splice(start, pageIds.length, ...pageIds)
    try {
      await useProductsStore.getState().reorder(category, full)
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Couldn't save the new order.")
    }
  }

  const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.id)

  async function bulk(action: "off" | "on" | "archive") {
    setBulkBusy(true)
    const store = useProductsStore.getState()
    const failed =
      action === "archive"
        ? await store.archiveMany(selectedIds)
        : await store.setManyAvailable(selectedIds, action === "on")
    setBulkBusy(false)
    const done = selectedIds.length - failed
    const verb = action === "archive" ? "archived" : action === "on" ? "back on the menu" : "marked sold out"
    if (done) toast.success(`${done} ${done === 1 ? "product" : "products"} ${verb}`)
    if (failed) toast.error(`${failed} couldn't be updated. Please try again.`)
    setRowSelection({})
  }

  function exportCsv() {
    const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
    downloadCsv(
      `ndutas-products-${new Date().toISOString().slice(0, 10)}.csv`,
      (selected.length ? selected : data).map((p) => ({
        Product: p.name,
        Description: p.description,
        Category: menuCategories.find((c) => c.id === p.category)?.label ?? p.category,
        Status: productStatus(p).label,
        "Price (KES)": p.price,
        Photo: p.image,
      }))
    )
  }

  const filtered = category !== "all" || showArchived

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">Products</h1>
          <p className="mt-1 text-muted-foreground">
            {isOwner
              ? "Edit the menu, switch items off when they sell out, and drag to set the menu order."
              : "Switch items off when they sell out."}
          </p>
        </div>
        {isOwner && (
          <Button className="cursor-pointer rounded-full" onClick={() => setSheet({ open: true, product: null })}>
            <PlusIcon data-icon="inline-start" />
            Add product
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TableSearch
          value={search}
          onChange={(value) => {
            setSearch(value)
            resetPaging()
          }}
          placeholder="Search products"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer">
              <FilterIcon data-icon="inline-start" />
              Filter
              {filtered && <Badge className="ml-1 size-2 rounded-full p-0" aria-label="Filter on" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={category}
              onValueChange={(value) => {
                setCategory(value as CategoryFilter)
                resetPaging()
              }}
            >
              <DropdownMenuRadioItem value="all" className="cursor-pointer">
                All categories
              </DropdownMenuRadioItem>
              {menuCategories.map((c) => (
                <DropdownMenuRadioItem key={c.id} value={c.id} className="cursor-pointer">
                  {c.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showArchived}
              onCheckedChange={(value) => {
                setShowArchived(!!value)
                resetPaging()
              }}
              className="cursor-pointer"
            >
              Show archived ({archivedCount})
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ViewOptions table={table} />
        <Button
          variant="outline"
          size="sm"
          className="h-9 cursor-pointer"
          onClick={exportCsv}
          disabled={data.length === 0}
        >
          <DownloadIcon data-icon="inline-start" />
          <span className="max-sm:sr-only">{selectedIds.length ? `Export ${selectedIds.length}` : "Export"}</span>
        </Button>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 cursor-pointer text-muted-foreground"
            onClick={() => {
              setCategory("all")
              setShowArchived(false)
              resetPaging()
            }}
          >
            <XIcon data-icon="inline-start" />
            Clear filter
          </Button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selectedIds.length} selected</span>
          {!showArchived && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                disabled={bulkBusy}
                onClick={() => void bulk("off")}
              >
                <CircleOffIcon data-icon="inline-start" />
                Mark sold out
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                disabled={bulkBusy}
                onClick={() => void bulk("on")}
              >
                <CircleCheckIcon data-icon="inline-start" />
                Mark available
              </Button>
              {isOwner && (
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={bulkBusy}>
                      <ArchiveIcon data-icon="inline-start" />
                      Archive
                    </Button>
                  }
                  title={`Archive ${selectedIds.length} ${selectedIds.length === 1 ? "product" : "products"}?`}
                  description="They come off the menu. Past orders keep them, and you can restore them later."
                  confirmLabel="Archive"
                  icon={<ArchiveIcon />}
                  onConfirm={() => void bulk("archive")}
                />
              )}
            </>
          )}
          {bulkBusy && <SpinnerCustom className="text-primary" />}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto cursor-pointer"
            onClick={() => setRowSelection({})}
          >
            Clear selection
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer rounded-full"
            onClick={() => void useProductsStore.getState().load()}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
        </div>
      )}

      {!loaded ? (
        <div className="flex justify-center py-20">
          <SpinnerCustom className="size-6 text-primary" />
        </div>
      ) : (
        <>
          <DataTable
            table={table}
            empty={
              <span className="flex flex-col items-center gap-2">
                <PackageIcon className="size-7 text-primary" strokeWidth={1.5} />
                {search ? "No products match your search." : showArchived ? "Nothing archived." : "No products yet."}
              </span>
            }
            rowProps={(row) => ({ className: row.original.archivedAt ? "opacity-70" : undefined })}
            sortable={{ enabled: canDrag, onReorder: (ids) => void onReorder(ids) }}
          />
          <Pagination table={table} />
        </>
      )}

      <ProductDrawer
        open={sheet.open}
        product={sheet.product}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
      />
    </div>
  )
}
