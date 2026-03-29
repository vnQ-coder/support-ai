/**
 * Outbound SMS Reply -- sends an agent's reply via SMS.
 *
 * Called from the dashboard when a human agent replies to an SMS conversation.
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
import { sendSms } from "@repo/ai";
import { validateApiKey, apiError } from "../../../_lib/auth";

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

const sendSmsReplySchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  content: z
    .string()
    .min(1, "content is required")
    .max(1600, "SMS content must be under 1600 characters"),
  agentName: z.string().optional().default("Support Agent"),
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

  const parsed = sendSmsReplySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "bad_request",
      parsed.error.errors[0]?.message ?? "Validation failed",
      400
    );
  }

  const { conversationId, content, agentName } = parsed.data;

  // 3. Verify conversation belongs to the org and is an SMS conversation
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

  if (conversation.channel !== "sms") {
    return apiError(
      "bad_request",
      "This endpoint only supports SMS conversations",
      400
    );
  }

  // 4. Get contact phone number from metadata
  const [contact] = await db
    .select({ id: contacts.id, metadata: contacts.metadata })
    .from(contacts)
    .where(eq(contacts.id, conversation.contactId))
    .limit(1);

  const contactMeta = contact?.metadata as Record<string, unknown> | null;
  const toPhone = contactMeta?.phone as string | undefined;

  if (!toPhone) {
    return apiError("bad_request", "Contact has no phone number", 400);
  }

  // 5. Load SMS config for the org
  const [smsCfg] = await db
    .select()
    .from(smsConfigs)
    .where(eq(smsConfigs.organizationId, auth.organizationId))
    .limit(1);

  const fromNumber = smsCfg?.phoneNumber ?? undefined;

  // 6. Insert agent message
  const messageId = `msg_${generateId()}`;
  await db.insert(messages).values({
    id: messageId,
    conversationId,
    sender: "agent",
    content,
    confidence: null,
    sources: [],
    metadata: {
      channel: "sms",
      agentName,
    },
  });

  // Update conversation
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // 7. Send SMS via Twilio
  const smsResult = await sendSms({
    to: toPhone,
    body: content,
    from: fromNumber,
    accountSid: smsCfg?.twilioAccountSid ?? undefined,
    authToken: smsCfg?.twilioAuthToken ?? undefined,
  });

  // Store Twilio message SID
  if (smsResult) {
    await db
      .update(messages)
      .set({
        metadata: {
          channel: "sms",
          agentName,
          twilioMessageSid: smsResult.sid,
        },
      })
      .where(eq(messages.id, messageId));
  }

  console.log(
    `[sms:send] Sent agent reply: conv=${conversationId} to=${toPhone} sid=${smsResult?.sid ?? "none"}`
  );

  return NextResponse.json({
    ok: true,
    messageId,
    twilioSid: smsResult?.sid ?? null,
  });
}
