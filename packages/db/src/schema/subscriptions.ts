import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Stripe subscriptions table.
 * One row per organization — stores the active Stripe subscription state.
 * Updated exclusively by the Stripe webhook handler.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(), // internal UUID
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .unique()
      .notNull(),
    stripeCustomerId: text("stripe_customer_id").unique().notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    plan: varchar("plan", { length: 20 }).notNull().default("starter"),
    status: varchar("status", { length: 30 }).notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_subscriptions_org_id").on(table.organizationId),
    index("idx_subscriptions_stripe_customer").on(table.stripeCustomerId),
    index("idx_subscriptions_stripe_sub").on(table.stripeSubscriptionId),
  ]
);
