import { getAuthOrRedirect } from "@/lib/auth";
import { getOrganization } from "@/lib/queries/settings";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";

export default async function GeneralSettingsPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const org = await getOrganization(internalOrgId);

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">
          Basic organization settings and preferences
        </p>
      </div>
      <GeneralSettingsForm org={org} />
    </div>
  );
}
