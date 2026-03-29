export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted mt-2" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-10 w-28 rounded bg-muted" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-6 w-11 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
