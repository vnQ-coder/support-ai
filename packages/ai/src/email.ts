/**
 * Resend email service for SupportAI.
 *
 * Gracefully degrades when RESEND_API_KEY is not set — all send functions
 * log a warning and return null instead of throwing.
 */

import { aiResponseTemplate, autoReplyTemplate } from "./email-templates";

// ---- Lazy Resend client ---------------------------------------------------

let resendInstance: import("resend").Resend | null = null;

function getResend(): import("resend").Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set — email sending is disabled");
    return null;
  }

  // Dynamic import avoided; Resend is a dependency of @repo/api which
  // re-exports this module. We use require so the package is only loaded
  // when an API key is present.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require("resend") as typeof import("resend");
    resendInstance = new Resend(apiKey);
    return resendInstance;
  } catch {
    console.warn("[email] resend package not installed — email sending is disabled");
    return null;
  }
}

// ---- Types ----------------------------------------------------------------

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  /** Message-ID of the email being replied to (for threading) */
  inReplyTo?: string;
  /** Previous Message-IDs in the thread */
  references?: string[];
}

export interface SendEmailResult {
  id: string;
}

// ---- Public API -----------------------------------------------------------

/**
 * Send an email via Resend.
 *
 * Returns the Resend message ID on success, or null if sending is
 * disabled / fails.
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult | null> {
  const resend = getResend();
  if (!resend) return null;

  const fromAddress =
    params.from ?? `SupportAI <support@${process.env.RESEND_DOMAIN ?? "notifications.supportai.dev"}>`;

  try {
    const headers: Record<string, string> = {};
    if (params.inReplyTo) {
      headers["In-Reply-To"] = params.inReplyTo;
    }
    if (params.references && params.references.length > 0) {
      headers["References"] = params.references.join(" ");
    }

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (error) {
      console.error("[email] Resend API error:", error);
      return null;
    }

    console.log(`[email] Sent to=${params.to} id=${data?.id}`);
    return data ? { id: data.id } : null;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return null;
  }
}

/**
 * Send an auto-reply acknowledgment to the customer.
 */
export async function sendAutoReply(params: {
  to: string;
  organizationName: string;
  conversationId: string;
  originalSubject: string;
  from?: string;
  inReplyTo?: string;
  references?: string[];
}): Promise<void> {
  const html = autoReplyTemplate(params.organizationName);

  await sendEmail({
    to: params.to,
    subject: `Re: ${params.originalSubject}`,
    html,
    from: params.from,
    inReplyTo: params.inReplyTo,
    references: params.references,
  });
}

/**
 * Build an HTML email body for an AI-generated response.
 */
export function buildAIResponseEmail(params: {
  aiResponse: string;
  organizationName: string;
  conversationId: string;
  showBranding: boolean;
}): string {
  return aiResponseTemplate(
    params.aiResponse,
    params.organizationName,
    params.showBranding
  );
}
