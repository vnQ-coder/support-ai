import { getAuthOrRedirect } from "@/lib/auth";
import { getCannedResponses } from "@/lib/queries/canned-responses";
import { CreateCannedResponseDialog } from "./create-dialog";
import { CannedResponseRow } from "./canned-response-row";

export const metadata = { title: "Saved Replies — SupportAI" };

export default async function CannedResponsesPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const items = await getCannedResponses(internalOrgId);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Saved Replies</h2>
          <p className="text-sm text-muted-foreground">Pre-written responses agents can insert with a shortcut</p>
        </div>
        <CreateCannedResponseDialog />
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">No saved replies yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create one and agents can insert it by typing /shortcut in the reply composer</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {items.map(item => <CannedResponseRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
