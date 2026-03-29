import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';

export default async function SignInPage() {
  const { userId, orgId } = await auth();

  // Already authenticated — redirect away from sign-in to prevent loops
  if (userId) {
    if (!orgId) {
      redirect('/select-org');
    }
    redirect('/overview');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-zinc-900 border-zinc-800',
          },
        }}
      />
    </div>
  );
}
