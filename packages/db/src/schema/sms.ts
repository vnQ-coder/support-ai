import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Per-organization Twilio SMS/WhatsApp channel configuration.
 *
 * Stores Twilio credentials, phone numbers, and channel settings.
 * The auth_token column stores the encrypted reference — the actual
 * secret is kept in the Twilio account or env vars.
 */
export const smsConfigs = pgTable("sms_configs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .unique()
    .notNull(),
  /** Twilio Account SID */
  twilioAccountSid: varchar("twilio_account_sid", { length: 255 }),
  /** Twilio Auth Token (encrypted reference) */
  twilioAuthToken: varchar("twilio_auth_token", { length: 255 }),
  /** Twilio phone number for SMS, e.g. "+15551234567" */
  phoneNumber: varchar("phone_number", { length: 20 }),
  /** Twilio WhatsApp-enabled number, e.g. "+15551234567" */
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  /** Whether SMS channel is enabled */
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  /** Whether WhatsApp channel is enabled */
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
  /** Whether to send auto-reply acknowledgment on inbound message */
  autoReplyEnabled: boolean("auto_reply_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
