import {
  pgTable,
  text,
  timestamp,
  varchar,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { conversations } from "./conversations";

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#6B7280"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("tags_org_idx").on(t.organizationId)]
);

export const conversationTags = pgTable(
  "conversation_tags",
  {
    conversationId: text("conversation_id")
      .references(() => conversations.id)
      .notNull(),
    tagId: text("tag_id")
      .references(() => tags.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.tagId] }),
    index("conv_tags_conv_idx").on(t.conversationId),
    index("conv_tags_tag_idx").on(t.tagId),
  ]
);
