/**
 * Stripe-related types, constants, and Zod schemas.
 *
 * This module is framework-agnostic — no Next.js or React imports.
 * Used by both the API app (checkout, webhooks) and the dashboard (billing UI).
 */

import { z } from "zod";
import { PLANS } from "./constants";

// ---- Plan types -------------------------------------------------------------

export type PlanId = keyof typeof PLANS;

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  starter: [
    "500 AI resolutions / month",
    "2 channels",
    "1 knowledge source",
    "Email support",
  ],
  growth: [
    "2,000 AI resolutions / month",
    "Unlimited channels",
    "Unlimited knowledge sources",
    "Priority email support",
    "Custom widget branding",
  ],
  pro: [
    "10,000 AI resolutions / month",
    "Unlimited channels",
    "Unlimited knowledge sources",
    "Dedicated support",
    "Custom widget branding",
    "API access",
    "Advanced analytics",
  ],
  enterprise: [
    "Unlimited AI resolutions",
    "Unlimited everything",
    "Dedicated success manager",
    "SSO / SAML",
    "SLA guarantees",
    "Custom integrations",
  ],
};

// ---- Stripe price mapping ---------------------------------------------------

/**
 * Maps plan IDs to Stripe Price IDs.
 * In production these come from env vars; fallback to empty strings for dev.
 */
export function getStripePriceId(planId: PlanId): string | null {
  const mapping: Record<PlanId, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: undefined, // enterprise uses custom quotes
  };
  return mapping[planId] ?? null;
}

// ---- Subscription status ----------------------------------------------------

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// ---- Zod schemas for API validation -----------------------------------------

export const createCheckoutSchema = z.object({
  planId: z.enum(["starter", "growth", "pro"] as const),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const billingPortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type BillingPortalInput = z.infer<typeof billingPortalSchema>;

// ---- Billing summary type (used by dashboard) -------------------------------

export interface BillingSummary {
  plan: PlanId;
  status: SubscriptionStatus | "none";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}
