/**
 * RAG (Retrieval-Augmented Generation) pipeline.
 * Retrieves relevant knowledge chunks using keyword-based full-text search
 * via PostgreSQL to_tsvector / to_tsquery.
 *
 * When embeddings are available, this can be upgraded to pgvector cosine
 * similarity search without changing the interface.
 */

import { AI_CONFIG } from "./config";
import { db, knowledgeChunks, knowledgeSources } from "@repo/db";
import { eq, and, sql } from "drizzle-orm";

export interface RetrievedChunk {
  id: string;
  content: string;
  sourceName: string;
  sourceId: string;
  score: number;
}

/**
 * Convert a natural-language query into a tsquery string.
 * Splits on whitespace and joins with `&` (AND) for higher precision,
 * adding `:*` prefix matching for partial word matches.
 */
function buildTsQuery(query: string): string {
  const words = query
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return "";

  return words.map((w) => `${w}:*`).join(" & ");
}

/**
 * Retrieve relevant knowledge chunks using full-text search.
 * Falls back to mock data when DATABASE_URL is not configured.
 *
 * @param query - The user's question or search query
 * @param organizationId - Tenant scope
 * @param options - Configuration overrides
 */
export async function retrieveContext(
  query: string,
  organizationId: string,
  options?: { maxChunks?: number; minScore?: number }
): Promise<RetrievedChunk[]> {
  const maxChunks = options?.maxChunks ?? AI_CONFIG.maxContextChunks;
  const minScore = options?.minScore ?? 0.01;

  // DEV_MODE fallback — return mock data when no database is available
  if (!process.env.DATABASE_URL) {
    return getMockChunks(maxChunks);
  }

  const tsQuery = buildTsQuery(query);
  if (!tsQuery) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: knowledgeChunks.id,
        content: knowledgeChunks.content,
        sourceId: knowledgeChunks.sourceId,
        sourceName: knowledgeSources.name,
        rank: sql<number>`ts_rank(
          to_tsvector('english', ${knowledgeChunks.content}),
          to_tsquery('english', ${tsQuery})
        )`.as("rank"),
      })
      .from(knowledgeChunks)
      .innerJoin(
        knowledgeSources,
        eq(knowledgeChunks.sourceId, knowledgeSources.id)
      )
      .where(
        and(
          eq(knowledgeChunks.organizationId, organizationId),
          eq(knowledgeSources.status, "ready"),
          sql`to_tsvector('english', ${knowledgeChunks.content}) @@ to_tsquery('english', ${tsQuery})`
        )
      )
      .orderBy(
        sql`ts_rank(
          to_tsvector('english', ${knowledgeChunks.content}),
          to_tsquery('english', ${tsQuery})
        ) DESC`
      )
      .limit(maxChunks);

    return rows
      .filter((row) => Number(row.rank) >= minScore)
      .map((row) => ({
        id: row.id,
        content: row.content,
        sourceName: row.sourceName,
        sourceId: row.sourceId,
        score: Number(row.rank),
      }));
  } catch (err) {
    console.error("[rag] Full-text search failed, falling back to mock:", err);
    return getMockChunks(maxChunks);
  }
}

// ---- Mock data for development without a database ---------------------------

function getMockChunks(maxChunks: number): RetrievedChunk[] {
  const mockChunks: RetrievedChunk[] = [
    {
      id: "chunk_1",
      content:
        "To reset your password, go to Settings > Account > Security and click 'Change Password'. You'll receive a confirmation email.",
      sourceName: "Account Management Guide",
      sourceId: "src_1",
      score: 0.92,
    },
    {
      id: "chunk_2",
      content:
        "If you're locked out, click 'Forgot Password' on the login page. Enter your email and we'll send a reset link within 5 minutes.",
      sourceName: "FAQ - Login Issues",
      sourceId: "src_2",
      score: 0.87,
    },
    {
      id: "chunk_3",
      content:
        "Our refund policy allows returns within 30 days of purchase. To request a refund, contact support with your order number.",
      sourceName: "Refund Policy",
      sourceId: "src_3",
      score: 0.45,
    },
  ];

  return mockChunks.slice(0, maxChunks);
}
