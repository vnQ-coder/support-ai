import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Creates a rate limiter with graceful degradation.
 * Returns null if Upstash Redis is not configured, allowing requests through.
 */
function createRatelimiter(requests: number, window: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
  });
}

/** 20 chat messages per minute per org */
export const chatRatelimit = createRatelimiter(20, '1 m');

/** 60 widget config requests per minute per org */
export const widgetRatelimit = createRatelimiter(60, '1 m');

/** 100 general API calls per minute per org */
export const apiRatelimit = createRatelimiter(100, '1 m');

/**
 * Check rate limit for a given identifier.
 * Returns { allowed: true } if limiter is null (Upstash not configured) — fail open.
 */
export async function checkRatelimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ allowed: boolean; reset?: number }> {
  if (!limiter) return { allowed: true };

  const { success, reset } = await limiter.limit(identifier);
  return { allowed: success, reset };
}
