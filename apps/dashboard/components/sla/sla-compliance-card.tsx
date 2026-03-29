import { getSlaComplianceStats } from "@/lib/queries/sla";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface SlaComplianceCardProps {
  orgId: string;
}

function complianceColor(pct: number): string {
  if (pct >= 95) return "text-green-400";
  if (pct >= 80) return "text-amber-400";
  return "text-red-400";
}

function progressBarColor(pct: number): string {
  if (pct >= 95) return "bg-green-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

export async function SlaComplianceCard({ orgId }: SlaComplianceCardProps) {
  const stats = await getSlaComplianceStats(orgId);

  if (stats.totalWithSla === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No SLA data yet. Create an SLA policy in Settings to start tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstResponsePct =
    stats.totalWithSla > 0
      ? Math.round((stats.firstResponseCompliant / stats.totalWithSla) * 100)
      : 0;

  const resolutionPct =
    stats.totalWithSla > 0
      ? Math.round((stats.resolutionCompliant / stats.totalWithSla) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First Response */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">First Response</span>
            <span className={`font-semibold ${complianceColor(firstResponsePct)}`}>
              {firstResponsePct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-2 rounded-full transition-all ${progressBarColor(firstResponsePct)}`}
              style={{ width: `${Math.min(firstResponsePct, 100)}%` }}
            />
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Resolution</span>
            <span className={`font-semibold ${complianceColor(resolutionPct)}`}>
              {resolutionPct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-2 rounded-full transition-all ${progressBarColor(resolutionPct)}`}
              style={{ width: `${Math.min(resolutionPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Breached count */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Total Breached</span>
          <span className={`font-semibold ${stats.breached > 0 ? "text-red-400" : "text-muted-foreground"}`}>
            {stats.breached}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
