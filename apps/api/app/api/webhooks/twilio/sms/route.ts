/**
 * Inbound SMS Webhook -- receives SMS messages forwarded by Twilio.
 *
 * Flow:
 * 1. Parse form-encoded body from Twilio
 * 2. Validate X-Twilio-Signature header
 * 3. Find the org by looking up smsConfigs matching the "To" number
 * 4. Find or create contact by phone number
 * 5. Find existing conversation or create a new one (channel='sms')
 * 6. Insert user message
 * 7. Trigger AI response via the chat pipeline
 * 8. Send AI response back via Twilio REST API
 * 9. Respond with empty TwiML <Response>
 */

import { NextResponse } from "next/server";
import {
  db,
  contacts,
  conversations,
  messages,
  organizations,
  smsConfigs,
  eq,
  and,
  desc,
} from "@repo/db";
import {
  sendSms,
  buildFullSystemPrompt,
  retrieveContext,
  extractConfidence,
  AI_MODELS,
  AI_CONFIG,
  validateWebhookSignature,
} from "@repo/ai";
import { parseTwilioParams, buildTwimlResponse } from "@repo/shared/twilio";
import { generateText } from "ai";

export const maxDuration = 60;

// ---- Helpers --------------------------------------------------------------

function nanoid(size = 21): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

function generateId(): string {
  return nanoid(24);
}

// ---- Route handler --------------------------------------------------------

