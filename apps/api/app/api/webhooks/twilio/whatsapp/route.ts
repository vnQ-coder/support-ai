/**
 * Inbound WhatsApp Webhook -- receives WhatsApp messages forwarded by Twilio.
 *
 * Flow mirrors the SMS webhook but uses the whatsapp: prefix on numbers
 * and the "whatsapp" channel type for conversations.
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
  sendWhatsApp,
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

/**
 * Strip the "whatsapp:" prefix from a phone number.
 */
function stripWhatsAppPrefix(number: string): string {
  return number.startsWith("whatsapp:") ? number.slice(9) : number;
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

  // Strip whatsapp: prefix for DB lookups
  const fromPhone = stripWhatsAppPrefix(from);
  const toPhone = stripWhatsAppPrefix(to);

  // 2. Find the org by matching the "To" number against smsConfigs.whatsappNumber
  let orgId: string | null = null;
  let orgName = "Support";
  let authToken: string | null = null;
  let orgAccountSid: string | null = null;
  let orgWhatsAppNumber: string | null = null;

  const smsConfigRow = await db
    .select({
      organizationId: smsConfigs.organizationId,
      twilioAccountSid: smsConfigs.twilioAccountSid,
      twilioAuthToken: smsConfigs.twilioAuthToken,
      whatsappNumber: smsConfigs.whatsappNumber,
      whatsappEnabled: smsConfigs.whatsappEnabled,
    })
    .from(smsConfigs)
    .where(eq(smsConfigs.whatsappNumber, toPhone))
    .limit(1);

  if (smsConfigRow[0]) {
    if (!smsConfigRow[0].whatsappEnabled) {
      return new Response(buildTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }
    orgId = smsConfigRow[0].organizationId;
    authToken = smsConfigRow[0].twilioAuthToken;
    orgAccountSid = smsConfigRow[0].twilioAccountSid;
    orgWhatsAppNumber = smsConfigRow[0].whatsappNumber;
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
    console.warn(`[whatsapp:inbound] No organization found for to=${to}`);
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
    const webhookUrl =
      process.env.TWILIO_WEBHOOK_BASE_URL
        ? `${process.env.TWILIO_WEBHOOK_BASE_URL}/api/webhooks/twilio/whatsapp`
        : new URL(request.url).toString().split("?")[0]!;

    const isValid = await validateWebhookSignature(
      twilioAuthToken,
      twilioSignature,
      webhookUrl,
      params
    );

    if (!isValid) {
      console.warn("[whatsapp:inbound] Invalid Twilio signature");
      return new Response(buildTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }
  } else if (process.env.NODE_ENV !== "development") {
    console.warn(
      "[whatsapp:inbound] No auth token available for signature verification"
    );
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
  const existingContacts = await db
    .select({ id: contacts.id, metadata: contacts.metadata })
    .from(contacts)
    .where(eq(contacts.organizationId, orgId))
    .limit(200);

  let foundContact: string | null = null;
  for (const c of existingContacts) {
    const meta = c.metadata as Record<string, unknown> | null;
    if (meta?.phone === fromPhone) {
      foundContact = c.id;
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
      metadata: { phone: fromPhone, channel: "whatsapp" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(
      `[whatsapp:inbound] Created contact ${contactId} for ${fromPhone}`
    );
  }

  // 5. Find existing WhatsApp conversation or create a new one
  let conversationId: string | null = null;

  const existingConvos = await db
    .select({ id: conversations.id, status: conversations.status })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.contactId, contactId),
        eq(conversations.channel, "whatsapp")
      )
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  if (
    existingConvos[0] &&
    (existingConvos[0].status === "active" ||
      existingConvos[0].status === "waiting")
  ) {
    conversationId = existingConvos[0].id;
  }

  if (!conversationId) {
    conversationId = `conv_${generateId()}`;
    await db.insert(conversations).values({
      id: conversationId,
      organizationId: orgId,
      contactId,
      channel: "whatsapp",
      status: "active",
      subject: null,
      metadata: {
        whatsappFrom: fromPhone,
        whatsappTo: toPhone,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[whatsapp:inbound] Created conversation ${conversationId}`);
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
      channel: "whatsapp",
      from: fromPhone,
      to: toPhone,
    },
  });

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
        channel: "whatsapp",
      },
    });

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // 8. Send AI response via Twilio REST API
    const whatsAppResult = await sendWhatsApp({
      to: fromPhone,
      body: cleanText,
      from: orgWhatsAppNumber ?? toPhone,
      accountSid: orgAccountSid ?? undefined,
      authToken: authToken ?? undefined,
    });

    if (whatsAppResult) {
      await db
        .update(messages)
        .set({
          metadata: {
            channel: "whatsapp",
            twilioMessageSid: whatsAppResult.sid,
          },
        })
        .where(eq(messages.id, aiMsgId));
    }

    console.log(
      `[whatsapp:inbound] Processed: org=${orgId} conv=${conversationId} confidence=${confidence.toFixed(2)}`
    );
  } catch (err) {
    console.error(
      "[whatsapp:inbound] AI response generation failed:",
      err
    );
  }

  // 9. Respond with empty TwiML
  return new Response(buildTwimlResponse(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
