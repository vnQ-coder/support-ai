export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-muted mb-4" />
      <div className="h-[300px] rounded-lg bg-muted" />
    </div>
  );
}
