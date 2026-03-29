/**
 * Outbound WhatsApp Reply -- sends an agent's reply via WhatsApp.
 *
 * Called from the dashboard when a human agent replies to a WhatsApp conversation.
 * Authenticated via API key (same as other v1 routes).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  db,
  conversations,
  contacts,
  messages,
  smsConfigs,
  eq,
  and,
} from "@repo/db";
import { sendWhatsApp } from "@repo/ai";
import { validateApiKey, apiError } from "../../_lib/auth";

// ---- Helpers --------------------------------------------------------------

function generateId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  for (let i = 0; i < 24; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

// ---- Request schema -------------------------------------------------------

const sendWhatsAppReplySchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  message: z
    .string()
    .min(1, "message is required")
    .max(4096, "WhatsApp message must be under 4096 characters"),
  to: z
    .string()
    .min(1, "to is required")
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "to must be a valid E.164 phone number (e.g. +15551234567)"
    ),
});

// ---- Route handler --------------------------------------------------------

export async function POST(request: Request) {
  // 1. Validate API key
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  const parsed = sendWhatsAppReplySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "bad_request",
      parsed.error.errors[0]?.message ?? "Validation failed",
      400
    );
  }

  const { conversationId, message, to } = parsed.data;

  // 3. Verify conversation belongs to the org and is a WhatsApp conversation
  const [conversation] = await db
    .select({
      id: conversations.id,
      channel: conversations.channel,
      contactId: conversations.contactId,
      organizationId: conversations.organizationId,
      metadata: conversations.metadata,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.organizationId, auth.organizationId)
      )
    )
    .limit(1);

  if (!conversation) {
    return apiError("not_found", "Conversation not found", 404);
  }

  if (conversation.channel !== "whatsapp") {
    return apiError(
      "bad_request",
      "This endpoint only supports WhatsApp conversations",
      400
    );
  }

  // 4. Verify the contact exists
  const [contact] = await db
    .select({ id: contacts.id, metadata: contacts.metadata })
    .from(contacts)
    .where(eq(contacts.id, conversation.contactId))
    .limit(1);

  if (!contact) {
    return apiError("bad_request", "Contact not found for this conversation", 400);
  }

  // 5. Load SMS/WhatsApp config for the org
  const [smsCfg] = await db
    .select()
    .from(smsConfigs)
    .where(eq(smsConfigs.organizationId, auth.organizationId))
    .limit(1);

  const fromNumber = smsCfg?.whatsappNumber ?? smsCfg?.phoneNumber ?? undefined;

  // 6. Insert agent message
  const messageId = `msg_${generateId()}`;
  await db.insert(messages).values({
    id: messageId,
    conversationId,
    sender: "agent",
    content: message,
    confidence: null,
    sources: [],
    metadata: {
      channel: "whatsapp",
      to,
    },
  });

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // 7. Send WhatsApp message via Twilio
  const whatsAppResult = await sendWhatsApp({
    to,
    body: message,
    from: fromNumber,
    accountSid: smsCfg?.twilioAccountSid ?? undefined,
    authToken: smsCfg?.twilioAuthToken ?? undefined,
  });

  // Store Twilio message SID on the message record
  if (whatsAppResult) {
    await db
      .update(messages)
      .set({
        metadata: {
          channel: "whatsapp",
          to,
          twilioMessageSid: whatsAppResult.sid,
        },
      })
      .where(eq(messages.id, messageId));
  }

  console.log(
    `[whatsapp:send] Sent agent reply: conv=${conversationId} to=${to} sid=${whatsAppResult?.sid ?? "none"}`
  );

  return NextResponse.json({
    ok: true,
    messageId,
    twilioSid: whatsAppResult?.sid ?? null,
  });
}
