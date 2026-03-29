"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { db, subscriptions, organizations, eq } from "@repo/db";
import { createCheckoutSchema, getStripePriceId } from "@repo/shared";
import { randomUUID } from "crypto";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function createCheckoutSession(planId: string) {
  // 1. Auth via Clerk
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId || !clerkOrgId) {
    return { error: "Authentication required. Please sign in." };
  }

  // 2. Validate input
  const parsed = createCheckoutSchema.safeParse({ planId });
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Invalid plan selected.",
    };
  }

  // 3. Get Stripe price ID
  const priceId = getStripePriceId(parsed.data.planId);
  if (!priceId) {
    return { error: `No Stripe price configured for plan: ${parsed.data.planId}` };
  }

  // 4. Look up internal org — auto-provision if webhook hasn't synced it yet
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  }).catch(() => null);

  if (!org) {
    // Fetch org details from Clerk and create a local record
    try {
      const clerk = await clerkClient();
      const clerkOrg = await clerk.organizations.getOrganization({
        organizationId: clerkOrgId,
      });

      const slug = clerkOrg.slug ?? clerkOrgId.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      const [newOrg] = await db
        .insert(organizations)
        .values({
          id: randomUUID(),
          clerkOrgId,
          name: clerkOrg.name,
          slug,
          plan: "starter",
        })
        .onConflictDoNothing()
        .returning();

      // Re-fetch in case of a race condition on conflict
      org = newOrg ?? await db.query.organizations.findFirst({
        where: eq(organizations.clerkOrgId, clerkOrgId),
      });
    } catch {
      // DB might be down — surface a clear error
      return {
        error:
          "Database is not reachable. Make sure Docker is running: `docker compose up -d`",
      };
    }
  }

  if (!org) {
    return { error: "Organization not found. Please refresh and try again." };
  }

  const internalOrgId = org.id;
  const stripe = getStripe();

  // 5. Check for existing Stripe customer
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
      planId: parsed.data.planId,
    },
    subscription_data: {
      metadata: { organizationId: internalOrgId, planId: parsed.data.planId },
    },
  });

  if (!session.url) {
    return { error: "Failed to create checkout session." };
  }

  return { url: session.url };
}
