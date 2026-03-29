/**
 * Twilio messaging service for SupportAI.
 *
 * Gracefully degrades when Twilio env vars are not set — all send functions
 * log a warning and return null instead of throwing.
 */

// ---- Lazy Twilio client ---------------------------------------------------

let twilioClientInstance: import("twilio").Twilio | null = null;

interface TwilioModule {
  default: (accountSid: string, authToken: string) => import("twilio").Twilio;
}

function getTwilioClient(
  accountSid?: string,
  authToken?: string
): import("twilio").Twilio | null {
  // Use provided credentials or fall back to env vars
  const sid = accountSid ?? process.env.TWILIO_ACCOUNT_SID;
  const token = authToken ?? process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    console.warn(
      "[twilio] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set — Twilio sending is disabled"
    );
    return null;
  }

  // If using env vars, cache the client instance
  if (!accountSid && !authToken && twilioClientInstance) {
    return twilioClientInstance;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio") as TwilioModule;
    const client = twilio.default(sid, token);

    if (!accountSid && !authToken) {
      twilioClientInstance = client;
    }

    return client;
  } catch {
    console.warn(
      "[twilio] twilio package not installed — Twilio sending is disabled"
    );
    return null;
  }
}

// ---- Types ----------------------------------------------------------------

export interface SendSmsParams {
  to: string;
  body: string;
  from?: string;
  /** Per-org Twilio credentials (overrides env vars) */
  accountSid?: string;
  authToken?: string;
}

export interface SendSmsResult {
  sid: string;
  status: string;
}

// ---- Public API -----------------------------------------------------------

/**
 * Send an SMS via Twilio REST API.
 *
 * Returns the message SID on success, or null if sending is disabled/fails.
 */
export async function sendSms(
  params: SendSmsParams
): Promise<SendSmsResult | null> {
  const client = getTwilioClient(params.accountSid, params.authToken);
  if (!client) return null;

  const fromNumber =
    params.from ?? process.env.TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    console.warn("[twilio] No from number configured — cannot send SMS");
    return null;
  }

  try {
    const message = await client.messages.create({
      to: params.to,
      from: fromNumber,
      body: params.body,
    });

    console.log(
      `[twilio:sms] Sent to=${params.to} sid=${message.sid} status=${message.status}`
    );
    return { sid: message.sid, status: message.status };
  } catch (err) {
    console.error("[twilio:sms] Failed to send SMS:", err);
    return null;
  }
}

/**
 * Send a WhatsApp message via Twilio REST API.
 *
 * Twilio requires the `whatsapp:` prefix on both from and to numbers.
 */
export async function sendWhatsApp(
  params: SendSmsParams
): Promise<SendSmsResult | null> {
  const client = getTwilioClient(params.accountSid, params.authToken);
  if (!client) return null;

  const fromNumber =
    params.from ?? process.env.TWILIO_WHATSAPP_NUMBER;

  if (!fromNumber) {
    console.warn(
      "[twilio] No WhatsApp number configured — cannot send WhatsApp message"
    );
    return null;
  }

  // Ensure whatsapp: prefix
  const to = params.to.startsWith("whatsapp:")
    ? params.to
    : `whatsapp:${params.to}`;
  const from = fromNumber.startsWith("whatsapp:")
    ? fromNumber
    : `whatsapp:${fromNumber}`;

  try {
    const message = await client.messages.create({
      to,
      from,
      body: params.body,
    });

    console.log(
      `[twilio:whatsapp] Sent to=${to} sid=${message.sid} status=${message.status}`
    );
    return { sid: message.sid, status: message.status };
  } catch (err) {
    console.error("[twilio:whatsapp] Failed to send WhatsApp message:", err);
    return null;
  }
}

/**
 * Validate a Twilio webhook signature using the Twilio helper library.
 *
 * Falls back to the pure-JS implementation in @repo/shared/twilio when
 * the twilio package is not available.
 */
export async function validateWebhookSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio") as {
      validateRequest: (
        authToken: string,
        signature: string,
        url: string,
        params: Record<string, string>
      ) => boolean;
    };
    return twilio.validateRequest(authToken, signature, url, params);
  } catch {
    // Fallback to shared implementation
    const { validateTwilioSignature } = await import("@repo/shared/twilio");
    return validateTwilioSignature(authToken, signature, url, params);
  }
}
