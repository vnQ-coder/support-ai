import { Suspense } from "react";
import { getEscalatedConversations, getEscalationStats } from "@/lib/queries/escalations";
import { EscalationCard } from "./escalation-card";
import { EscalationStats } from "./escalation-stats";
import { EmptyEscalationState } from "./empty-escalation-state";
import { EscalationsPoller } from "./escalations-poller";

interface EscalationQueueProps {
  orgId: string;
}

export async function EscalationQueue({ orgId }: EscalationQueueProps) {
  const [escalated, stats] = await Promise.all([
    getEscalatedConversations(orgId),
    getEscalationStats(orgId),
  ]);

  if (escalated.length === 0) {
    return <EmptyEscalationState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EscalationStats {...stats} />
        <EscalationsPoller />
      </div>
      <div className="space-y-3">
        {escalated.map((conv) => (
          <EscalationCard key={conv.id} conversation={conv} />
        ))}
      </div>
    </div>
  );
}
