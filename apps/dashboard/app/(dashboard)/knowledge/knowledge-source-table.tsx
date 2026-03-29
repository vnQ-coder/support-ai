"use client";

import { useState } from "react";
import {
  FileText,
  Globe,
  Type,
  Trash2,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { deleteKnowledgeSourceAction } from "@/app/actions/knowledge";
import type { KnowledgeSourceRow } from "@/lib/queries/knowledge";

interface KnowledgeSourceTableProps {
  sources: KnowledgeSourceRow[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  file: FileText,
  url: Globe,
  text: Type,
};

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-emerald-500/10 text-emerald-400",
  processing: "bg-amber-500/10 text-amber-400",
  error: "bg-red-500/10 text-red-400",
  pending: "bg-muted text-muted-foreground",
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export function KnowledgeSourceTable({ sources }: KnowledgeSourceTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(sourceId: string) {
    setDeletingId(sourceId);
    try {
      await deleteKnowledgeSourceAction(sourceId);
    } catch (err) {
      console.error("Failed to delete source:", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-1">No knowledge sources yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add documentation, FAQs, or help articles to train your AI agent.
          It will use this content to answer customer questions accurately.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_80px_80px_120px_48px] gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <div>Name</div>
        <div>Type</div>
        <div>Status</div>
        <div className="text-right">Chunks</div>
        <div>Last Synced</div>
        <div />
      </div>

      {/* Table rows */}
      {sources.map((source) => {
        const Icon = TYPE_ICONS[source.type] ?? FileText;
        const statusClass = STATUS_STYLES[source.status] ?? STATUS_STYLES.pending;
        const isDeleting = deletingId === source.id;

        return (
          <div
            key={source.id}
            className={`grid grid-cols-[1fr_100px_80px_80px_120px_48px] gap-4 items-center border-b border-border px-6 py-4 last:border-b-0 transition-opacity ${
              isDeleting ? "opacity-50" : ""
            }`}
          >
            {/* Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{source.name}</p>
                {source.sourceUrl && (
                  <p className="text-xs text-muted-foreground truncate">
                    {source.sourceUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Type */}
            <div className="text-sm text-muted-foreground capitalize">
              {source.type}
            </div>

            {/* Status */}
            <div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
              >
                {source.status === "processing" && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                )}
                {source.status}
              </span>
            </div>

            {/* Chunk count */}
            <div className="text-sm text-muted-foreground text-right tabular-nums">
              {source.chunkCount}
            </div>

            {/* Last synced */}
            <div className="text-sm text-muted-foreground">
              {source.lastSyncedAt
                ? formatRelativeTime(source.lastSyncedAt)
                : "--"}
            </div>

            {/* Delete */}
            <div>
              <button
                onClick={() => handleDelete(source.id)}
                disabled={isDeleting}
                className="rounded-lg p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                title="Delete source"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
