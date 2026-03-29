export default function KnowledgeLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
        <div className="grid grid-cols-[1fr_100px_80px_80px_120px_48px] gap-4 border-b border-border px-6 py-3">
          <div className="h-3 w-12 rounded bg-muted" />
          <div className="h-3 w-10 rounded bg-muted" />
          <div className="h-3 w-12 rounded bg-muted" />
          <div className="h-3 w-14 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
          <div />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_100px_80px_80px_120px_48px] gap-4 items-center border-b border-border px-6 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted" />
              <div className="h-4 w-40 rounded bg-muted" />
            </div>
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-5 w-14 rounded-full bg-muted" />
            <div className="h-4 w-8 rounded bg-muted ml-auto" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
