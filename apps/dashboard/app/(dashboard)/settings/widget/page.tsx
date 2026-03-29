import { getAuthOrRedirect } from "@/lib/auth";
import { getWidgetConfig } from "@/lib/queries/settings";
import { WidgetSettingsForm } from "@/components/settings/widget-settings-form";
import { EmbedSnippet } from "@/components/settings/embed-snippet";
import { db, organizations, eq } from "@repo/db";

export default async function WidgetSettingsPage() {
  const { internalOrgId } = await getAuthOrRedirect();

  const [config, org] = await Promise.all([
    getWidgetConfig(internalOrgId),
    db.query.organizations.findFirst({
      where: eq(organizations.id, internalOrgId),
      columns: { clerkOrgId: true },
    }),
  ]);

  const defaults = config ?? {
    primaryColor: "#3B82F6",
    greeting: "Hi! How can we help you today?",
    placeholder: "Type a message...",
    position: "bottom-right" as const,
    showBranding: true,
    allowedDomains: [] as string[],
  };

  return (
    <div className="space-y-6">
      <EmbedSnippet
        orgId={org?.clerkOrgId ?? internalOrgId}
        widgetUrl={process.env.NEXT_PUBLIC_WIDGET_URL ?? "http://localhost:3001"}
      />

      <div className="border-t border-border" />

      <div>
        <h2 className="text-lg font-semibold">Widget Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the chat widget looks on your website
        </p>
      </div>
      <WidgetSettingsForm config={defaults} />
    </div>
  );
}
