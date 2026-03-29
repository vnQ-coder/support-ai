import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, apiError } from "../../_lib/auth";
import { widgetRatelimit, checkRatelimit } from "../../_lib/ratelimit";
import { buildCorsHeaders, corsOptionsResponse } from "../../_lib/cors";
import { db, widgetConfigs } from "@repo/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Validate API key from query param or header
  const keyParam = request.nextUrl.searchParams.get("key");

  // Build a fake request with the key as auth header for validation
  const authRequest = keyParam
    ? new Request(request.url, {
        headers: { authorization: `Bearer ${keyParam}` },
      })
    : request;

  const auth = await validateApiKey(
    authRequest.headers.has("authorization") ? authRequest : request
  );
  if (!auth) {
    return apiError("unauthorized", "Invalid API key", 401);
  }

  // Rate limit check (by organization ID)
  const rl = await checkRatelimit(widgetRatelimit, `widget:${auth.organizationId}`);
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

  // Default config to return when no DB or no row exists
  const defaultConfig = {
    organizationId: auth.organizationId,
    organizationName: auth.organizationName,
    primaryColor: "#6366f1",
    greeting: "Hi! How can we help you today?",
    placeholder: "Type a message...",
    position: "bottom-right" as const,
    avatarUrl: null,
    showBranding: true,
    features: {
      citations: true,
      handoff: true,
    },
  };

  // DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(defaultConfig, {
      headers: {
        ...buildCorsHeaders(request, []),
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  // Query real widget config from DB
  const rows = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.organizationId, auth.organizationId))
    .limit(1);

  const row = rows[0];
  const allowedDomains = (row?.allowedDomains as string[]) || [];
  const corsHeaders = buildCorsHeaders(request, allowedDomains);

  // Enforce origin restriction when allowedDomains is configured
  if (
    allowedDomains.length > 0 &&
    (corsHeaders as Record<string, string>)["Access-Control-Allow-Origin"] === "null"
  ) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Origin not allowed" } },
      { status: 403, headers: corsHeaders }
    );
  }

  const config = row
    ? {
        organizationId: auth.organizationId,
        organizationName: auth.organizationName,
        primaryColor: row.primaryColor,
        greeting: row.greeting,
        placeholder: row.placeholder,
        position: row.position,
        avatarUrl: null,
        showBranding: row.showBranding,
        features: {
          citations: true,
          handoff: true,
        },
      }
    : defaultConfig;

  return NextResponse.json(config, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request, []);
}
