/**
 * Channel configuration queries -- checks which messaging channels are
 * configured for the organization.
 *
 * When DATABASE_URL is not set (local dev without DB), returns mock data.
 */

import { db, smsConfigs, eq } from "@repo/db";

// ---- Types ----------------------------------------------------------------

export interface ChannelConfigStatus {
  /** Whether a Resend email config exists (checked via env for now) */
  emailConfigured: boolean;
  /** Whether WhatsApp is enabled in smsConfigs */
  whatsappConfigured: boolean;
  /** Whether SMS is enabled in smsConfigs */
  smsConfigured: boolean;
}

// ---- Dev mode detection ---------------------------------------------------

const DEV_MODE = !process.env.DATABASE_URL;

// ---- Mock data ------------------------------------------------------------

function getMockChannelConfigs(): ChannelConfigStatus {
  return {
    emailConfigured: true,
    whatsappConfigured: false,
    smsConfigured: true,
  };
}

// ---- Query function -------------------------------------------------------

/**
 * Check which communication channels are configured for the given org.
 *
 * - Email: checks if RESEND_API_KEY env var is set
 * - WhatsApp/SMS: checks the smsConfigs table for the org
 */
export async function getChannelConfigs(
  orgId: string
): Promise<ChannelConfigStatus> {
  if (DEV_MODE) return getMockChannelConfigs();

  // Email is configured if the RESEND_API_KEY env var is present
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  // SMS + WhatsApp: query the smsConfigs table
  const rows = await db
    .select({
      smsEnabled: smsConfigs.smsEnabled,
      whatsappEnabled: smsConfigs.whatsappEnabled,
      phoneNumber: smsConfigs.phoneNumber,
      whatsappNumber: smsConfigs.whatsappNumber,
    })
    .from(smsConfigs)
    .where(eq(smsConfigs.organizationId, orgId))
    .limit(1);

  const config = rows[0];

  return {
    emailConfigured,
    whatsappConfigured: Boolean(
      config?.whatsappEnabled && config?.whatsappNumber
    ),
    smsConfigured: Boolean(config?.smsEnabled && config?.phoneNumber),
  };
}
