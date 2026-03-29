import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import { getKnowledgeSources } from "@/lib/queries/knowledge";
import { KnowledgeSourceTable } from "./knowledge-source-table";
import { AddSourceDialog } from "./add-source-dialog";

export default async function KnowledgePage() {
  const { internalOrgId } = await getAuthOrRedirect();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Manage the documents and content your AI agent uses to answer
            questions.
          </p>
        </div>
        <AddSourceDialog />
      </div>

      {/* Source list */}
      <Suspense fallback={<KnowledgeTableSkeleton />}>
        <KnowledgeSourceList orgId={internalOrgId} />
      </Suspense>
    </div>
  );
}

// ---- Async Server Component for Suspense streaming -------------------------

async function KnowledgeSourceList({ orgId }: { orgId: string }) {
  const sources = await getKnowledgeSources(orgId);
  return <KnowledgeSourceTable sources={sources} />;
}

// ---- Skeleton ---------------------------------------------------------------

function KnowledgeTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_100px_80px_80px_120px_48px] gap-4 border-b border-border px-6 py-3">
        <div className="h-3 w-12 rounded bg-muted" />
        <div className="h-3 w-10 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
        <div className="h-3 w-14 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
        <div />
      </div>
      {/* Data rows */}
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
  );
}
