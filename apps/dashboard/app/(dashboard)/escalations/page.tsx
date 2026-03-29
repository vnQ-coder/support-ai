import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import { EscalationQueue } from "@/components/escalations/escalation-queue";
import EscalationsLoading from "./loading";

export const metadata = { title: "Escalations — SupportAI" };
export const dynamic = "force-dynamic";

export default async function EscalationsPage() {
  const { internalOrgId } = await getAuthOrRedirect();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Escalation Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conversations that need immediate human attention — oldest first
        </p>
      </div>
      <Suspense fallback={<EscalationsLoading />}>
        <EscalationQueue orgId={internalOrgId} />
      </Suspense>
    </div>
  );
}
