import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { conversations } from "./conversations";

export const slaPolicies = pgTable(
  "sla_policies",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Time limits in minutes
    firstResponseMinutes: integer("first_response_minutes")
      .notNull()
      .default(60),
    resolutionMinutes: integer("resolution_minutes").notNull().default(480),
    // Priority targeting
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("sla_policies_org_idx").on(table.organizationId)]
);

export const conversationSla = pgTable(
  "conversation_sla",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .references(() => conversations.id)
      .notNull()
      .unique(),
    policyId: text("policy_id").references(() => slaPolicies.id),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    // Deadlines
    firstResponseDeadline: timestamp("first_response_deadline"),
    resolutionDeadline: timestamp("resolution_deadline"),
    // Actuals
    firstResponseAt: timestamp("first_response_at"),
    resolvedAt: timestamp("resolved_at"),
    // Breach tracking
    firstResponseBreached: boolean("first_response_breached")
      .notNull()
      .default(false),
    resolutionBreached: boolean("resolution_breached")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("conversation_sla_org_idx").on(table.organizationId),
    index("conversation_sla_conv_idx").on(table.conversationId),
  ]
);
