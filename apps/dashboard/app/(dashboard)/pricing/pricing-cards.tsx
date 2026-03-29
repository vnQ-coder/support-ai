"use client";

import { useState } from "react";
import { PLANS, PLAN_FEATURES } from "@repo/shared";
import { createCheckoutSession } from "./actions";

type PaidPlanId = "starter" | "growth" | "pro";

const PAID_PLANS: { id: PaidPlanId; recommended?: boolean }[] = [
  { id: "starter" },
  { id: "growth", recommended: true },
  { id: "pro" },
];

export function PricingCards({
  marketingUrl,
}: {
  marketingUrl: string;
}) {
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectPlan(planId: PaidPlanId) {
    setLoadingPlan(planId);
    setError(null);

    try {
      const result = await createCheckoutSession(planId);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {PAID_PLANS.map(({ id, recommended }) => {
          const plan = PLANS[id];
          const features = PLAN_FEATURES[id];
          const isLoading = loadingPlan === id;

          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-xl border p-6 transition-shadow ${
                recommended
                  ? "border-primary shadow-lg shadow-primary/5"
                  : "border-border"
              }`}
            >
              {recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </span>
              )}

              <div className="mb-6 space-y-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={loadingPlan !== null}
                onClick={() => void handleSelectPlan(id)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  recommended
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Get Started"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enterprise card */}
      <div className="rounded-xl border border-border p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Enterprise</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlimited AI resolutions, SSO/SAML, dedicated success manager,
              SLA guarantees, and custom integrations.
            </p>
          </div>
          <a
            href={`${marketingUrl}/contact`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}
