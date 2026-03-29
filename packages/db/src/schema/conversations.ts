import {
  pgTable,
  text,
  timestamp,
  varchar,
  real,
  smallint,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    email: varchar("email", { length: 255 }),
    name: varchar("name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("contacts_org_idx").on(table.organizationId),
    index("contacts_email_idx").on(table.organizationId, table.email),
  ]
);

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    contactId: text("contact_id")
      .references(() => contacts.id)
      .notNull(),
    channel: varchar("channel", { length: 20 }).notNull().default("web_chat"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    assigneeId: text("assignee_id").references(() => members.id),
    subject: text("subject"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: varchar("resolved_by", { length: 20 }),
    csatScore: smallint("csat_score"),
    csatSubmittedAt: timestamp("csat_submitted_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("conversations_org_idx").on(table.organizationId),
    index("conversations_status_idx").on(table.organizationId, table.status),
    index("conversations_contact_idx").on(table.contactId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .references(() => conversations.id)
      .notNull(),
    sender: varchar("sender", { length: 20 }).notNull(),
    content: text("content").notNull(),
    confidence: real("confidence"),
    sources: jsonb("sources").$type<string[]>().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_created_idx").on(table.conversationId, table.createdAt),
  ]
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    conversationId: text("conversation_id").references(
      () => conversations.id
    ),
    event: varchar("event", { length: 100 }).notNull(),
    properties: jsonb("properties")
      .$type<Record<string, unknown>>()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_org_idx").on(table.organizationId),
    index("analytics_event_idx").on(table.organizationId, table.event),
  ]
);
