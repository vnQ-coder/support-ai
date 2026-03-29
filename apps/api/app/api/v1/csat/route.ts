import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, conversations, apiKeys, widgetConfigs, eq, and, isNull } from "@repo/db";
import { apiError } from "../_lib/auth";
import { checkRatelimit, apiRatelimit } from "../_lib/ratelimit";
import { buildCorsHeaders, corsOptionsResponse } from "../_lib/cors";

/**
 * Zod schema for CSAT submission request body.
 * - conversationId: UUID of the conversation
 * - score: integer 1-5
 * - widgetKey: the org's API key (sk_live_... or sk_test_...)
 */
const csatBodySchema = z.object({
  conversationId: z.string().uuid("conversationId must be a valid UUID"),
  score: z.number().int().min(1).max(5, "score must be between 1 and 5"),
  widgetKey: z.string().min(1, "widgetKey is required"),
});

/**
 * SHA-256 hash a string and return the hex digest.
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * POST /api/v1/csat
 *
 * Public endpoint (no auth header required). End users submit CSAT scores
 * after a conversation is resolved. The widgetKey is validated against the
 * org that owns the conversation.
 *
 * Rate limited: 1 submission per conversationId (enforced by csatSubmittedAt check).
 */
export async function POST(request: NextRequest) {
  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", "Request body must be valid JSON", 400);
  }

  const parsed = csatBodySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return apiError(
      "validation_error",
      firstError ? firstError.message : "Invalid request body",
      400
    );
  }

  const { conversationId, score, widgetKey } = parsed.data;

  // Rate limit by conversationId to prevent abuse
  const rl = await checkRatelimit(apiRatelimit, `csat:${conversationId}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset! - Date.now()) / 1000)),
          ...buildCorsHeaders(request, []),
        },
      }
    );
  }

  // DEV_MODE fallback: if DATABASE_URL is not set, accept and return ok
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: true },
      { headers: buildCorsHeaders(request, []) }
    );
  }

  // Validate widgetKey: hash it, look up the API key, get the organizationId
  if (!widgetKey.startsWith("sk_live_") && !widgetKey.startsWith("sk_test_")) {
    return apiError("invalid_key", "Invalid widget key format", 401);
  }

  const keyHash = await sha256(widgetKey);

  const keyRows = await db
    .select({
      organizationId: apiKeys.organizationId,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (keyRows.length === 0) {
    return apiError("unauthorized", "Invalid widget key", 401);
  }

  const orgId = keyRows[0]!.organizationId;

  // Look up the org's allowed domains for dynamic CORS
  const configRows = await db
    .select({ allowedDomains: widgetConfigs.allowedDomains })
    .from(widgetConfigs)
    .where(eq(widgetConfigs.organizationId, orgId))
    .limit(1);

  const allowedDomains = (configRows[0]?.allowedDomains as string[]) || [];
  const corsHeaders = buildCorsHeaders(request, allowedDomains);

  // Look up the conversation and verify it belongs to the same org
  const convRows = await db
    .select({
      id: conversations.id,
      organizationId: conversations.organizationId,
      csatSubmittedAt: conversations.csatSubmittedAt,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (convRows.length === 0) {
    return apiError("not_found", "Conversation not found", 404);
  }

  const conv = convRows[0]!;

  // Verify the conversation belongs to the org that owns the widget key
  if (conv.organizationId !== orgId) {
    return apiError("not_found", "Conversation not found", 404);
  }

  // Prevent duplicate submissions
  if (conv.csatSubmittedAt !== null) {
    return apiError(
      "already_submitted",
      "CSAT score has already been submitted for this conversation",
      409
    );
  }

  // Update the conversation with the CSAT score
  await db
    .update(conversations)
    .set({
      csatScore: score,
      csatSubmittedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  return NextResponse.json(
    { ok: true },
    { headers: corsHeaders }
  );
}

/**
 * OPTIONS handler for CORS preflight requests.
 */
export async function OPTIONS(request: NextRequest) {
  // No org context during preflight, so allow all (POST will enforce)
  return corsOptionsResponse(request, []);
}
