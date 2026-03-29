import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import {
  getConversationFunnel,
  getAIPerformance,
  getChannelDistribution,
  getResponseTimeDistribution,
  getAgentPerformance,
  getCsatBreakdown,
  getKnowledgeGaps,
  getHourlyVolume,
  getTrends,
} from "@/lib/queries/analytics";
import { computeDateRange, type DateRangePreset } from "@/lib/dashboard-utils";
import type { DateRange } from "@/lib/dashboard-utils";
import { DateRangeSelector } from "@/components/overview/date-range-selector";
import { ConversationFunnelChart } from "@/components/analytics/conversation-funnel";
import { TrendsChart } from "@/components/analytics/trends-chart";
import { ChannelDistributionChart } from "@/components/analytics/channel-distribution-chart";
import { ResponseTimeChart } from "@/components/analytics/response-time-chart";
import { CsatBreakdownChart } from "@/components/analytics/csat-breakdown-chart";
import { AgentPerformanceTable } from "@/components/analytics/agent-performance-table";
import { KnowledgeGapsTable } from "@/components/analytics/knowledge-gaps-table";
import { VolumeHeatmap } from "@/components/analytics/volume-heatmap";
import { ChartSkeleton } from "@/components/overview/chart-skeleton";
import { ExportButton } from "@/components/export-button";

const VALID_PRESETS = new Set<string>(["7d", "30d", "90d"]);

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { internalOrgId } = await getAuthOrRedirect();

  const params = await searchParams;

  const rangePreset: DateRangePreset = VALID_PRESETS.has(params.range ?? "")
    ? (params.range as DateRangePreset)
    : "30d";

  const dateRange = computeDateRange(rangePreset);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Deep dive into your support performance and AI effectiveness
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportButton
            endpoint="/api/export/analytics"
            filename={`analytics-export`}
            label="Export CSV"
            params={{
              from: dateRange.current.from.toISOString(),
              to: dateRange.current.to.toISOString(),
            }}
          />
          <Suspense fallback={null}>
            <DateRangeSelector />
          </Suspense>
        </div>
      </div>

      {/* Trends — full width */}
      <Suspense fallback={<ChartSkeleton />}>
        <TrendsSection range={dateRange.current} orgId={internalOrgId} />
      </Suspense>

      {/* Conversation Funnel + Channel Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <FunnelSection range={dateRange.current} orgId={internalOrgId} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChannelSection range={dateRange.current} orgId={internalOrgId} />
        </Suspense>
      </div>

      {/* Response Time + CSAT Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <ResponseTimeSection range={dateRange.current} orgId={internalOrgId} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <CsatSection range={dateRange.current} orgId={internalOrgId} />
        </Suspense>
      </div>

      {/* Volume Heatmap — full width */}
      <Suspense fallback={<ChartSkeleton />}>
        <HeatmapSection range={dateRange.current} orgId={internalOrgId} />
      </Suspense>

      {/* Agent Performance — full width table */}
      <Suspense fallback={<TableSkeleton />}>
        <AgentSection range={dateRange.current} orgId={internalOrgId} />
      </Suspense>

      {/* Knowledge Gaps — full width table */}
      <Suspense fallback={<TableSkeleton />}>
        <KnowledgeGapsSection range={dateRange.current} orgId={internalOrgId} />
      </Suspense>
    </div>
  );
}

// ── Async Server Components for Suspense Streaming ──────────────────────────

interface SectionProps {
  range: DateRange;
  orgId: string;
}

async function TrendsSection({ range, orgId }: SectionProps) {
  const data = await getTrends(orgId, range);
  return <TrendsChart data={data} />;
}

async function FunnelSection({ range, orgId }: SectionProps) {
  const data = await getConversationFunnel(orgId, range);
  return <ConversationFunnelChart data={data} />;
}

async function ChannelSection({ range, orgId }: SectionProps) {
  const data = await getChannelDistribution(orgId, range);
  return <ChannelDistributionChart data={data} />;
}

async function ResponseTimeSection({ range, orgId }: SectionProps) {
  const data = await getResponseTimeDistribution(orgId, range);
  return <ResponseTimeChart data={data} />;
}

async function CsatSection({ range, orgId }: SectionProps) {
  const data = await getCsatBreakdown(orgId, range);
  return <CsatBreakdownChart data={data} />;
}

async function HeatmapSection({ range, orgId }: SectionProps) {
  const data = await getHourlyVolume(orgId, range);
  return <VolumeHeatmap data={data} />;
}

async function AgentSection({ range, orgId }: SectionProps) {
  const data = await getAgentPerformance(orgId, range);
  return <AgentPerformanceTable data={data} />;
}

async function KnowledgeGapsSection({ range, orgId }: SectionProps) {
  const data = await getKnowledgeGaps(orgId, range);
  return <KnowledgeGapsTable data={data} />;
}

// ── Inline Skeletons ────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-muted mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
