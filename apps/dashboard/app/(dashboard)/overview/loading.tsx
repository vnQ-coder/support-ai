import { ChartSkeleton } from "@/components/overview/chart-skeleton";

export default function OverviewLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-56 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* KPI card skeletons */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 animate-pulse"
          >
            <div className="h-4 w-28 rounded bg-muted mb-3" />
            <div className="h-8 w-20 rounded bg-muted mb-2" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-muted mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
