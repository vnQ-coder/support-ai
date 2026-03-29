import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  clerkOrgId: text("clerk_org_id").unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  plan: varchar("plan", { length: 20 }).notNull().default("starter"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const members = pgTable("members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("agent"),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  isLive: boolean("is_live").notNull().default(false),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

export const widgetConfigs = pgTable("widget_configs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .unique()
    .notNull(),
  primaryColor: varchar("primary_color", { length: 7 })
    .notNull()
    .default("#3B82F6"),
  greeting: text("greeting")
    .notNull()
    .default("Hi! How can we help you today?"),
  placeholder: varchar("placeholder", { length: 200 })
    .notNull()
    .default("Type a message..."),
  position: varchar("position", { length: 20 })
    .notNull()
    .default("bottom-right"),
  allowedDomains: jsonb("allowed_domains").$type<string[]>().default([]),
  showBranding: boolean("show_branding").notNull().default(true),
  logoUrl: text("logo_url"),
  widgetTitle: varchar("widget_title", { length: 255 }),
  autoOpenDelay: integer("auto_open_delay"),
  preChatFields: jsonb("pre_chat_fields").$type<Array<{name: string; type: string; required: boolean}>>().default([]),
  customCss: text("custom_css"),
  bubbleIcon: varchar("bubble_icon", { length: 20 }).notNull().default("chat"),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  offlineMessage: text("offline_message"),
  theme: varchar("theme", { length: 10 }).notNull().default("light"),
  positionOffsetX: integer("position_offset_x").notNull().default(20),
  positionOffsetY: integer("position_offset_y").notNull().default(20),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  actorId: text("actor_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
