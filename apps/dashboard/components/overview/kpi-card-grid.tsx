import type { KPISummary } from "@/lib/queries/dashboard";
import { KPICard } from "./kpi-card";

interface KPICardGridProps {
  data: KPISummary;
}

export function KPICardGrid({ data }: KPICardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICard data={data.totalConversations} />
      <KPICard data={data.aiResolutionRate} />
      <KPICard data={data.avgCsat} />
      <KPICard data={data.timeSaved} />
    </div>
  );
}
