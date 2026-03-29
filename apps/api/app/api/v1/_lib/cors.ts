/**
 * Shared CORS utility for widget and public API endpoints.
 *
 * Implements dynamic origin validation against per-tenant allowed domains.
 * When no domains are configured, falls back to wildcard (backward compat).
 */

/**
 * Build CORS headers for a request based on the tenant's allowed domains.
 *
 * Security notes:
 * - When allowedDomains is empty, uses wildcard (backward compat during setup).
 * - When populated, validates the Origin against the allowlist.
 * - Subdomain matching: "example.com" also allows "sub.example.com".
 * - Sets Vary: Origin when reflecting a specific origin (cache correctness).
 * - Sets Access-Control-Allow-Credentials only for specific origins (not wildcard).
 */
export function buildCorsHeaders(
  request: Request,
  allowedDomains: string[]
): HeadersInit {
  const origin = request.headers.get("origin");

  // If no domains configured, allow all (backward compat for setup period)
  if (!allowedDomains || allowedDomains.length === 0) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  // Validate origin is present
  if (!origin) {
    return { "Access-Control-Allow-Origin": "null" };
  }

  let originHost: string;
  try {
    originHost = new URL(origin).origin;
  } catch {
    return { "Access-Control-Allow-Origin": "null" };
  }

  // Check if origin matches any allowed domain
  const isAllowed = allowedDomains.some((domain) => {
    // Strip protocol if present for hostname comparison
    const domainHost = domain.replace(/^https?:\/\//, "");
    let originHostname: string;
    try {
      originHostname = new URL(origin).hostname;
    } catch {
      return false;
    }
    return (
      originHost === domain ||
      originHostname === domainHost ||
      originHostname.endsWith(`.${domainHost}`)
    );
  });

  if (isAllowed) {
    return {
      "Access-Control-Allow-Origin": originHost,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      Vary: "Origin",
    };
  }

  // Origin not allowed
  return { "Access-Control-Allow-Origin": "null" };
}

/**
 * Return a 204 preflight response with CORS headers.
 */
export function corsOptionsResponse(
  request: Request,
  allowedDomains: string[]
): Response {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request, allowedDomains),
  });
}
