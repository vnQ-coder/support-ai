/**
 * Outbound Email Reply — sends an agent's reply via email.
 *
 * Called from the dashboard when a human agent replies to an email conversation.
 * Authenticated via API key (same as other v1 routes).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  db,
  conversations,
  contacts,
  messages,
  organizations,
  emailConfigs,
  eq,
  and,
  desc,
} from "@repo/db";
import { sendEmail, agentResponseTemplate } from "@repo/ai";
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

const sendEmailReplySchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  content: z.string().min(1, "content is required").max(50000),
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

  const parsed = sendEmailReplySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "bad_request",
      parsed.error.errors[0]?.message ?? "Validation failed",
      400
    );
  }

  const { conversationId, content, agentName } = parsed.data;

  // 3. Verify conversation belongs to the org and is an email conversation
  const [conversation] = await db
    .select({
      id: conversations.id,
      channel: conversations.channel,
      contactId: conversations.contactId,
      subject: conversations.subject,
      organizationId: conversations.organizationId,
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

  if (conversation.channel !== "email") {
    return apiError(
      "bad_request",
      "This endpoint only supports email conversations",
      400
    );
  }

  // 4. Get contact email
  const [contact] = await db
    .select({ email: contacts.email })
    .from(contacts)
    .where(eq(contacts.id, conversation.contactId))
    .limit(1);

  if (!contact?.email) {
    return apiError("bad_request", "Contact has no email address", 400);
  }

  // 5. Load email config for the org
  const [emailCfg] = await db
    .select()
    .from(emailConfigs)
    .where(eq(emailConfigs.organizationId, auth.organizationId))
    .limit(1);

  const fromAddress = emailCfg?.fromAddress
    ? `${emailCfg.fromName ?? auth.organizationName} <${emailCfg.fromAddress}>`
    : undefined;

  // 6. Find the last email message ID for threading
  const lastMessages = await db
    .select({ metadata: messages.metadata })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  let inReplyTo: string | undefined;
  const references: string[] = [];

  for (const msg of lastMessages) {
    const meta = msg.metadata as Record<string, unknown> | null;
    if (meta?.emailMessageId && typeof meta.emailMessageId === "string") {
      if (!inReplyTo) {
        inReplyTo = meta.emailMessageId;
      }
      references.push(meta.emailMessageId);
    }
  }

  // 7. Insert agent message
  const messageId = `msg_${generateId()}`;
  await db.insert(messages).values({
    id: messageId,
    conversationId,
    sender: "agent",
    content,
    confidence: null,
    sources: [],
    metadata: {
      channel: "email",
      agentName,
    },
  });

  // Update conversation
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // 8. Build and send email
  const emailHtml = agentResponseTemplate(
    content,
    agentName,
    auth.organizationName
  );

  const subject = conversation.subject
    ? `Re: ${conversation.subject}`
    : "Support Reply";

  const emailResult = await sendEmail({
    to: contact.email,
    subject,
    html: emailHtml,
    from: fromAddress,
    replyTo: emailCfg?.fromAddress ?? undefined,
    inReplyTo,
    references: references.length > 0 ? references : undefined,
  });

  // Store outbound email message ID for threading
  if (emailResult?.id) {
    await db
      .update(messages)
      .set({
        metadata: {
          channel: "email",
          agentName,
          emailMessageId: emailResult.id,
          emailSubject: subject,
        },
      })
      .where(eq(messages.id, messageId));
  }

  console.log(
    `[email:send] Sent agent reply: conv=${conversationId} to=${contact.email} emailId=${emailResult?.id ?? "none"}`
  );

  return NextResponse.json({
    ok: true,
    messageId,
    emailId: emailResult?.id ?? null,
  });
}
