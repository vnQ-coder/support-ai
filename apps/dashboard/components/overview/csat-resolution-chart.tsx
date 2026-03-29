"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CsatResolutionDataPoint } from "@/lib/queries/dashboard";

interface CsatResolutionChartProps {
  data: CsatResolutionDataPoint[];
}

export function CsatResolutionChart({ data }: CsatResolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No data for this period
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        CSAT & Resolution Rate
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            yAxisId="csat"
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "CSAT",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "Resolution %",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <Legend />
          <Line
            yAxisId="csat"
            type="monotone"
            dataKey="avgCsat"
            name="Avg CSAT"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="resolutionRate"
            name="Resolution Rate %"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
