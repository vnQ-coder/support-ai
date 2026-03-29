import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db, organizations, eq } from '@repo/db';

/**
 * Retrieve the current authenticated user or redirect to sign-in.
 *
 * Returns Clerk identifiers plus an internal org ID that can be used
 * to scope every database query to the correct tenant.
 */
export async function getAuthOrRedirect() {
  const { userId, orgId, orgSlug } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!orgId) {
    // User is signed in but has no active organization — redirect to org selection
    redirect('/select-org');
  }

  // Look up the internal org UUID from the Clerk org ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, orgId),
  });

  if (!org) {
    // Org not yet synced (webhook may not have fired yet) — redirect to onboarding
    redirect('/onboarding');
  }

  return {
    userId,
    orgId: orgId,
    orgSlug: orgSlug || org.slug,
    internalOrgId: org.id,
  };
}
