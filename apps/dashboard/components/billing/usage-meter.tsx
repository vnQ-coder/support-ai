import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS, type Plan } from "@/lib/queries/usage";

interface UsageMetrics {
  conversations: number;
  teamMembers: number;
  knowledgeSources: number;
}

interface UsageMeterProps {
  usage: UsageMetrics;
  plan: string;
}

function ProgressBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1) {
    return (
      <span className="text-sm text-muted-foreground">Unlimited</span>
    );
  }
  const pct = Math.min((used / limit) * 100, 100);
  const color =
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
        {used.toLocaleString()} / {limit.toLocaleString()}
      </span>
    </div>
  );
}

export function UsageMeter({ usage, plan }: UsageMeterProps) {
  const limits = PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.starter;

  const isNearLimit =
    (limits.conversations !== -1 && usage.conversations / limits.conversations > 0.9) ||
    (limits.teamMembers !== -1 && usage.teamMembers / limits.teamMembers > 0.9) ||
    (limits.knowledgeSources !== -1 && usage.knowledgeSources / limits.knowledgeSources > 0.9);

  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetStr = resetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const rows = [
    { label: "AI Conversations", used: usage.conversations, limit: limits.conversations },
    { label: "Team Members",     used: usage.teamMembers,   limit: limits.teamMembers },
    { label: "Knowledge Sources", used: usage.knowledgeSources, limit: limits.knowledgeSources },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage This Month</CardTitle>
        <CardDescription>Resets on {resetStr}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isNearLimit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You&apos;re nearing your plan limit.</span>
              <Button asChild size="sm" variant="outline" className="ml-4 h-7">
                <Link href="/pricing">Upgrade</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          {rows.map(({ label, used, limit }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm font-medium w-40 shrink-0">{label}</span>
              <ProgressBar used={used} limit={limit} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
