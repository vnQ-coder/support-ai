"use client";

import { useState } from "react";
import type { AgentPerformanceRow } from "@/lib/queries/analytics";

interface AgentPerformanceTableProps {
  data: AgentPerformanceRow[];
}

type SortKey = keyof Omit<AgentPerformanceRow, "agentName">;

const COLUMN_HEADERS: { key: SortKey | "agentName"; label: string }[] = [
  { key: "agentName", label: "Agent" },
  { key: "conversationsHandled", label: "Conversations" },
  { key: "avgResponseTime", label: "Avg Response" },
  { key: "avgCsat", label: "Avg CSAT" },
  { key: "resolutionRate", label: "Resolution %" },
];

export function AgentPerformanceTable({ data }: AgentPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("conversationsHandled");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: string) => {
    if (key === "agentName") return;
    const k = key as SortKey;
    if (sortKey === k) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(k);
      setSortAsc(false);
    }
  };

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No agent performance data for this period
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Agent Performance
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {COLUMN_HEADERS.map((col) => (
                <th
                  key={col.key}
                  className={`pb-3 text-left font-medium text-muted-foreground ${
                    col.key !== "agentName" ? "cursor-pointer select-none hover:text-foreground" : ""
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.key !== "agentName" && sortKey === col.key && (
                      <span className="text-xs">{sortAsc ? "\u2191" : "\u2193"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((agent) => (
              <tr
                key={agent.agentName}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-3 font-medium text-foreground">
                  {agent.agentName}
                </td>
                <td className="py-3 text-foreground">
                  {agent.conversationsHandled}
                </td>
                <td className="py-3 text-foreground">
                  {agent.avgResponseTime.toFixed(1)}m
                </td>
                <td className="py-3">
                  <span
                    className={
                      agent.avgCsat >= 4.5
                        ? "text-emerald-500"
                        : agent.avgCsat >= 4.0
                          ? "text-foreground"
                          : "text-amber-500"
                    }
                  >
                    {agent.avgCsat.toFixed(1)}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-chart-1"
                        style={{
                          width: `${agent.resolutionRate}%`,
                          backgroundColor: "hsl(var(--chart-1))",
                        }}
                      />
                    </div>
                    <span className="text-foreground">
                      {agent.resolutionRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
