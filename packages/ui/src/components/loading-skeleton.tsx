import { cn } from "../utils";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

interface LoadingSkeletonProps {
  variant: "card" | "table-row" | "chart";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant,
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "card") {
    return (
      <div className={cn("grid gap-4", className)}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 space-y-3"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // variant === "chart"
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-6"
        >
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
