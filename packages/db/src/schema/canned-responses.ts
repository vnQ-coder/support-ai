import { pgTable, text, timestamp, varchar, boolean, integer, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { members } from "./organizations";

export const cannedResponses = pgTable(
  "canned_responses",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id).notNull(),
    createdById: text("created_by_id").references(() => members.id),
    shortcut: varchar("shortcut", { length: 50 }).notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    content: text("content").notNull(),
    isShared: boolean("is_shared").notNull().default(true),
    usageCount: integer("usage_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("canned_org_idx").on(t.organizationId),
    index("canned_shortcut_idx").on(t.organizationId, t.shortcut),
  ]
);
