import { getAuthOrRedirect } from "@/lib/auth";
import { getWorkingHours } from "@/lib/queries/working-hours";
import { WorkingHoursForm } from "@/components/settings/working-hours-form";

export const metadata = { title: "Working Hours — SupportAI" };

export default async function WorkingHoursPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const config = await getWorkingHours(internalOrgId);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Working Hours</h2>
        <p className="text-sm text-muted-foreground">Define when your team is available. Customers get an auto-reply outside these hours.</p>
      </div>
      <WorkingHoursForm defaultValues={config} />
    </div>
  );
}
