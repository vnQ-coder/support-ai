import { ChartSkeleton } from "@/components/overview/chart-skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-4 w-64 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Trends chart skeleton */}
      <ChartSkeleton />

      {/* Two-column charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Two-column charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Heatmap skeleton */}
      <ChartSkeleton />

      {/* Table skeletons */}
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

      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-muted mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
