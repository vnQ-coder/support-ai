"use client";

import type { KnowledgeGapItem } from "@/lib/queries/analytics";
import { formatRelativeTime } from "@/lib/dashboard-utils";

interface KnowledgeGapsTableProps {
  data: KnowledgeGapItem[];
}

export function KnowledgeGapsTable({ data }: KnowledgeGapsTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No knowledge gaps detected -- your AI is covering all topics well
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Knowledge Gaps
        </h3>
        <span className="text-xs text-muted-foreground">
          Questions where AI confidence was below 50%
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-muted-foreground">
                Query
              </th>
              <th className="pb-3 text-left font-medium text-muted-foreground">
                Occurrences
              </th>
              <th className="pb-3 text-left font-medium text-muted-foreground">
                Avg Confidence
              </th>
              <th className="pb-3 text-left font-medium text-muted-foreground">
                Last Asked
              </th>
              <th className="pb-3 text-left font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((gap, index) => (
              <tr
                key={index}
                className="border-b border-border/50 last:border-0"
              >
                <td className="max-w-xs truncate py-3 font-medium text-foreground">
                  {gap.query}
                </td>
                <td className="py-3 text-foreground">{gap.occurrences}</td>
                <td className="py-3">
                  <span
                    className={
                      gap.avgConfidence < 0.3
                        ? "text-red-500"
                        : gap.avgConfidence < 0.4
                          ? "text-amber-500"
                          : "text-foreground"
                    }
                  >
                    {Math.round(gap.avgConfidence * 100)}%
                  </span>
                </td>
                <td className="py-3 text-muted-foreground">
                  {formatRelativeTime(new Date(gap.lastAsked))}
                </td>
                <td className="py-3">
                  <a
                    href="/knowledge"
                    className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    Add to KB
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
