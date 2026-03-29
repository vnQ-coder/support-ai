"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatMetric } from "@/lib/dashboard-utils";
import type { KPIData } from "@/lib/queries/dashboard";

interface KPICardProps {
  data: KPIData;
}

export function KPICard({ data }: KPICardProps) {
  const { label, value, delta, format } = data;
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold tracking-tight">
          {formatMetric(value, format)}
        </p>
        {!isNeutral ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            <Minus className="h-3 w-3" />
            0%
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">vs. previous period</p>
    </div>
  );
}
