/**
 * Rate limiting utility using Upstash Redis.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Fails open — if Redis is unavailable, requests are allowed through.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy init — only creates when first called (handles missing env gracefully)
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

/**
 * Widget/chat endpoints — 60 requests/min per org
 */
export const widgetRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:widget",
  analytics: true,
});

/**
 * REST API endpoints — 100 requests/min per API key
 */
export const apiRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:api",
  analytics: true,
});

/**
 * Webhook endpoints — 200 requests/min per source IP
 */
export const webhookRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(200, "1 m"),
  prefix: "rl:webhook",
  analytics: true,
});

/**
 * Apply a rate limit check. Returns a 429 Response if exceeded, null if OK.
 * Fails open — if Redis is unavailable, returns null (allows request through).
 *
 * Usage:
 *   const limited = await checkRateLimit(widgetRateLimit, orgId);
 *   if (limited) return limited;
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<Response | null> {
  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return Response.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please slow down.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(retryAfter),
          },
        }
      );
    }
  } catch {
    // If Redis is unavailable, fail open (don't block requests)
    console.warn("[rate-limit] Redis unavailable, skipping rate limit check");
  }

  return null;
}
