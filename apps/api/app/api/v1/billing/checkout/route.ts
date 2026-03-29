/**
 * POST /api/v1/billing/checkout
 * Creates a Stripe Checkout Session for plan upgrades.
 * Authenticated via Clerk session (dashboard only — not API key).
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { db, subscriptions, organizations, eq } from "@repo/db";
import { createCheckoutSchema, getStripePriceId } from "@repo/shared";
import { apiError } from "../../_lib/auth";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: Request) {
  // 1. Auth via Clerk
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId || !clerkOrgId) {
    return apiError("unauthorized", "Authentication required", 401);
  }

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  const parsed = createCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "bad_request",
      parsed.error.errors[0]?.message ?? "Validation failed",
      400
    );
  }

  const { planId } = parsed.data;

  // 3. Get Stripe price ID
  const priceId = getStripePriceId(planId);
  if (!priceId) {
    return apiError(
      "bad_request",
      `No Stripe price configured for plan: ${planId}`,
      400
    );
  }

  // 4. Look up internal org ID from Clerk org ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  });

  if (!org) {
    return apiError("not_found", "Organization not found", 404);
  }

  const internalOrgId = org.id;
  const stripe = getStripe();

  // 5. Find existing Stripe customer if org already has a subscription
  const [existingSub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, internalOrgId))
    .limit(1);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // 6. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    ...(existingSub?.stripeCustomerId
      ? { customer: existingSub.stripeCustomerId }
      : {}),
    success_url: `${appUrl}/onboarding?checkout=success`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      organizationId: internalOrgId,
      planId,
    },
    subscription_data: {
      metadata: { organizationId: internalOrgId, planId },
    },
  });

  return NextResponse.json({ url: session.url });
}
