import { NextResponse, after } from "next/server";
import { embedMany } from "ai";
import { validateApiKey, apiError } from "../_lib/auth";
import {
  db,
  knowledgeSources,
  knowledgeChunks,
} from "@repo/db";
import { chunkText, AI_MODELS } from "@repo/ai";
import { eq, and, desc, isNull } from "drizzle-orm";

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

/**
 * Fetch a URL and extract its text content.
 * Strips HTML tags for a basic plain-text extraction.
 */
async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SupportAI-Bot/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Strip HTML tags, decode entities, normalize whitespace
  const text = html
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

  return text;
}

/**
 * Extract text from an uploaded file (supports .txt, .md, .pdf placeholder, .docx placeholder).
 */
async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }

  if (name.endsWith(".pdf") || name.endsWith(".docx")) {
    // For now, read as text — full PDF/DOCX parsing would require
    // additional libraries (pdf-parse, mammoth). In production, use
    // a document processing pipeline.
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
      // If the entire batch fails, leave those embeddings as null
      // rather than failing the whole ingestion
      console.error(
        `[knowledge] Embedding batch failed (chunks ${i}-${i + batchTexts.length - 1}):`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return results;
}

/**
 * Process content into chunks, generate embeddings, and insert into the database.
 */
async function ingestContent(
  sourceId: string,
  organizationId: string,
  content: string
): Promise<number> {
  const chunks = chunkText(content, { maxTokens: 500, overlap: 50 });

  if (chunks.length === 0) {
    throw new Error("No content to process — the text was empty after extraction.");
  }

  // Generate embeddings for all chunks (batched in groups of 20)
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Batch insert chunks with embeddings (up to 50 at a time to avoid query size limits)
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

// ---- POST: Create a new knowledge source ------------------------------------

export async function POST(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let name: string;
  let type: "file" | "url" | "text";
  let content: string;
  let sourceUrl: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      // ---- File upload ----
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      name = (formData.get("name") as string) ?? "";

      if (!file) {
        return apiError("bad_request", "No file provided", 400);
      }
      if (!name) {
        name = file.name;
      }

      type = "file";
      content = await extractFileText(file);
    } else {
      // ---- JSON body (url or text) ----
      let body: { name?: string; url?: string; text?: string };
      try {
        body = await request.json();
      } catch {
        return apiError("bad_request", "Invalid JSON body", 400);
      }

      name = body.name ?? "";

      if (body.url) {
        type = "url";
        sourceUrl = body.url;
        if (!name) name = body.url;

        // Validate URL format
        try {
          new URL(body.url);
        } catch {
          return apiError("bad_request", "Invalid URL format", 400);
        }

        content = await fetchUrlContent(body.url);
      } else if (body.text) {
        type = "text";
        content = body.text;
        if (!name) name = "Pasted text";
      } else {
        return apiError(
          "bad_request",
          "Provide either a file upload, a url, or text content",
          400
        );
      }
    }

    if (!name.trim()) {
      return apiError("bad_request", "Name is required", 400);
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

    // Create the knowledge source record with status: 'processing'
    const sourceId = `ks_${nanoid(12)}`;
    await db.insert(knowledgeSources).values({
      id: sourceId,
      organizationId: auth.organizationId,
      type,
      name: name.slice(0, 255),
      sourceUrl,
      status: "processing",
    });

    // Run the heavy processing (chunking + embedding) in the background
    // using Next.js after() so we can return immediately
    after(async () => {
      try {
        const chunkCount = await ingestContent(
          sourceId,
          auth.organizationId,
          content
        );

        // Mark as ready
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
          `[knowledge] Background ingestion complete: ${sourceId} (${chunkCount} chunks)`
        );
      } catch (err) {
        // Mark source as error
        await db
          .update(knowledgeSources)
          .set({
            status: "error",
            updatedAt: new Date(),
          })
          .where(eq(knowledgeSources.id, sourceId));

        console.error(
          `[knowledge] Background ingestion failed for ${sourceId}:`,
          err instanceof Error ? err.message : err
        );
      }
    });

    // Return immediately with 202 Accepted
    return NextResponse.json(
      {
        id: sourceId,
        name,
        type,
        status: "processing",
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("[knowledge] Ingestion error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return apiError("internal_error", message, 500);
  }
}

// ---- GET: List knowledge sources --------------------------------------------

export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  // DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      sources: [
        {
          id: "ks_demo_1",
          name: "Product Docs",
          type: "file",
          status: "ready",
          chunkCount: 42,
          lastSyncedAt: new Date().toISOString(),
        },
      ],
    });
  }

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
        eq(knowledgeSources.organizationId, auth.organizationId),
        isNull(knowledgeSources.deletedAt)
      )
    )
    .orderBy(desc(knowledgeSources.createdAt));

  return NextResponse.json({
    sources: rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      sourceUrl: row.sourceUrl,
      chunkCount: row.chunkCount,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

// ---- DELETE: Remove a knowledge source and its chunks -----------------------

export async function DELETE(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  let body: { sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  if (!body.sourceId || typeof body.sourceId !== "string") {
    return apiError("bad_request", "sourceId is required", 400);
  }

  // DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ deleted: true });
  }

  // Verify ownership
  const source = await db
    .select({ id: knowledgeSources.id })
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.id, body.sourceId),
        eq(knowledgeSources.organizationId, auth.organizationId),
        isNull(knowledgeSources.deletedAt)
      )
    )
    .limit(1);

  if (source.length === 0) {
    return apiError("not_found", "Knowledge source not found", 404);
  }

  // Hard delete chunks, soft delete source
  await db
    .delete(knowledgeChunks)
    .where(eq(knowledgeChunks.sourceId, body.sourceId));

  await db
    .update(knowledgeSources)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      chunkCount: 0,
    })
    .where(eq(knowledgeSources.id, body.sourceId));

  return NextResponse.json({ deleted: true });
}

// ---- OPTIONS: CORS preflight ------------------------------------------------

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
