/**
 * POST /api/v1/billing/webhook
 * Stripe webhook handler — verifies signature and syncs subscription state to DB.
 *
 * Handled events:
 *   checkout.session.completed       → create subscription row
 *   customer.subscription.updated    → update plan/status/period
 *   customer.subscription.deleted    → mark as canceled
 *   invoice.payment_failed           → mark as past_due
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, subscriptions, eq } from "@repo/db";
import { randomUUID } from "node:crypto";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER ?? ""]: "starter",
    [process.env.STRIPE_PRICE_GROWTH ?? ""]: "growth",
    [process.env.STRIPE_PRICE_PRO ?? ""]: "pro",
  };
  return map[priceId] ?? "starter";
}

// Stripe requires the raw body to verify the signature — do NOT parse as JSON first
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[stripe/webhook] Signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 });
  }

  console.log(`[stripe/webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const organizationId = session.metadata?.organizationId;
        if (!organizationId) {
          console.error("[stripe/webhook] checkout.session.completed: missing organizationId in metadata");
          break;
        }

        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? "";
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

        // Fetch full subscription to get price + period info
        let stripeSubData: Stripe.Subscription | null = null;
        if (subscriptionId) {
          stripeSubData = await stripe.subscriptions.retrieve(subscriptionId);
        }

        const priceId = stripeSubData?.items.data[0]?.price.id ?? null;
        const plan = session.metadata?.planId ?? (priceId ? planFromPriceId(priceId) : "starter");

        await db
          .insert(subscriptions)
          .values({
            id: randomUUID(),
            organizationId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            plan,
            status: stripeSubData?.status ?? "active",
            currentPeriodStart: stripeSubData?.current_period_start
              ? new Date(stripeSubData.current_period_start * 1000)
              : null,
            currentPeriodEnd: stripeSubData?.current_period_end
              ? new Date(stripeSubData.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: stripeSubData?.cancel_at_period_end ?? false,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptions.organizationId,
            set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              plan,
              status: stripeSubData?.status ?? "active",
              currentPeriodStart: stripeSubData?.current_period_start
                ? new Date(stripeSubData.current_period_start * 1000)
                : null,
              currentPeriodEnd: stripeSubData?.current_period_end
                ? new Date(stripeSubData.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: stripeSubData?.cancel_at_period_end ?? false,
              updatedAt: new Date(),
            },
          });

        console.log(`[stripe/webhook] Subscription created for org ${organizationId} → plan: ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id ?? null;
        const plan = priceId ? planFromPriceId(priceId) : "starter";

        await db
          .update(subscriptions)
          .set({
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, typeof sub.customer === "string" ? sub.customer : sub.customer.id));

        console.log(`[stripe/webhook] Subscription updated: ${sub.id} → status: ${sub.status}, plan: ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log(`[stripe/webhook] Subscription canceled for customer: ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log(`[stripe/webhook] Payment failed for customer: ${customerId} → past_due`);
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] Error processing event:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
