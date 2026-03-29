/**
 * Inbound Email Webhook — receives emails forwarded by Resend.
 *
 * Flow:
 * 1. Verify webhook signature (RESEND_WEBHOOK_SECRET)
 * 2. Parse sender, subject, body from the payload
 * 3. Find or create the contact by email address
 * 4. Find existing conversation or create a new one (channel='email')
 * 5. Insert user message with email metadata
 * 6. Send auto-reply acknowledgment (if enabled)
 * 7. Trigger AI response via the chat pipeline
 * 8. Send AI response back via email
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  db,
  contacts,
  conversations,
  messages,
  organizations,
  emailConfigs,
  eq,
  and,
  desc,
} from "@repo/db";
import {
  sendEmail,
  sendAutoReply,
  buildAIResponseEmail,
  buildFullSystemPrompt,
  retrieveContext,
  extractConfidence,
  AI_MODELS,
  AI_CONFIG,
} from "@repo/ai";
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
 * Strip quoted reply content from email body.
 * Removes text after common reply markers ("On ... wrote:", "> ", etc.).
 */
function stripQuotedReply(text: string): string {
  // Match "On <date> <name> wrote:" pattern
  const onWrotePattern = /\n\s*On .+wrote:\s*$/ms;
  const stripped = text.split(onWrotePattern)[0] ?? text;

  // Also remove lines starting with ">"
  const lines = stripped.split("\n");
  const cleaned: string[] = [];
  for (const line of lines) {
    if (line.startsWith(">")) break;
    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

// ---- Webhook signature verification --------------------------------------

async function verifyWebhookSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // In development, skip verification if no secret is configured
    if (process.env.NODE_ENV === "development") {
      console.warn("[email:inbound] No RESEND_WEBHOOK_SECRET set — skipping signature verification");
      return true;
    }
    return false;
  }

  const signature = request.headers.get("svix-signature");
  const messageId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");

  if (!signature || !messageId || !timestamp) {
    return false;
  }

  // Verify timestamp is within 5 minutes to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  // Svix signature verification
  try {
    const signedContent = `${messageId}.${timestamp}.${body}`;
    const secretBytes = Uint8Array.from(
      atob(secret.startsWith("whsec_") ? secret.slice(6) : secret),
      (c) => c.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedContent)
    );

    const expectedSignature = `v1,${btoa(
      String.fromCharCode(...new Uint8Array(signatureBytes))
    )}`;

    // Check against all provided signatures (comma-separated)
    const signatures = signature.split(" ");
    return signatures.some((sig) => sig === expectedSignature);
  } catch (err) {
    console.error("[email:inbound] Signature verification failed:", err);
    return false;
  }
}

// ---- Inbound email payload schema -----------------------------------------

const inboundEmailSchema = z.object({
  type: z.string(),
  data: z.object({
    from: z.string().email(),
    to: z.union([z.string().email(), z.array(z.string().email())]),
    subject: z.string().default("(No subject)"),
    text: z.string().optional(),
    html: z.string().optional(),
    message_id: z.string().optional(),
    in_reply_to: z.string().optional(),
    references: z.union([z.string(), z.array(z.string())]).optional(),
    // Headers for organization routing
    headers: z
      .array(z.object({ name: z.string(), value: z.string() }))
      .optional(),
  }),
});

// ---- Route handler --------------------------------------------------------

