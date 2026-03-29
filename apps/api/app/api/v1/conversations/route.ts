import { NextResponse } from "next/server";
import { validateApiKey, apiError } from "../_lib/auth";
import { db, conversations, contacts, messages } from "@repo/db";
import { eq, and, desc } from "drizzle-orm";

function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

export async function POST(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  let body: {
    conversationId?: string;
    visitorId?: string;
    visitorEmail?: string;
    visitorName?: string;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    const conversationId = body.conversationId ?? `conv_${Date.now()}`;
    return NextResponse.json(
      { conversationId, messages: [] },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // If conversationId provided, validate it belongs to org and return messages
  if (body.conversationId) {
    const convRows = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, body.conversationId),
          eq(conversations.organizationId, auth.organizationId)
        )
      )
      .limit(1);

    if (convRows.length === 0) {
      return apiError("not_found", "Conversation not found", 404);
    }

    const existingMessages = await db
      .select({
        id: messages.id,
        sender: messages.sender,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, body.conversationId))
      .orderBy(messages.createdAt);

    return NextResponse.json(
      {
        conversationId: body.conversationId,
        messages: existingMessages.map((m) => ({
          id: m.id,
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Create new conversation + find or create anonymous contact
  const contactId = `contact_${nanoid(12)}`;
  const conversationId = `conv_${nanoid(12)}`;

  // Find or create contact
  let existingContactId: string | null = null;

  if (body.visitorEmail) {
    const existingContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.organizationId, auth.organizationId),
          eq(contacts.email, body.visitorEmail)
        )
      )
      .limit(1);

    if (existingContacts.length > 0) {
      existingContactId = existingContacts[0]!.id;
    }
  }

  const finalContactId = existingContactId ?? contactId;

  if (!existingContactId) {
    await db.insert(contacts).values({
      id: finalContactId,
      organizationId: auth.organizationId,
      email: body.visitorEmail ?? null,
      name: body.visitorName ?? "Anonymous Visitor",
    });
  }

  await db.insert(conversations).values({
    id: conversationId,
    organizationId: auth.organizationId,
    contactId: finalContactId,
    channel: "web_chat",
    status: "active",
  });

  return NextResponse.json(
    { conversationId, messages: [] },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
