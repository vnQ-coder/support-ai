import { cn } from "../utils";

type ConversationStatus = "open" | "active" | "waiting" | "escalated" | "resolved" | "pending";

interface StatusBadgeProps {
  status: ConversationStatus | (string & {});
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  active: {
    label: "Active",
    className: "bg-blue-500/10 text-blue-400",
  },
  waiting: {
    label: "Waiting",
    className: "bg-amber-500/10 text-amber-400",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400",
  },
  escalated: {
    label: "Escalated",
    className: "bg-red-500/10 text-red-400",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/10 text-emerald-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export type { ConversationStatus };
