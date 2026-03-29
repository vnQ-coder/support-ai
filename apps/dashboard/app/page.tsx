import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const { userId, orgId } = await auth();

  // Not signed in — go to sign-in page
  if (!userId) {
    redirect('/sign-in');
  }

  // Signed in but no active organization — go to org selector
  if (!orgId) {
    redirect('/select-org');
  }

  // Fully authenticated — go to dashboard
  redirect('/overview');
}
