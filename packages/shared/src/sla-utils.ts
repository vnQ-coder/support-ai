export type SlaStatus = "ok" | "at_risk" | "breached" | "completed";

/**
 * Determine the current SLA status based on deadline, completion time, and breach flag.
 */
export function getSlaStatus(
  deadline: Date | null,
  completedAt: Date | null,
  breached: boolean
): SlaStatus {
  if (breached) return "breached";
  if (completedAt) return "completed";
  if (!deadline) return "ok";

  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();

  if (msRemaining <= 0) return "breached";

  // At risk = less than 15 minutes remaining
  if (msRemaining < 15 * 60 * 1000) return "at_risk";

  return "ok";
}

/**
 * Format the time remaining until a deadline as a human-readable string.
 */
export function formatTimeRemaining(deadline: Date | null): string {
  if (!deadline) return "\u2014";

  const now = new Date();
  const ms = deadline.getTime() - now.getTime();

  if (ms <= 0) return "Overdue";

  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;

  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/**
 * Format a duration in minutes as a human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
