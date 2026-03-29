/**
 * Dashboard utility functions for date range computation and formatting.
 */

export type DateRangePreset = "7d" | "30d" | "90d";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangeWithComparison {
  current: DateRange;
  previous: DateRange;
}

/**
 * Compute current and comparison date ranges from a preset or custom range.
 */
export function computeDateRange(
  range: DateRangePreset | { from: string; to: string }
): DateRangeWithComparison {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (typeof range === "string") {
    const days = parseInt(range);
    const from = new Date(to);
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);

    const previousTo = new Date(from);
    previousTo.setDate(previousTo.getDate() - 1);
    previousTo.setHours(23, 59, 59, 999);

    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - days + 1);
    previousFrom.setHours(0, 0, 0, 0);

    return {
      current: { from, to },
      previous: { from: previousFrom, to: previousTo },
    };
  }

  const from = new Date(range.from);
  from.setHours(0, 0, 0, 0);
  const customTo = new Date(range.to);
  customTo.setHours(23, 59, 59, 999);

  const diffMs = customTo.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - diffMs);

  return {
    current: { from, to: customTo },
    previous: { from: previousFrom, to: previousTo },
  };
}

/**
 * Calculate percentage delta between two values.
 */
export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Format a number with abbreviation for large values.
 */
export function formatMetric(value: number, type: "count" | "percentage" | "hours" | "csat"): string {
  switch (type) {
    case "count":
      if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
      return value.toLocaleString();
    case "percentage":
      return `${Math.round(value)}%`;
    case "hours":
      if (value >= 100) return `${(value / 24).toFixed(1)} days`;
      return `${Math.round(value)}h`;
    case "csat":
      if (value === 0) return "—";
      return value.toFixed(1);
  }
}

/**
 * Format relative time (e.g., "2h ago", "3d ago").
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
