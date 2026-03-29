"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  getSlaStatus,
  formatTimeRemaining,
  type SlaStatus,
} from "@repo/shared";

interface SlaBadgeProps {
  deadline: Date | null;
  completedAt: Date | null;
  breached: boolean;
  label?: string;
}

const STATUS_STYLES: Record<SlaStatus, string> = {
  ok: "bg-green-500/15 text-green-400 border-green-500/25",
  at_risk: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  breached: "bg-red-500/15 text-red-400 border-red-500/25",
  completed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
};

const STATUS_LABELS: Record<SlaStatus, string> = {
  ok: "On track",
  at_risk: "At risk",
  breached: "Breached",
  completed: "Done",
};

export function SlaBadge({ deadline, completedAt, breached, label }: SlaBadgeProps) {
  const [status, setStatus] = useState<SlaStatus>(() =>
    getSlaStatus(deadline, completedAt, breached)
  );
  const [timeText, setTimeText] = useState(() =>
    formatTimeRemaining(deadline)
  );

  useEffect(() => {
    // Update immediately
    setStatus(getSlaStatus(deadline, completedAt, breached));
    setTimeText(formatTimeRemaining(deadline));

    // Don't set up interval if already completed or breached permanently
    if (completedAt || breached) return;
    if (!deadline) return;

    const interval = setInterval(() => {
      setStatus(getSlaStatus(deadline, completedAt, breached));
      setTimeText(formatTimeRemaining(deadline));
    }, 60_000);

    return () => clearInterval(interval);
  }, [deadline, completedAt, breached]);

  const displayLabel = label ? `${label}: ` : "";
  const displayText =
    status === "completed"
      ? "Done"
      : status === "breached"
        ? "Overdue"
        : timeText;

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {displayLabel}
      {STATUS_LABELS[status]}
      {status !== "completed" && status !== "breached" && ` \u00B7 ${displayText}`}
    </Badge>
  );
}
