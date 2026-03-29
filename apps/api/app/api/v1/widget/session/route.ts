/**
 * POST /api/v1/widget/session
 *
 * Exchanges a valid API key for a short-lived session token.
 * The widget uses this token for subsequent chat requests so the
 * raw API key is not sent on every message.
 *
 * Flow:
 *   1. Widget sends { apiKey } in the POST body
 *   2. Server validates the key, looks up org and allowed domains
 *   3. Returns { token, expiresAt } with dynamic CORS headers
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  validateApiKey,
  createSessionToken,
  apiError,
} from "../../_lib/auth";
import { buildCorsHeaders, corsOptionsResponse } from "../../_lib/cors";
import { checkRatelimit, widgetRatelimit } from "../../_lib/ratelimit";
import { db, widgetConfigs, eq } from "@repo/db";

const sessionBodySchema = z.object({
  apiKey: z.string().min(1, "apiKey is required"),
});

export async function OPTIONS(request: Request) {
  // During preflight we don't know the org yet, so allow all.
  // The actual POST will enforce domain restrictions.
  return corsOptionsResponse(request, []);
}

export async function POST(request: Request) {
  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", "Request body must be valid JSON", 400);
  }

  const parsed = sessionBodySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return apiError(
      "validation_error",
      firstError ? firstError.message : "Invalid request body",
      400
    );
  }

  const { apiKey } = parsed.data;

  // Build a synthetic request with the key as Authorization header
  const authRequest = new Request(request.url, {
    headers: { authorization: `Bearer ${apiKey}` },
  });

  const auth = await validateApiKey(authRequest);
  if (!auth) {
    return apiError("unauthorized", "Invalid API key", 401);
  }

  // Rate limit by org
  const rl = await checkRatelimit(
    widgetRatelimit,
    `session:${auth.organizationId}`
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset! - Date.now()) / 1000)),
        },
      }
    );
  }

  // Look up allowed domains for CORS
  let domains: string[] = [];
  if (process.env.DATABASE_URL) {
    const config = await db
      .select({ allowedDomains: widgetConfigs.allowedDomains })
      .from(widgetConfigs)
      .where(eq(widgetConfigs.organizationId, auth.organizationId))
      .limit(1);

    domains = (config[0]?.allowedDomains as string[]) || [];
  }

  const corsHeaders = buildCorsHeaders(request, domains);

  // Validate origin against allowed domains
  if (domains.length > 0 && (corsHeaders as Record<string, string>)["Access-Control-Allow-Origin"] === "null") {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Origin not allowed" } },
      { status: 403, headers: corsHeaders }
    );
  }

  const { token, expiresAt } = await createSessionToken(auth.organizationId);

  return NextResponse.json(
    { token, expiresAt },
    { headers: corsHeaders }
  );
}
