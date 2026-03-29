import { NextRequest, NextResponse } from 'next/server';

/**
 * API app proxy — lightweight protection layer.
 *
 * The API app uses API-key auth (validated per-route in _lib/auth.ts),
 * not Clerk session auth. This proxy:
 *  1. Allows webhook routes through unconditionally (they validate signatures internally)
 *  2. Allows health check through unconditionally
 *  3. Requires an Authorization header or `key` query param on all other routes
 *     (actual key validation still happens in the route handler)
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow webhooks — they validate their own signatures
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // Allow health check
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // For all other API routes, require at least a Bearer token or key param
  const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ');
  const hasKeyParam = request.nextUrl.searchParams.has('key');

  if (!hasAuthHeader && !hasKeyParam) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Missing API key' } },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
