import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  vector,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    sourceUrl: text("source_url"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    chunkCount: integer("chunk_count").notNull().default(0),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("knowledge_sources_org_idx").on(table.organizationId),
  ]
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .references(() => knowledgeSources.id)
      .notNull(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    metadata: text("metadata"),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chunks_source_idx").on(table.sourceId),
    index("knowledge_chunks_org_idx").on(table.organizationId),
  ]
);
