import type { ReactNode, ComponentType } from "react";
import { cn } from "../utils";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
}

function TableSkeleton({
  columns,
  rows,
}: {
  columns: number;
  rows: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingRows = 5,
  emptyIcon: EmptyIcon,
  emptyTitle = "No data",
  emptyDescription,
  emptyAction,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const isEmpty = !loading && data.length === 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-muted-foreground",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeleton
                columns={columns.length}
                rows={loadingRows}
              />
            )}
            {!loading &&
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    onRowClick &&
                      "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row, rowIndex)
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3", col.className)}
                    >
                      {col.render(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {EmptyIcon && (
            <div className="mb-4 rounded-full bg-muted p-3">
              <EmptyIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <p className="text-sm font-medium">{emptyTitle}</p>
          {emptyDescription && (
            <p className="mt-1 text-xs text-muted-foreground">
              {emptyDescription}
            </p>
          )}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      )}
    </div>
  );
}

export type { Column, DataTableProps };
