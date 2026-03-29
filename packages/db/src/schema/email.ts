import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Per-organization email channel configuration.
 *
 * Stores the from address, signature, auto-reply settings, and
 * custom domain details for outbound emails sent via Resend.
 */
export const emailConfigs = pgTable("email_configs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .unique()
    .notNull(),
  /** Verified from address, e.g. "support@acme.com" */
  fromAddress: varchar("from_address", { length: 255 }),
  /** Display name for the from address, e.g. "Acme Support" */
  fromName: varchar("from_name", { length: 255 }),
  /** Custom domain for sending (must be verified in Resend) */
  customDomain: varchar("custom_domain", { length: 255 }),
  /** HTML signature appended to agent replies */
  signature: text("signature").default(""),
  /** Whether to send auto-reply acknowledgment on inbound email */
  autoReplyEnabled: boolean("auto_reply_enabled").notNull().default(true),
  /** Custom auto-reply estimated response time, e.g. "a few hours" */
  autoReplyEstimate: varchar("auto_reply_estimate", { length: 100 }).default(
    "a few minutes"
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
