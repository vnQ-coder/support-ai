import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db, organizations, members, eq } from '@repo/db';
import crypto from 'crypto';

/**
 * Clerk webhook handler — syncs user and organization events to the local
 * database.  The webhook signature is verified using the CLERK_WEBHOOK_SECRET
 * environment variable so that only legitimate Clerk payloads are accepted.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // In development without a webhook secret, log and accept
    console.warn(
      '[clerk-webhook] CLERK_WEBHOOK_SECRET is not set — skipping signature verification',
    );
    const body = await request.json();
    await handleEvent(body);
    return NextResponse.json({ received: true });
  }

  // ----- Verify signature with svix -----
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let payload: Record<string, unknown>;
  try {
    const wh = new Webhook(webhookSecret);
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 },
    );
  }

  await handleEvent(payload);
  return NextResponse.json({ received: true });
}

/** Generate a deterministic UUID-like ID from a prefix and Clerk ID */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(body: any) {
  const eventType = body.type as string | undefined;
  const data = body.data;

  switch (eventType) {
    case 'organization.created': {
      console.log('[clerk-webhook] Org created:', data?.id);
      const orgId = generateId('org');
      await db
        .insert(organizations)
        .values({
          id: orgId,
          clerkOrgId: data.id,
          name: data.name,
          slug: data.slug,
        })
        .onConflictDoUpdate({
          target: organizations.clerkOrgId,
          set: {
            name: data.name,
            slug: data.slug,
            updatedAt: new Date(),
          },
        });
      break;
    }

    case 'organization.updated': {
      console.log('[clerk-webhook] Org updated:', data?.id);
      await db
        .update(organizations)
        .set({
          name: data.name,
          slug: data.slug,
          updatedAt: new Date(),
        })
        .where(eq(organizations.clerkOrgId, data.id));
      break;
    }

    case 'organizationMembership.created': {
      const userData = data.public_user_data;
      const clerkOrgId = data.organization?.id;
      console.log('[clerk-webhook] Member added:', userData?.user_id);

      if (!userData?.user_id || !clerkOrgId) {
        console.warn('[clerk-webhook] Missing user or org data in membership event');
        break;
      }

      // Look up the internal org ID from the Clerk org ID
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.clerkOrgId, clerkOrgId),
      });

      if (!org) {
        console.warn('[clerk-webhook] Org not found for clerkOrgId:', clerkOrgId);
        break;
      }

      const memberId = generateId('mem');
      await db
        .insert(members)
        .values({
          id: memberId,
          organizationId: org.id,
          clerkUserId: userData.user_id,
          role: data.role === 'admin' ? 'admin' : 'agent',
          email: userData.identifier || '',
          name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null,
          avatarUrl: userData.image_url || null,
        })
        .onConflictDoUpdate({
          target: members.id,
          set: {
            role: data.role === 'admin' ? 'admin' : 'agent',
            email: userData.identifier || '',
            name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null,
            avatarUrl: userData.image_url || null,
            updatedAt: new Date(),
          },
        });
      break;
    }

    case 'user.created':
    case 'user.updated': {
      console.log(`[clerk-webhook] User ${eventType === 'user.created' ? 'created' : 'updated'}:`, data?.id);

      // Update name/avatar on any existing member records for this user
      if (data?.id) {
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
        const email = data.email_addresses?.[0]?.email_address;

        await db
          .update(members)
          .set({
            name: fullName,
            avatarUrl: data.image_url || null,
            ...(email ? { email } : {}),
            updatedAt: new Date(),
          })
          .where(eq(members.clerkUserId, data.id));
      }
      break;
    }

    default:
      console.log('[clerk-webhook] Unhandled event:', eventType);
  }
}
