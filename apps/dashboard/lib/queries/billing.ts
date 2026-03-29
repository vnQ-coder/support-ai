/**
 * Billing data queries -- plain async functions (NOT server actions).
 * Called from Server Components and run on the server.
 *
 * When DATABASE_URL is not set (local dev without DB), returns mock data.
 */

import { db, subscriptions, eq } from "@repo/db";
import type { BillingSummary, PlanId } from "@repo/shared";

const DEV_MODE = !process.env.DATABASE_URL;

function getMockBillingSummary(): BillingSummary {
  return {
    plan: "starter" as PlanId,
    status: "active",
    currentPeriodEnd: new Date(
      Date.now() + 25 * 24 * 60 * 60 * 1000
    ).toISOString(),
    cancelAtPeriodEnd: false,
    stripeCustomerId: "cus_mock_123",
    stripeSubscriptionId: "sub_mock_123",
  };
}

/**
 * Fetch the billing summary for an organization.
 */
export async function getBillingSummary(
  orgId: string
): Promise<BillingSummary> {
  if (DEV_MODE) return getMockBillingSummary();

  const rows = await db
    .select({
      plan: subscriptions.plan,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      stripeCustomerId: subscriptions.stripeCustomerId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  if (rows.length === 0) {
    return {
      plan: "starter",
      status: "none",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  const row = rows[0]!;
  return {
    plan: row.plan as PlanId,
    status: row.status as BillingSummary["status"],
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
  };
}
