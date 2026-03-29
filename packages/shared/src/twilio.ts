/**
 * Twilio webhook signature validation utility.
 *
 * Validates the X-Twilio-Signature header using HMAC-SHA1 as per
 * https://www.twilio.com/docs/usage/security#validating-requests
 */

/**
 * Validate a Twilio webhook signature.
 *
 * @param authToken - The Twilio Auth Token for the account
 * @param signature - The X-Twilio-Signature header value
 * @param url       - The full webhook URL (as Twilio sees it)
 * @param params    - The POST body params as key-value pairs
 * @returns true if the signature is valid
 */
export async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  if (!authToken || !signature || !url) {
    return false;
  }

  // 1. Build the data string: URL + sorted POST params concatenated
  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + (params[key] ?? "");
  }

  // 2. Compute HMAC-SHA1
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(authToken),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(dataString)
    );

    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBytes))
    );

    return expectedSignature === signature;
  } catch {
    return false;
  }
}

/**
 * Parse Twilio webhook form data into a typed object.
 */
export interface TwilioInboundMessage {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  NumSegments: string;
}

/**
 * Parse URLSearchParams from a Twilio webhook into a Record.
 */
export function parseTwilioParams(
  formData: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value;
  }
  return params;
}

/**
 * Build a minimal TwiML response (empty or with a message).
 */
export function buildTwimlResponse(message?: string): string {
  if (message) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  }
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

/**
 * Escape special XML characters.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
