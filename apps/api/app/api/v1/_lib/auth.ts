/**
 * API key validation for widget and REST API authentication.
 */

import { NextResponse } from "next/server";
import { db, apiKeys, organizations } from "@repo/db";
import { eq, and, isNull } from "drizzle-orm";

interface AuthResult {
  organizationId: string;
  organizationName: string;
  isLive: boolean;
}

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
 * Validate an API key from the Authorization header.
 * Returns the organization context or null if invalid.
 *
 * 1. Extract prefix from key
 * 2. Hash key with SHA-256
 * 3. Query api_keys table for matching key_hash where revoked_at IS NULL
 * 4. Return organizationId from the matched row
 */
export async function validateApiKey(
  request: Request
): Promise<AuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith("sk_live_") && !apiKey.startsWith("sk_test_")) {
    return null;
  }

  const isLive = apiKey.startsWith("sk_live_");

  // DEV_MODE fallback: if DATABASE_URL is not set, return demo org
  if (!process.env.DATABASE_URL) {
    return {
      organizationId: "org_demo_123",
      organizationName: "Demo Company",
      isLive,
    };
  }

  // Hash the key and look it up
  const keyHash = await sha256(apiKey);

  const result = await db
    .select({
      keyId: apiKeys.id,
      organizationId: apiKeys.organizationId,
      isLive: apiKeys.isLive,
      organizationName: organizations.name,
    })
    .from(apiKeys)
    .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0]!;

  // Update lastUsedAt in the background (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.keyId))
    .then(() => {})
    .catch(() => {});

  return {
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    isLive: row.isLive,
  };
}

/**
 * Validate the request Origin against the widget's allowed domains.
 */
export function validateOrigin(
  request: Request,
  allowedDomains: string[]
): boolean {
  if (allowedDomains.length === 0) return true; // empty = allow all

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originHost = new URL(origin).hostname;
    return allowedDomains.some(
      (domain) => originHost === domain || originHost.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Create a standardized error response.
 */
export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}
