/**
 * Email settings queries -- plain async functions called from Server Components.
 */

import { db, emailConfigs, eq } from "@repo/db";

// ---- Types ----------------------------------------------------------------

export interface EmailConfigRow {
  id: string;
  organizationId: string;
  fromAddress: string | null;
  fromName: string | null;
  customDomain: string | null;
  signature: string | null;
  autoReplyEnabled: boolean;
  autoReplyEstimate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Dev mode detection ---------------------------------------------------

const DEV_MODE = !process.env.DATABASE_URL;

// ---- Mock data ------------------------------------------------------------

function getMockEmailConfig(): EmailConfigRow {
  return {
    id: "ec_demo_1",
    organizationId: "org_demo_123",
    fromAddress: "support@acme.com",
    fromName: "Acme Support",
    customDomain: null,
    signature: "",
    autoReplyEnabled: true,
    autoReplyEstimate: "a few minutes",
    createdAt: new Date("2024-09-15"),
    updatedAt: new Date("2025-01-10"),
  };
}

// ---- Queries --------------------------------------------------------------

export async function getEmailConfig(
  orgId: string
): Promise<EmailConfigRow | null> {
  if (DEV_MODE) return getMockEmailConfig();

  const rows = await db
    .select()
    .from(emailConfigs)
    .where(eq(emailConfigs.organizationId, orgId))
    .limit(1);

  if (!rows[0]) return null;

  return rows[0] as EmailConfigRow;
}
