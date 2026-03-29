/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events to keep subscription state in sync.
 *
 * Events handled:
 * - checkout.session.completed      → create/update subscription record
 * - customer.subscription.updated   → update plan/status
 * - customer.subscription.deleted   → mark as canceled
 * - invoice.payment_failed          → mark as past_due
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, subscriptions, eq } from "@repo/db";
import { PLAN_IDS, type PlanId } from "@repo/shared";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/** Map a Stripe price ID back to a SupportAI plan ID */
function planFromPriceId(priceId: string): PlanId {
  const map: Record<string, PlanId> = {
    [process.env.STRIPE_PRICE_STARTER ?? ""]: "starter",
    [process.env.STRIPE_PRICE_GROWTH ?? ""]: "growth",
    [process.env.STRIPE_PRICE_PRO ?? ""]: "pro",
  };
  return map[priceId] ?? "starter";
}

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  for (let i = 0; i < 24; i++) id += chars[bytes[i]! % chars.length];
  return id;
}

// ---- Webhook handler -------------------------------------------------------

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  console.log(`[stripe/webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const orgId = session.metadata?.organizationId;
        const planId = (session.metadata?.planId ?? "starter") as PlanId;

        if (!orgId || !session.customer || !session.subscription) {
          console.error("[stripe/webhook] checkout.session.completed missing metadata", session.id);
          break;
        }

        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer.id;

        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

        // Fetch full subscription details
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

        await db
          .insert(subscriptions)
          .values({
            id: generateId(),
            organizationId: orgId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSub.items.data[0]?.price.id ?? null,
            plan: planId,
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          })
          .onConflictDoUpdate({
            target: subscriptions.organizationId,
            set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: stripeSub.items.data[0]?.price.id ?? null,
              plan: planId,
              status: stripeSub.status,
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              updatedAt: new Date(),
            },
          });

        console.log(`[stripe/webhook] Subscription created: org=${orgId} plan=${planId}`);
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const priceId = stripeSub.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId) : "starter";

        const customerId = typeof stripeSub.customer === "string"
          ? stripeSub.customer
          : stripeSub.customer.id;

        await db
          .update(subscriptions)
          .set({
            plan,
            status: stripeSub.status,
            stripePriceId: priceId ?? null,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log(`[stripe/webhook] Subscription updated: customer=${customerId} plan=${plan} status=${stripeSub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId = typeof stripeSub.customer === "string"
          ? stripeSub.customer
          : stripeSub.customer.id;

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log(`[stripe/webhook] Subscription canceled: customer=${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

        if (!customerId) break;

        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log(`[stripe/webhook] Payment failed: customer=${customerId}`);
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error processing ${event.type}:`, err);
    // Return 200 to prevent Stripe retrying — log the error for investigation
    return NextResponse.json({ received: true, error: "Processing error logged" });
  }

  return NextResponse.json({ received: true });
}
