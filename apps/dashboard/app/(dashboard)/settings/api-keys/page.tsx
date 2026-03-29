import { getAuthOrRedirect } from "@/lib/auth";
import { getApiKeys } from "@/lib/queries/settings";
import { ApiKeysManager } from "@/components/settings/api-keys-manager";

export default async function ApiKeysPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const keys = await getApiKeys(internalOrgId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          Manage API keys for integrating SupportAI into your application
        </p>
      </div>
      <ApiKeysManager keys={keys} />
    </div>
  );
}
