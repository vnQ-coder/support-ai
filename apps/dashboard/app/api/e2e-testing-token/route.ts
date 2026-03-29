// TEMPORARY: E2E testing route - delete after testing
export async function GET(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: 'No CLERK_SECRET_KEY' }, { status: 500 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'token';

  if (action === 'token') {
    const res = await fetch('https://api.clerk.com/v1/testing_tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return Response.json(data);
  }

  if (action === 'create-user') {
    const username = url.searchParams.get('username') || 'e2euser' + Date.now();
    const email = url.searchParams.get('email') || `${username}@test.com`;
    const password = url.searchParams.get('password') || 'E2Etest#2026!';

    const res = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email_address: [email],
        password,
        skip_password_checks: true,
      }),
    });
    const data = await res.json();
    return Response.json(data);
  }

  if (action === 'sign-in-token') {
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        expires_in_seconds: 300,
      }),
    });
    const data = await res.json();
    return Response.json(data);
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
