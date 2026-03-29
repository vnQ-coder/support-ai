interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-blue-500/10 text-blue-400",
  },
  escalated: {
    label: "Escalated",
    className: "bg-red-500/10 text-red-400",
  },
  waiting: {
    label: "Waiting",
    className: "bg-amber-500/10 text-amber-400",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/10 text-emerald-400",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
