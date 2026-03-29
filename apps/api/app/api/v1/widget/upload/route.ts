import { NextRequest } from "next/server";
import { validateApiKey, validateSessionToken, apiError } from "../../_lib/auth";
import { buildCorsHeaders, corsOptionsResponse } from "../../_lib/cors";

// Simple in-memory rate limiter (per org, 20 uploads per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20;

function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(orgId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(orgId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request, []);
}

export async function POST(request: NextRequest) {
  // --- Auth: accept either API key or session token ---
  const auth = await validateApiKey(request);
  let orgId: string | null = auth?.organizationId ?? null;

  if (!orgId) {
    const sessionToken = request.headers.get("x-session-token");
    if (sessionToken) {
      const session = await validateSessionToken(sessionToken);
      orgId = session?.orgId ?? null;
    }
  }

  const corsHeaders = buildCorsHeaders(request, []);

  if (!orgId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Valid API key or session token required" } },
      { status: 401, headers: corsHeaders }
    );
  }

  // Rate limit
  if (!checkRateLimit(orgId)) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Too many uploads. Try again later." } },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400, headers: corsHeaders });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 5MB)" }, { status: 400, headers: corsHeaders });
    }

    // Validate content type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "File type not allowed" }, { status: 400, headers: corsHeaders });
    }

    // For now, return a placeholder — Vercel Blob integration can be added later
    // This establishes the API contract
    const url = `https://placeholder.blob.vercel-storage.com/${Date.now()}-${file.name}`;

    return Response.json(
      {
        url,
        type: file.type.startsWith("image/") ? "image" : "file",
        name: file.name,
      },
      { headers: corsHeaders }
    );
  } catch {
    return Response.json(
      { error: "Upload failed" },
      { status: 500, headers: buildCorsHeaders(request, []) }
    );
  }
}