export async function POST(request: Request) {
  // 1. Parse form-encoded body
  const rawBody = await request.text();
  const formData = new URLSearchParams(rawBody);
  const params = parseTwilioParams(formData);

  const from = params.From ?? "";
  const to = params.To ?? "";
  const body = params.Body ?? "";
  const messageSid = params.MessageSid ?? "";

  if (!from || !body) {
    return new Response(buildTwimlResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // 2. Find the org by matching the "To" phone number against smsConfigs
  let orgId: string | null = null;
  let orgName = "Support";
  let authToken: string | null = null;
  let orgAccountSid: string | null = null;

  const smsConfigRow = await db
    .select({
      organizationId: smsConfigs.organizationId,
      twilioAccountSid: smsConfigs.twilioAccountSid,
      twilioAuthToken: smsConfigs.twilioAuthToken,
      phoneNumber: smsConfigs.phoneNumber,
      smsEnabled: smsConfigs.smsEnabled,
    })
    .from(smsConfigs)
    .where(eq(smsConfigs.phoneNumber, to))
    .limit(1);

  if (smsConfigRow[0]) {
    if (!smsConfigRow[0].smsEnabled) {
      return new Response(buildTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }
    orgId = smsConfigRow[0].organizationId;
    authToken = smsConfigRow[0].twilioAuthToken;
    orgAccountSid = smsConfigRow[0].twilioAccountSid;
  } else {
    // Fallback: use first organization (single-tenant setups)
    const [firstOrg] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .limit(1);

    if (firstOrg) {
      orgId = firstOrg.id;
      orgName = firstOrg.name;
    }
  }

  if (!orgId) {
    console.warn(`[sms:inbound] No organization found for to=${to}`);
    return new Response(buildTwimlResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // 3. Validate Twilio signature
  const twilioAuthToken =
    authToken ?? process.env.TWILIO_AUTH_TOKEN ?? "";
  const twilioSignature = request.headers.get("x-twilio-signature") ?? "";

  if (twilioAuthToken) {
    // Build the webhook URL from the request
    const webhookUrl =
      process.env.TWILIO_WEBHOOK_BASE_URL
        ? `${process.env.TWILIO_WEBHOOK_BASE_URL}/api/webhooks/twilio/sms`
        : new URL(request.url).toString().split("?")[0]!;

    const isValid = await validateWebhookSignature(
      twilioAuthToken,
      twilioSignature,
      webhookUrl,
      params
    );

    if (!isValid) {
      console.warn("[sms:inbound] Invalid Twilio signature");
      return new Response(buildTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }
  } else if (process.env.NODE_ENV !== "development") {
    console.warn("[sms:inbound] No auth token available for signature verification");
    return new Response(buildTwimlResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Load org name
  const [orgRow] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (orgRow) {
    orgName = orgRow.name;
  }

  // 4. Find or create contact by phone number
  let contactId: string;
  const existingContact = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(
      and(
        eq(contacts.organizationId, orgId),
        // Store phone in metadata; search via metadata
      )
    )
    .limit(100);

  // Find contact whose metadata has this phone number
  let foundContact: string | null = null;
  for (const c of existingContact) {
    // Re-query with metadata check
    const [full] = await db
      .select({ id: contacts.id, metadata: contacts.metadata })
      .from(contacts)
      .where(eq(contacts.id, c.id))
      .limit(1);

    const meta = full?.metadata as Record<string, unknown> | null;
    if (meta?.phone === from) {
      foundContact = full!.id;
      break;
    }
  }

  if (foundContact) {
    contactId = foundContact;
  } else {
    contactId = `contact_${generateId()}`;
    await db.insert(contacts).values({
      id: contactId,
      organizationId: orgId,
      email: null,
      name: null,
      metadata: { phone: from, channel: "sms" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(
      `[sms:inbound] Created contact ${contactId} for ${from}`
    );
  }

  // 5. Find existing SMS conversation or create a new one
  let conversationId: string | null = null;
  let isNewConversation = false;

  // Look for open SMS conversation with this contact
  const existingConvos = await db
    .select({ id: conversations.id, status: conversations.status })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.contactId, contactId),
        eq(conversations.channel, "sms")
      )
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  // Reuse conversation if still active/waiting
  if (
    existingConvos[0] &&
    (existingConvos[0].status === "active" ||
      existingConvos[0].status === "waiting")
  ) {
    conversationId = existingConvos[0].id;
  }

  if (!conversationId) {
    conversationId = `conv_${generateId()}`;
    isNewConversation = true;
    await db.insert(conversations).values({
      id: conversationId,
      organizationId: orgId,
      contactId,
      channel: "sms",
      status: "active",
      subject: null,
      metadata: {
        smsFrom: from,
        smsTo: to,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[sms:inbound] Created conversation ${conversationId}`);
  }

  // 6. Insert the user message
  const userMsgId = `msg_${generateId()}`;
  await db.insert(messages).values({
    id: userMsgId,
    conversationId,
    sender: "user",
    content: body,
    metadata: {
      twilioMessageSid: messageSid,
      channel: "sms",
      from,
      to,
    },
  });

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // 7. Generate AI response
  try {
    const contextChunks = await retrieveContext(body, orgId);
    const system = buildFullSystemPrompt(
      orgName,
      contextChunks.map((c) => ({
        content: c.content,
        sourceName: c.sourceName,
      }))
    );

    const result = await generateText({
      model: AI_MODELS.chat,
      system,
      messages: [{ role: "user" as const, content: body }],
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: AI_CONFIG.maxTokens,
    });

    const aiText = result.text;
    const { confidence, cleanText } = extractConfidence(aiText);

    // Persist AI message
    const aiMsgId = `msg_${generateId()}`;
    await db.insert(messages).values({
      id: aiMsgId,
      conversationId,
      sender: "ai",
      content: cleanText,
      confidence,
      sources: contextChunks.map((c) => c.sourceId),
      metadata: {
        channel: "sms",
      },
    });

    // Update conversation
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // 8. Send AI response via Twilio REST API (async, not TwiML)
    const smsResult = await sendSms({
      to: from,
      body: cleanText,
      from: to,
      accountSid: orgAccountSid ?? undefined,
      authToken: authToken ?? undefined,
    });

    if (smsResult) {
      await db
        .update(messages)
        .set({
          metadata: {
            channel: "sms",
            twilioMessageSid: smsResult.sid,
          },
        })
        .where(eq(messages.id, aiMsgId));
    }

    console.log(
      `[sms:inbound] Processed: org=${orgId} conv=${conversationId} confidence=${confidence.toFixed(2)}`
    );
  } catch (err) {
    console.error("[sms:inbound] AI response generation failed:", err);
    // Message is saved; team can respond manually via dashboard
  }

  // 9. Respond with empty TwiML (we sent the reply via REST API)
  return new Response(buildTwimlResponse(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
