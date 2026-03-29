"use client";

import { PLANS } from "@repo/shared";
import type { BillingSummary } from "@repo/shared";

interface CurrentPlanProps {
  billing: BillingSummary;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: BillingSummary["status"]): {
  text: string;
  className: string;
} {
  switch (status) {
    case "active":
      return {
        text: "Active",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "trialing":
      return {
        text: "Trial",
        className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    case "past_due":
      return {
        text: "Past Due",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    case "canceled":
      return {
        text: "Canceled",
        className: "bg-red-500/10 text-red-400 border-red-500/20",
      };
    default:
      return {
        text: status ?? "Free",
        className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      };
  }
}

export function CurrentPlan({ billing }: CurrentPlanProps) {
  const plan = PLANS[billing.plan];
  const badge = statusLabel(billing.status);

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to open billing portal");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("[billing] portal error:", error);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Current Plan</h2>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.text}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-2xl font-bold">{plan.name}</p>
          {plan.price !== null ? (
            <p className="text-sm text-muted-foreground">
              ${plan.price}/month
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Custom pricing</p>
          )}
        </div>

        {billing.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            {billing.cancelAtPeriodEnd
              ? `Cancels on ${formatDate(billing.currentPeriodEnd)}`
              : `Renews on ${formatDate(billing.currentPeriodEnd)}`}
          </p>
        )}

        <div className="text-sm text-muted-foreground">
          <p>
            {typeof plan.resolutionsPerMonth === "number"
              ? `${plan.resolutionsPerMonth.toLocaleString()} resolutions / month`
              : "Unlimited resolutions"}
          </p>
          <p>
            {typeof plan.channels === "number"
              ? `${plan.channels} channels`
              : "Unlimited channels"}
          </p>
        </div>

        {billing.stripeCustomerId && (
          <button
            onClick={handleManageBilling}
            className="mt-2 inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Manage Billing
          </button>
        )}
      </div>
    </div>
  );
}
