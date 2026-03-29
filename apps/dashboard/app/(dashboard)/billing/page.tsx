import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import { getBillingSummary } from "@/lib/queries/billing";
import { getUsageMetrics } from "@/lib/queries/usage";
import { CurrentPlan } from "@/components/billing/current-plan";
import { UsageMeter } from "@/components/billing/usage-meter";
import { PlanCard } from "@/components/billing/plan-card";
import type { PlanId } from "@repo/shared";

export const metadata = { title: "Billing — SupportAI" };

// ---- Skeletons -------------------------------------------------------------

function CurrentPlanSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-muted mb-4" />
      <div className="h-8 w-32 rounded bg-muted mb-2" />
      <div className="h-4 w-20 rounded bg-muted" />
    </div>
  );
}

function UsageMeterSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-4">
      <div className="h-5 w-36 rounded bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="space-y-3 pt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-3">
      <div className="h-5 w-20 rounded bg-muted" />
      <div className="h-8 w-24 rounded bg-muted" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-muted" />
        ))}
      </div>
      <div className="h-10 w-full rounded bg-muted" />
    </div>
  );
}

// ---- Async sections --------------------------------------------------------

async function BillingOverview({ orgId }: { orgId: string }) {
  const [billing, usage] = await Promise.all([
    getBillingSummary(orgId),
    getUsageMetrics(orgId),
  ]);
  return (
    <div className="space-y-6">
      <UsageMeter usage={usage} plan={billing.plan} />
      <CurrentPlan billing={billing} />
    </div>
  );
}

async function PlanGrid({ orgId }: { orgId: string }) {
  const billing = await getBillingSummary(orgId);
  const plans: PlanId[] = ["starter", "growth", "pro", "enterprise"];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((planId) => (
        <PlanCard
          key={planId}
          planId={planId}
          currentPlan={billing.plan}
          status={billing.status}
        />
      ))}
    </div>
  );
}

// ---- Page ------------------------------------------------------------------

export default async function BillingPage() {
  const { internalOrgId } = await getAuthOrRedirect();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and payment details.
        </p>
      </div>

      {/* Usage + Current plan summary */}
      <section className="max-w-lg">
        <Suspense
          fallback={
            <div className="space-y-6">
              <UsageMeterSkeleton />
              <CurrentPlanSkeleton />
            </div>
          }
        >
          <BillingOverview orgId={internalOrgId} />
        </Suspense>
      </section>

      {/* Plan selector */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Change Plan</h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <PlanCardSkeleton key={i} />)}
            </div>
          }
        >
          <PlanGrid orgId={internalOrgId} />
        </Suspense>
      </section>

      {/* Env var notice in dev */}
      {!process.env.STRIPE_SECRET_KEY && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
          <strong>Dev mode:</strong> Stripe is not configured. Set{" "}
          <code className="font-mono text-xs">STRIPE_SECRET_KEY</code>,{" "}
          <code className="font-mono text-xs">STRIPE_PRICE_STARTER</code>,{" "}
          <code className="font-mono text-xs">STRIPE_PRICE_GROWTH</code>, and{" "}
          <code className="font-mono text-xs">STRIPE_PRICE_PRO</code> to enable
          real checkout.
        </div>
      )}
    </div>
  );
}