export async function POST(request: Request) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text();

  // 2. Verify webhook signature
  const isValid = await verifyWebhookSignature(request, rawBody);
  if (!isValid) {
    console.warn("[email:inbound] Invalid webhook signature");
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Invalid webhook signature" } },
      { status: 401 }
    );
  }

  // 3. Parse payload
  let payload: z.infer<typeof inboundEmailSchema>;
  try {
    const json = JSON.parse(rawBody);
    const parsed = inboundEmailSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[email:inbound] Invalid payload:", parsed.error.errors);
      return NextResponse.json(
        { error: { code: "bad_request", message: "Invalid email payload" } },
        { status: 400 }
      );
    }
    payload = parsed.data;
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  // Only process email.received events
  if (payload.type !== "email.received") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const emailData = payload.data;
  const senderEmail = emailData.from;
  const subject = emailData.subject;
  const bodyText = emailData.text
    ? stripQuotedReply(emailData.text)
    : "(No text content)";
  const messageIdHeader = emailData.message_id ?? null;

  // Normalize references to array
  const referencesArray: string[] = emailData.references
    ? Array.isArray(emailData.references)
      ? emailData.references
      : emailData.references.split(/\s+/)
    : [];

  // 4. Determine the target organization
  //    Route based on the "to" address — look up emailConfigs where fromAddress matches
  const toAddress = Array.isArray(emailData.to)
    ? emailData.to[0]!
    : emailData.to;

  let orgId: string | null = null;
  let orgName = "Support";

  // Try to find org by email config from address
  const emailConfigRow = await db
    .select({
      organizationId: emailConfigs.organizationId,
    })
    .from(emailConfigs)
    .where(eq(emailConfigs.fromAddress, toAddress))
    .limit(1);

  if (emailConfigRow[0]) {
    orgId = emailConfigRow[0].organizationId;
  } else {
    // Fallback: use first organization (for single-tenant setups)
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
    console.warn(`[email:inbound] No organization found for to=${toAddress}`);
    return NextResponse.json({ ok: true, skipped: true, reason: "no_org" });
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

  // 5. Find or create contact
  let contactId: string;
  const existingContact = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(
      and(eq(contacts.organizationId, orgId), eq(contacts.email, senderEmail))
    )
    .limit(1);

  if (existingContact[0]) {
    contactId = existingContact[0].id;
  } else {
    contactId = `contact_${generateId()}`;
    await db.insert(contacts).values({
      id: contactId,
      organizationId: orgId,
      email: senderEmail,
      name: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[email:inbound] Created contact ${contactId} for ${senderEmail}`);
  }

  // 6. Find existing email conversation or create a new one
  //    Thread by in_reply_to: look for a conversation whose metadata has
  //    a matching emailMessageId
  let conversationId: string | null = null;
  let isNewConversation = false;

  if (emailData.in_reply_to) {
    // Search for conversation with matching email message ID in metadata
    const existingConvos = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.organizationId, orgId),
          eq(conversations.contactId, contactId),
          eq(conversations.channel, "email")
        )
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(20);

    // Check metadata for matching email message IDs
    for (const convo of existingConvos) {
      const convoMessages = await db
        .select({ metadata: messages.metadata })
        .from(messages)
        .where(eq(messages.conversationId, convo.id))
        .limit(50);

      for (const msg of convoMessages) {
        const meta = msg.metadata as Record<string, unknown> | null;
        if (meta?.emailMessageId === emailData.in_reply_to) {
          conversationId = convo.id;
          break;
        }
      }
      if (conversationId) break;
    }
  }

  if (!conversationId) {
    // Create new conversation
    conversationId = `conv_${generateId()}`;
    isNewConversation = true;
    await db.insert(conversations).values({
      id: conversationId,
      organizationId: orgId,
      contactId,
      channel: "email",
      status: "active",
      subject: subject,
      metadata: {
        emailFrom: senderEmail,
        emailTo: toAddress,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[email:inbound] Created conversation ${conversationId}`);
  }

  // 7. Insert the user message
  const userMsgId = `msg_${generateId()}`;
  await db.insert(messages).values({
    id: userMsgId,
    conversationId,
    sender: "user",
    content: bodyText,
    metadata: {
      emailMessageId: messageIdHeader,
      emailSubject: subject,
      emailFrom: senderEmail,
      channel: "email",
    },
  });

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // 8. Load email config for auto-reply settings
  const [emailCfg] = await db
    .select()
    .from(emailConfigs)
    .where(eq(emailConfigs.organizationId, orgId))
    .limit(1);

  const fromAddress = emailCfg?.fromAddress
    ? `${emailCfg.fromName ?? orgName} <${emailCfg.fromAddress}>`
    : undefined;

  // 9. Send auto-reply if enabled and this is a new conversation
  if (isNewConversation && (emailCfg?.autoReplyEnabled ?? true)) {
    await sendAutoReply({
      to: senderEmail,
      organizationName: orgName,
      conversationId,
      originalSubject: subject,
      from: fromAddress,
      inReplyTo: messageIdHeader ?? undefined,
      references: messageIdHeader
        ? [...referencesArray, messageIdHeader]
        : referencesArray,
    });
  }

  // 10. Generate AI response
  try {
    const contextChunks = await retrieveContext(bodyText, orgId);
    const system = buildFullSystemPrompt(
      orgName,
      contextChunks.map((c) => ({ content: c.content, sourceName: c.sourceName }))
    );

    const result = await generateText({
      model: AI_MODELS.chat,
      system,
      messages: [{ role: "user" as const, content: bodyText }],
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: AI_CONFIG.maxTokens,
    });

    const aiText = result.text;
    const { confidence } = extractConfidence(aiText);

    // Persist AI message
    const aiMsgId = `msg_${generateId()}`;
    await db.insert(messages).values({
      id: aiMsgId,
      conversationId,
      sender: "ai",
      content: aiText,
      confidence,
      sources: contextChunks.map((c) => c.sourceId),
      metadata: {
        channel: "email",
      },
    });

    // Update conversation
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // 11. Send AI response via email
    const showBranding = true; // Default; could be read from widgetConfigs
    const emailHtml = buildAIResponseEmail({
      aiResponse: aiText,
      organizationName: orgName,
      conversationId,
      showBranding,
    });

    const emailResult = await sendEmail({
      to: senderEmail,
      subject: `Re: ${subject}`,
      html: emailHtml,
      from: fromAddress,
      replyTo: emailCfg?.fromAddress ?? undefined,
      inReplyTo: messageIdHeader ?? undefined,
      references: messageIdHeader
        ? [...referencesArray, messageIdHeader]
        : referencesArray,
    });

    // Store the outbound email message ID for threading
    if (emailResult?.id) {
      await db
        .update(messages)
        .set({
          metadata: {
            channel: "email",
            emailMessageId: emailResult.id,
            emailSubject: `Re: ${subject}`,
          },
        })
        .where(eq(messages.id, aiMsgId));
    }

    console.log(
      `[email:inbound] Processed: org=${orgId} conv=${conversationId} confidence=${confidence.toFixed(2)}`
    );
  } catch (err) {
    console.error("[email:inbound] AI response generation failed:", err);
    // The message is saved; the team can respond manually via dashboard
  }

  return NextResponse.json({ ok: true, conversationId });
}
