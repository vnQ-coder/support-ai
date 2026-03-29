export function WidgetLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 p-4">
        {/* Bot message */}
        <div className="flex gap-2">
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
          <div className="h-16 w-48 animate-pulse rounded-xl rounded-tl-sm bg-muted" />
        </div>
        {/* User message */}
        <div className="flex justify-end">
          <div className="h-10 w-36 animate-pulse rounded-xl rounded-tr-sm bg-muted" />
        </div>
        {/* Bot message */}
        <div className="flex gap-2">
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
          <div className="h-24 w-52 animate-pulse rounded-xl rounded-tl-sm bg-muted" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
