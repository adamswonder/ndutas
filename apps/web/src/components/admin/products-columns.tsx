"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon } from "lucide-react"
import type { AdminProduct } from "@ndutas/core"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ProductImage } from "@/components/product-image"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { menuCategories } from "@/lib/categories"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ColumnHeader } from "./data-table/column-header"
import { DragHandle } from "./data-table/data-table"
import type { Features } from "./data-table/features"
import { SelectAllCheckbox, SelectRowCheckbox } from "./data-table/select-column"
import { useProductsStore } from "./products-store"

const column = createColumnHelper<Features, AdminProduct>()

const categoryLabel = Object.fromEntries(menuCategories.map((c) => [c.id, c.label])) as Record<
  AdminProduct["category"],
  string
>

export function productStatus(product: AdminProduct) {
  if (product.archivedAt) return { label: "Archived", text: "text-muted-foreground", dot: "bg-muted-foreground" }
  if (!product.available) return { label: "Sold out", text: "text-destructive", dot: "bg-destructive" }
  return { label: "Available", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" }
}

export function productColumns({
  isOwner,
  dragHint,
  onEdit,
}: {
  isOwner: boolean
  // Why the drag handles are off right now (undefined when dragging works).
  dragHint?: string
  onEdit: (product: AdminProduct) => void
}) {
  return column.columns([
    column.display({
      id: "drag",
      header: () => <span className="sr-only">Reorder</span>,
      cell: ({ row }) => <DragHandle label={row.original.name} disabledHint={dragHint} />,
      enableSorting: false,
      enableHiding: false,
    }),
    column.display({
      id: "select",
      header: SelectAllCheckbox,
      cell: SelectRowCheckbox,
      enableSorting: false,
      enableHiding: false,
    }),
    column.accessor("name", {
      id: "product",
      header: ({ column }) => <ColumnHeader column={column} title="Product" />,
      cell: ({ row }) => {
        const product = row.original
        const off = !product.available || !!product.archivedAt
        return (
          <div className="flex min-w-56 items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              <ProductImage
                src={product.image}
                alt=""
                fill
                sizes="40px"
                className={cn("object-cover", off && "opacity-60 grayscale")}
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium">{product.name}</p>
              <p className="max-w-72 truncate text-xs text-muted-foreground">{product.description}</p>
            </div>
          </div>
        )
      },
      enableHiding: false,
      meta: { label: "Product" },
    }),
    column.accessor("category", {
      header: ({ column }) => <ColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="whitespace-nowrap">{categoryLabel[row.original.category]}</span>,
      meta: { label: "Category" },
    }),
    column.accessor((product) => productStatus(product).label, {
      id: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = productStatus(row.original)
        return (
          <span className={cn("inline-flex items-center gap-1.5 font-medium whitespace-nowrap", status.text)}>
            <span className={cn("size-2 rounded-full", status.dot)} aria-hidden />
            {status.label}
          </span>
        )
      },
      meta: { label: "Status" },
    }),
    column.accessor("price", {
      header: ({ column }) => <ColumnHeader column={column} title="Price" align="right" />,
      cell: ({ row }) => (
        <div className="text-right font-price font-medium whitespace-nowrap tabular-nums">
          {formatPrice(row.original.price)}
        </div>
      ),
      meta: { label: "Price" },
    }),
    column.display({
      id: "available",
      header: "On menu",
      cell: ({ row }) => <AvailableSwitch product={row.original} />,
      meta: { label: "On menu" },
    }),
    column.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (isOwner ? <ProductActions product={row.original} onEdit={onEdit} /> : null),
      enableHiding: false,
    }),
  ])
}

function AvailableSwitch({ product }: { product: AdminProduct }) {
  if (product.archivedAt) return null
  async function toggle(available: boolean) {
    try {
      await useProductsStore.getState().setAvailable(product.id, available)
      toast.success(available ? `${product.name} is back on` : `${product.name} marked sold out`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update it.")
    }
  }
  return (
    <Switch
      checked={product.available}
      onCheckedChange={(checked) => void toggle(checked)}
      aria-label={`${product.name} on the menu`}
      className="cursor-pointer"
    />
  )
}

function ProductActions({ product, onEdit }: { product: AdminProduct; onEdit: (product: AdminProduct) => void }) {
  const archived = !!product.archivedAt

  async function archive() {
    try {
      await useProductsStore.getState().setArchived(product.id, !archived)
      toast.success(archived ? `${product.name} is back on the menu` : `${product.name} archived`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update it.")
    }
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {!archived && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer text-muted-foreground"
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name}`}
          title="Edit"
        >
          <PencilIcon />
        </Button>
      )}
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer text-muted-foreground"
            aria-label={archived ? `Restore ${product.name}` : `Archive ${product.name}`}
            title={archived ? "Restore" : "Archive"}
          >
            {archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
          </Button>
        }
        variant={archived ? "default" : "destructive"}
        icon={archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
        title={archived ? `Restore ${product.name}?` : `Archive ${product.name}?`}
        description={
          archived
            ? "It goes back on the menu."
            : "It comes off the menu. Past orders keep it, and you can restore it later."
        }
        confirmLabel={archived ? "Restore" : "Archive"}
        onConfirm={() => void archive()}
      />
    </div>
  )
}
