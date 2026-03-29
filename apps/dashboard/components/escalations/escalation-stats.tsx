import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, UserX } from "lucide-react";

interface EscalationStatsProps {
  total: number;
  unassigned: number;
  avgWaitMinutes: number;
}

function formatWait(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function EscalationStats({ total, unassigned, avgWaitMinutes }: EscalationStatsProps) {
  const stats = [
    {
      label: "Waiting",
      value: total,
      icon: AlertTriangle,
      color: total > 0 ? "text-amber-500" : "text-muted-foreground",
      bg: total > 0 ? "bg-amber-500/10" : "bg-muted",
    },
    {
      label: "Unassigned",
      value: unassigned,
      icon: UserX,
      color: unassigned > 0 ? "text-red-500" : "text-muted-foreground",
      bg: unassigned > 0 ? "bg-red-500/10" : "bg-muted",
    },
    {
      label: "Avg Wait",
      value: formatWait(avgWaitMinutes),
      icon: Clock,
      color: avgWaitMinutes > 60 ? "text-amber-500" : "text-muted-foreground",
      bg: avgWaitMinutes > 60 ? "bg-amber-500/10" : "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
