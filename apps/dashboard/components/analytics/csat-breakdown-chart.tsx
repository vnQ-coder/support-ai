"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CsatBreakdownItem } from "@/lib/queries/analytics";

interface CsatBreakdownChartProps {
  data: CsatBreakdownItem[];
}

const SCORE_COLORS: Record<number, string> = {
  5: "hsl(var(--chart-1))",
  4: "hsl(var(--chart-2))",
  3: "hsl(var(--chart-3))",
  2: "hsl(var(--chart-4))",
  1: "hsl(var(--chart-5))",
};

export function CsatBreakdownChart({ data }: CsatBreakdownChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No CSAT data for this period
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    label: `${"★".repeat(item.score)}`,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        CSAT Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={80}
            tick={{ fontSize: 14, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
            formatter={(value: number, _name: string, props: { payload: { percentage: number } }) => [
              `${value} responses (${props.payload.percentage}%)`,
              "Count",
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.score}`}
                fill={SCORE_COLORS[entry.score] ?? "hsl(var(--chart-1))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
