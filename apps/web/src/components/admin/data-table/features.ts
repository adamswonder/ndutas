import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type RowData,
} from "@tanstack/react-table"
import type { ReactTable } from "@tanstack/react-table"

// TanStack Table v9: the back office tables register only what they use (anything else is
// tree-shaken). Shared so every table has the same search, sorting, selection and paging.
export const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

export type Features = typeof features
export type AdminTable<TData extends RowData> = ReactTable<Features, TData>
