/**
 * Knowledge Base data queries and server actions.
 * Queries are plain async functions called from Server Components.
 * Mutations are Server Actions (exported with "use server" via actions file).
 */

import { db, knowledgeSources, knowledgeChunks } from "@repo/db";
import { eq, and, desc, count, isNull } from "drizzle-orm";

// ---- Types ----------------------------------------------------------------

export interface KnowledgeSourceRow {
  id: string;
  name: string;
  type: string;
  status: string;
  sourceUrl: string | null;
  chunkCount: number;
  lastSyncedAt: string | null;
  createdAt: string;
}

// ---- Queries (called from Server Components) ------------------------------

const DEV_MODE = !process.env.DATABASE_URL;

function getMockKnowledgeSources(): KnowledgeSourceRow[] {
  return [
    {
      id: "ks_1",
      name: "Product Documentation",
      type: "file",
      status: "ready",
      sourceUrl: null,
      chunkCount: 47,
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ks_2",
      name: "FAQ Page",
      type: "url",
      status: "ready",
      sourceUrl: "https://example.com/faq",
      chunkCount: 23,
      lastSyncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ks_3",
      name: "Return Policy",
      type: "text",
      status: "processing",
      sourceUrl: null,
      chunkCount: 0,
      lastSyncedAt: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * List all knowledge sources for an organization, sorted by most recent first.
 * Returns non-deleted sources only.
 */
export async function getKnowledgeSources(
  orgId: string
): Promise<KnowledgeSourceRow[]> {
  if (DEV_MODE) return getMockKnowledgeSources();

  const rows = await db
    .select({
      id: knowledgeSources.id,
      name: knowledgeSources.name,
      type: knowledgeSources.type,
      status: knowledgeSources.status,
      sourceUrl: knowledgeSources.sourceUrl,
      chunkCount: knowledgeSources.chunkCount,
      lastSyncedAt: knowledgeSources.lastSyncedAt,
      createdAt: knowledgeSources.createdAt,
    })
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.organizationId, orgId),
        isNull(knowledgeSources.deletedAt)
      )
    )
    .orderBy(desc(knowledgeSources.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    sourceUrl: row.sourceUrl,
    chunkCount: row.chunkCount,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Delete a knowledge source and all its chunks.
 * Performs a soft delete on the source and hard deletes chunks.
 */
export async function deleteKnowledgeSource(
  sourceId: string,
  orgId: string
): Promise<{ success: boolean }> {
  if (DEV_MODE) return { success: true };

  // Verify ownership first
  const source = await db
    .select({ id: knowledgeSources.id })
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.id, sourceId),
        eq(knowledgeSources.organizationId, orgId),
        isNull(knowledgeSources.deletedAt)
      )
    )
    .limit(1);

  if (source.length === 0) {
    return { success: false };
  }

  // Delete chunks first (hard delete), then soft-delete the source
  await db
    .delete(knowledgeChunks)
    .where(eq(knowledgeChunks.sourceId, sourceId));

  await db
    .update(knowledgeSources)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(knowledgeSources.id, sourceId));

  return { success: true };
}
