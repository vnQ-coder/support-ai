import { getAuthOrRedirect } from "@/lib/auth";
import { getSlaPolicies } from "@/lib/queries/sla";
import { CreateSlaDialog } from "./create-dialog";
import { SlaPolicyRow } from "./sla-policy-row";

export const metadata = { title: "SLA Policies \u2014 SupportAI" };

export default async function SlaSettingsPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const policies = await getSlaPolicies(internalOrgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">SLA Policies</h2>
          <p className="text-sm text-muted-foreground">
            Define response and resolution time targets for conversations
          </p>
        </div>
        <CreateSlaDialog />
      </div>

      {policies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No SLA policies yet. Create one to start tracking response times.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {policies.map((policy) => (
            <SlaPolicyRow key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}
