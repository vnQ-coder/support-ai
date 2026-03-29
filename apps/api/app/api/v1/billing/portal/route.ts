/**
 * POST /api/v1/billing/portal
 * Creates a Stripe Customer Portal session for managing subscription.
 * Authenticated via Clerk session (dashboard only).
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { db, subscriptions, eq } from "@repo/db";
import { billingPortalSchema } from "@repo/shared";
import { apiError } from "../../_lib/auth";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: Request) {
  // 1. Auth via Clerk
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return apiError("unauthorized", "Authentication required", 401);
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = billingPortalSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("bad_request", "Invalid request body", 400);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = parsed.data.returnUrl ?? `${appUrl}/billing`;

  // 3. Get Stripe customer for this org
  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return apiError(
      "not_found",
      "No billing account found. Please subscribe to a plan first.",
      404
    );
  }

  // 4. Create portal session
  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
