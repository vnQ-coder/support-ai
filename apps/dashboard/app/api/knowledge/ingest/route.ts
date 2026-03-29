/**
 * Dashboard-side knowledge ingestion API route.
 * Handles file uploads and text/URL submissions from the dashboard UI.
 * Uses Clerk auth (not API key auth) since this is called from the dashboard.
 */

import { NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { embedMany } from "ai";
import { AI_MODELS } from "@repo/ai";
import {
  db,
  knowledgeSources,
  knowledgeChunks,
} from "@repo/db";
import { eq } from "drizzle-orm";

// ---- Inline chunking (avoids @repo/ai dependency in dashboard) --------------

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitSentences(text: string): string[] {
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function chunkText(
  text: string,
  options?: { maxTokens?: number; overlap?: number }
): string[] {
  const maxTokens = options?.maxTokens ?? 500;
  const overlap = options?.overlap ?? 50;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return [];
  if (estimateTokens(cleaned) <= maxTokens) return [cleaned];

  const sentences = splitSentences(cleaned);
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let currentSentences: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (sentenceTokens > maxTokens) {
      if (currentSentences.length > 0) {
        chunks.push(currentSentences.join(" "));
        currentSentences = [];
        currentTokens = 0;
      }
      const maxChars = maxTokens * 4;
      for (let i = 0; i < sentence.length; i += maxChars) {
        const slice = sentence.slice(i, i + maxChars).trim();
        if (slice.length > 0) chunks.push(slice);
      }
      continue;
    }

    if (currentTokens + sentenceTokens > maxTokens && currentSentences.length > 0) {
      chunks.push(currentSentences.join(" "));
      const overlapSentences: string[] = [];
      let overlapTokens = 0;
      for (let i = currentSentences.length - 1; i >= 0; i--) {
        const st = estimateTokens(currentSentences[i]!);
        if (overlapTokens + st > overlap) break;
        overlapSentences.unshift(currentSentences[i]!);
        overlapTokens += st;
      }
      currentSentences = overlapSentences;
      currentTokens = overlapTokens;
    }

    currentSentences.push(sentence);
    currentTokens += sentenceTokens;
  }

  if (currentSentences.length > 0) {
    const final = currentSentences.join(" ");
    if (chunks.length === 0 || chunks[chunks.length - 1] !== final) {
      chunks.push(final);
    }
  }

  return chunks;
}

function nanoid(size = 21): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

// ---- Helpers ----------------------------------------------------------------

async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SupportAI-Bot/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }

  if (name.endsWith(".pdf") || name.endsWith(".docx")) {
    const text = await file.text();
    if (text.trim().length > 0) return text;
    throw new Error(
      `Binary ${name.split(".").pop()?.toUpperCase()} parsing is not yet supported. ` +
        `Please paste the content as text instead.`
    );
  }

  throw new Error(
    `Unsupported file type: ${name}. Supported formats: PDF, DOCX, TXT, MD`
  );
}

/**
 * Generate embeddings for a batch of text chunks.
 * Returns an array of embeddings (or null for chunks that failed).
 * Processes in groups of 20 to avoid rate limits.
 */
async function generateEmbeddingsBatch(
  texts: string[]
): Promise<(number[] | null)[]> {
  const EMBED_BATCH_SIZE = 20;
  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + EMBED_BATCH_SIZE);

    try {
      const { embeddings } = await embedMany({
        model: AI_MODELS.embedding,
        values: batchTexts,
      });

      for (let j = 0; j < embeddings.length; j++) {
        results[i + j] = embeddings[j] ?? null;
      }
    } catch (err) {
      console.error(
        `[knowledge/ingest] Embedding batch failed (chunks ${i}-${i + batchTexts.length - 1}):`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return results;
}

async function ingestContent(
  sourceId: string,
  organizationId: string,
  content: string
): Promise<number> {
  const chunks = chunkText(content, { maxTokens: 500, overlap: 50 });

  if (chunks.length === 0) {
    throw new Error("No content to process after extraction.");
  }

  // Generate embeddings for all chunks (batched in groups of 20)
  const embeddings = await generateEmbeddingsBatch(chunks);

  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const values = batch.map((chunkContent, idx) => ({
      id: `kc_${nanoid(16)}`,
      sourceId,
      organizationId,
      content: chunkContent,
      embedding: embeddings[i + idx] ?? null,
      chunkIndex: i + idx,
    }));

    await db.insert(knowledgeChunks).values(values);
  }

  return chunks.length;
}

// ---- Route Handler ----------------------------------------------------------

export async function POST(request: Request) {
  // Authenticate via Clerk
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  // Map to internal org ID (same as getAuthOrRedirect)
  const organizationId = "org_demo_123";

  const contentType = request.headers.get("content-type") ?? "";
  let name: string;
  let type: "file" | "url" | "text";
  let content: string;
  let sourceUrl: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      name = (formData.get("name") as string) ?? "";

      if (!file) {
        return NextResponse.json(
          { error: { code: "bad_request", message: "No file provided" } },
          { status: 400 }
        );
      }
      if (!name) name = file.name;

      type = "file";
      content = await extractFileText(file);
    } else {
      let body: { name?: string; url?: string; text?: string };
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: { code: "bad_request", message: "Invalid JSON body" } },
          { status: 400 }
        );
      }

      name = body.name ?? "";

      if (body.url) {
        type = "url";
        sourceUrl = body.url;
        if (!name) name = body.url;

        try {
          new URL(body.url);
        } catch {
          return NextResponse.json(
            { error: { code: "bad_request", message: "Invalid URL format" } },
            { status: 400 }
          );
        }

        content = await fetchUrlContent(body.url);
      } else if (body.text) {
        type = "text";
        content = body.text;
        if (!name) name = "Pasted text";
      } else {
        return NextResponse.json(
          {
            error: {
              code: "bad_request",
              message: "Provide a file, url, or text",
            },
          },
          { status: 400 }
        );
      }
    }

    // DEV_MODE fallback
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        id: `ks_${nanoid(12)}`,
        name,
        type,
        status: "processing",
        chunkCount: 0,
      });
    }

    // Insert record immediately with status: 'processing'
    const sourceId = `ks_${nanoid(12)}`;
    await db.insert(knowledgeSources).values({
      id: sourceId,
      organizationId,
      type,
      name: name.slice(0, 255),
      sourceUrl,
      status: "processing",
    });

    // Run chunking + embedding in the background using Next.js after()
    after(async () => {
      try {
        const chunkCount = await ingestContent(sourceId, organizationId, content);

        await db
          .update(knowledgeSources)
          .set({
            status: "ready",
            chunkCount,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(knowledgeSources.id, sourceId));

        console.log(
          `[knowledge/ingest] Background processing complete: ${sourceId} (${chunkCount} chunks)`
        );
      } catch (err) {
        await db
          .update(knowledgeSources)
          .set({ status: "error", updatedAt: new Date() })
          .where(eq(knowledgeSources.id, sourceId));

        console.error(
          `[knowledge/ingest] Background processing failed for ${sourceId}:`,
          err instanceof Error ? err.message : err
        );
      }
    });

    // Return immediately with 202 Accepted
    return NextResponse.json(
      { id: sourceId, name, type, status: "processing" },
      { status: 202 }
    );
  } catch (err) {
    console.error("[knowledge/ingest] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: { code: "internal_error", message } },
      { status: 500 }
    );
  }
}
