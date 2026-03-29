"use client";

import { useState } from "react";
import { PLANS } from "@repo/shared";
import type { PlanId, BillingSummary } from "@repo/shared";
import { PLAN_FEATURES } from "@repo/shared";

interface PlanCardProps {
  planId: PlanId;
  currentPlan: BillingSummary["plan"];
  status: BillingSummary["status"];
}

export function PlanCard({ planId, currentPlan, status }: PlanCardProps) {
  const [loading, setLoading] = useState(false);
  const plan = PLANS[planId];
  const features = PLAN_FEATURES[planId];
  const isCurrent = planId === currentPlan;
  const isEnterprise = planId === "enterprise";

  // Determine if this is an upgrade or downgrade relative to current plan
  const planOrder: PlanId[] = ["starter", "growth", "pro", "enterprise"];
  const currentIndex = planOrder.indexOf(currentPlan);
  const thisIndex = planOrder.indexOf(planId);
  const isUpgrade = thisIndex > currentIndex;

  async function handleSelectPlan() {
    if (isCurrent || isEnterprise) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to create checkout");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("[billing] checkout error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 transition-colors ${
        isCurrent
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Current Plan
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {plan.price !== null ? (
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold">${plan.price}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
        ) : (
          <p className="mt-1 text-lg font-medium text-muted-foreground">
            Custom pricing
          </p>
        )}
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {isEnterprise ? (
        <a
          href="mailto:sales@supportai.com"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Contact Sales
        </a>
      ) : (
        <button
          onClick={handleSelectPlan}
          disabled={isCurrent || loading}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isCurrent
              ? "border border-border bg-background text-foreground"
              : isUpgrade
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background text-foreground hover:bg-accent"
          }`}
        >
          {loading
            ? "Redirecting..."
            : isCurrent
              ? "Current Plan"
              : isUpgrade
                ? `Upgrade to ${plan.name}`
                : `Switch to ${plan.name}`}
        </button>
      )}
    </div>
  );
}
