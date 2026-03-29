import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import {
  getKPIs,
  getVolumeTimeSeries,
  getCsatResolutionTimeSeries,
  getNeedsAttention,
  getEscalationSummary,
  hasAnyConversations,
} from "@/lib/queries/dashboard";
import { computeDateRange, type DateRangePreset } from "@/lib/dashboard-utils";
import { KPICardGrid } from "@/components/overview/kpi-card-grid";
import { DateRangeSelector } from "@/components/overview/date-range-selector";
import { VolumeChart } from "@/components/overview/volume-chart";
import { CsatResolutionChart } from "@/components/overview/csat-resolution-chart";
import { NeedsAttentionTable } from "@/components/overview/needs-attention-table";
import { EscalationPanel } from "@/components/overview/escalation-panel";
import { DashboardEmptyState } from "@/components/overview/dashboard-empty-state";
import { ChartSkeleton } from "@/components/overview/chart-skeleton";
import type { DateRangeWithComparison } from "@/lib/dashboard-utils";

const VALID_PRESETS = new Set<string>(["7d", "30d", "90d"]);

interface OverviewPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  // Enforce authentication — redirects to /sign-in if unauthenticated
  const { internalOrgId } = await getAuthOrRedirect();

  const params = await searchParams;

  // Validate searchParams — only allow known presets
  const rangePreset: DateRangePreset = VALID_PRESETS.has(params.range ?? "")
    ? (params.range as DateRangePreset)
    : "30d";

  const dateRange = computeDateRange(rangePreset);

  // Check if account has any data
  const hasData = await hasAnyConversations(internalOrgId);

  if (!hasData) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your AI support performance at a glance
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangeSelector />
        </Suspense>
      </div>

      {/* KPI Cards — fetch independently for streaming */}
      <Suspense fallback={<KPISkeletonGrid />}>
        <KPISection dateRange={dateRange} orgId={internalOrgId} />
      </Suspense>

      {/* Charts — each streams independently */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <VolumeChartSection dateRange={dateRange} orgId={internalOrgId} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <CsatChartSection dateRange={dateRange} orgId={internalOrgId} />
        </Suspense>
      </div>

      {/* Escalation Queue — streams independently */}
      <Suspense fallback={<TableSkeleton />}>
        <EscalationSection orgId={internalOrgId} />
      </Suspense>

      {/* Needs Attention — streams independently */}
      <Suspense fallback={<TableSkeleton />}>
        <NeedsAttentionSection orgId={internalOrgId} />
      </Suspense>
    </div>
  );
}

// ─── Async Server Components for Suspense Streaming ──────────────────────────

async function KPISection({ dateRange, orgId }: { dateRange: DateRangeWithComparison; orgId: string }) {
  const kpis = await getKPIs(dateRange, orgId);
  return <KPICardGrid data={kpis} />;
}

async function VolumeChartSection({ dateRange, orgId }: { dateRange: DateRangeWithComparison; orgId: string }) {
  const data = await getVolumeTimeSeries(dateRange, orgId);
  return <VolumeChart data={data} />;
}

async function CsatChartSection({ dateRange, orgId }: { dateRange: DateRangeWithComparison; orgId: string }) {
  const data = await getCsatResolutionTimeSeries(dateRange, orgId);
  return <CsatResolutionChart data={data} />;
}

async function EscalationSection({ orgId }: { orgId: string }) {
  const data = await getEscalationSummary(orgId);
  return <EscalationPanel data={data} />;
}

async function NeedsAttentionSection({ orgId }: { orgId: string }) {
  const data = await getNeedsAttention(orgId);
  return <NeedsAttentionTable data={data} />;
}

// ─── Inline Skeletons ────────────────────────────────────────────────────────

function KPISkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
          <div className="h-4 w-28 rounded bg-muted mb-3" />
          <div className="h-8 w-20 rounded bg-muted mb-2" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

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
