/**
 * Email HTML templates for SupportAI.
 *
 * All templates are responsive, dark-mode friendly (via @media prefers-color-scheme),
 * and follow email-client-safe inline-style conventions.
 */

// ---- Shared styles --------------------------------------------------------

const COLORS = {
  bg: "#09090b",
  bgLight: "#ffffff",
  card: "#18181b",
  cardLight: "#f4f4f5",
  border: "#27272a",
  borderLight: "#e4e4e7",
  text: "#fafafa",
  textLight: "#09090b",
  muted: "#a1a1aa",
  mutedLight: "#71717a",
  primary: "#3b82f6",
  primaryText: "#ffffff",
} as const;

function baseLayout(bodyHtml: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>SupportAI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: ${COLORS.bg} !important; }
      .email-card { background-color: ${COLORS.card} !important; border-color: ${COLORS.border} !important; }
      .email-text { color: ${COLORS.text} !important; }
      .email-muted { color: ${COLORS.muted} !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-body" style="background-color:${COLORS.bgLight};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          ${bodyHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function brandingFooter(orgName: string, showBranding: boolean): string {
  if (!showBranding) {
    return `<tr>
      <td style="padding:24px 0 0;text-align:center;">
        <p class="email-muted" style="margin:0;font-size:12px;color:${COLORS.mutedLight};">
          ${escapeHtml(orgName)}
        </p>
      </td>
    </tr>`;
  }

  return `<tr>
    <td style="padding:24px 0 0;text-align:center;">
      <p class="email-muted" style="margin:0;font-size:12px;color:${COLORS.mutedLight};">
        ${escapeHtml(orgName)} &middot; Powered by SupportAI
      </p>
    </td>
  </tr>`;
}

// ---- Public templates -----------------------------------------------------

/**
 * Template for AI-generated responses sent to customers.
 */
export function aiResponseTemplate(
  content: string,
  orgName: string,
  showBranding: boolean
): string {
  const bodyHtml = `
    <tr>
      <td class="email-card" style="background-color:${COLORS.cardLight};border:1px solid ${COLORS.borderLight};border-radius:12px;padding:32px;">
        <h2 class="email-text" style="margin:0 0 8px;font-size:16px;font-weight:600;color:${COLORS.textLight};">
          ${escapeHtml(orgName)}
        </h2>
        <p class="email-muted" style="margin:0 0 24px;font-size:13px;color:${COLORS.mutedLight};">
          Here is a response to your inquiry:
        </p>
        <div class="email-text" style="font-size:14px;line-height:1.7;color:${COLORS.textLight};white-space:pre-wrap;">${escapeHtml(content)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 0 0;">
        <p class="email-muted" style="margin:0;font-size:12px;color:${COLORS.mutedLight};">
          Simply reply to this email to continue the conversation.
        </p>
      </td>
    </tr>
    ${brandingFooter(orgName, showBranding)}`;

  return baseLayout(bodyHtml, `Response from ${orgName}`);
}

/**
 * Template for human agent replies sent to customers.
 */
export function agentResponseTemplate(
  content: string,
  agentName: string,
  orgName: string
): string {
  const bodyHtml = `
    <tr>
      <td class="email-card" style="background-color:${COLORS.cardLight};border:1px solid ${COLORS.borderLight};border-radius:12px;padding:32px;">
        <h2 class="email-text" style="margin:0 0 4px;font-size:16px;font-weight:600;color:${COLORS.textLight};">
          ${escapeHtml(agentName)}
        </h2>
        <p class="email-muted" style="margin:0 0 24px;font-size:13px;color:${COLORS.mutedLight};">
          ${escapeHtml(orgName)} Support Team
        </p>
        <div class="email-text" style="font-size:14px;line-height:1.7;color:${COLORS.textLight};white-space:pre-wrap;">${escapeHtml(content)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 0 0;">
        <p class="email-muted" style="margin:0;font-size:12px;color:${COLORS.mutedLight};">
          Reply to this email to continue the conversation.
        </p>
      </td>
    </tr>
    ${brandingFooter(orgName, true)}`;

  return baseLayout(bodyHtml, `Reply from ${agentName} at ${orgName}`);
}

/**
 * Auto-reply acknowledgment template sent immediately when a new
 * inbound email is received.
 */
export function autoReplyTemplate(
  orgName: string,
  estimatedTime?: string
): string {
  const estimate = estimatedTime ?? "a few minutes";

  const bodyHtml = `
    <tr>
      <td class="email-card" style="background-color:${COLORS.cardLight};border:1px solid ${COLORS.borderLight};border-radius:12px;padding:32px;text-align:center;">
        <div style="margin:0 0 16px;font-size:32px;">&#9993;</div>
        <h2 class="email-text" style="margin:0 0 8px;font-size:18px;font-weight:600;color:${COLORS.textLight};">
          We received your message
        </h2>
        <p class="email-muted" style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${COLORS.mutedLight};">
          Thank you for contacting ${escapeHtml(orgName)}. We are reviewing your inquiry and will get back to you within ${escapeHtml(estimate)}.
        </p>
        <p class="email-muted" style="margin:0;font-size:13px;color:${COLORS.mutedLight};">
          You can reply to this email to add more information.
        </p>
      </td>
    </tr>
    ${brandingFooter(orgName, true)}`;

  return baseLayout(bodyHtml, `We received your message - ${orgName}`);
}
