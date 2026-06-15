"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { SearchInput } from "@/components/shared/SearchInput"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  onSearch?: (query: string) => void
  loading?: boolean
  emptyMessage?: string
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
  columns,
  data,
  searchable = false,
  onSearch,
  loading = false,
  emptyMessage = "No data available.",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        {searchable && (
          <div className="w-full max-w-sm">
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        <TableSkeleton />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        {searchable && (
          <div className="w-full max-w-sm">
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        <EmptyState title="No Data" description={emptyMessage} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchable && onSearch && (
        <div className="w-full max-w-sm">
          <SearchInput
            value=""
            onChange={onSearch}
            placeholder="Search..."
          />
        </div>
      )}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    "border-b last:border-0",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render
                        ? col.render(item)
                        : (item as any)[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
