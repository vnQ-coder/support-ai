/**
 * Settings data queries -- plain async functions (NOT server actions).
 * Called from Server Components; run on the server.
 *
 * When DATABASE_URL is not set (local dev without DB), returns mock data.
 */

import {
  db,
  organizations,
  widgetConfigs,
  members,
  apiKeys,
} from "@repo/db";
import { eq, and, isNull } from "drizzle-orm";

// ---- Types ----------------------------------------------------------------

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  clerkOrgId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfigRow {
  id: string;
  organizationId: string;
  primaryColor: string;
  greeting: string;
  placeholder: string;
  position: string;
  showBranding: boolean;
  allowedDomains: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberRow {
  id: string;
  organizationId: string;
  clerkUserId: string;
  role: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyRow {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  isLive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

// ---- Dev mode detection ---------------------------------------------------

const DEV_MODE = !process.env.DATABASE_URL;

// ---- Mock data ------------------------------------------------------------

function getMockOrganization(): OrganizationRow {
  return {
    id: "org_demo_123",
    name: "Acme Support Co",
    slug: "acme-support",
    plan: "professional",
    clerkOrgId: "org_clerk_123",
    createdAt: new Date("2024-09-15"),
    updatedAt: new Date("2025-01-10"),
  };
}

function getMockWidgetConfig(): WidgetConfigRow {
  return {
    id: "wc_demo_1",
    organizationId: "org_demo_123",
    primaryColor: "#3B82F6",
    greeting: "Hi! How can we help you today?",
    placeholder: "Type a message...",
    position: "bottom-right",
    showBranding: true,
    allowedDomains: ["acme.com", "support.acme.com"],
    createdAt: new Date("2024-09-15"),
    updatedAt: new Date("2025-01-10"),
  };
}

function getMockMembers(): MemberRow[] {
  return [
    {
      id: "mem_1",
      organizationId: "org_demo_123",
      clerkUserId: "user_1",
      role: "owner",
      email: "alice@acme.com",
      name: "Alice Johnson",
      avatarUrl: null,
      createdAt: new Date("2024-09-15"),
      updatedAt: new Date("2024-09-15"),
    },
    {
      id: "mem_2",
      organizationId: "org_demo_123",
      clerkUserId: "user_2",
      role: "admin",
      email: "bob@acme.com",
      name: "Bob Smith",
      avatarUrl: null,
      createdAt: new Date("2024-10-01"),
      updatedAt: new Date("2024-10-01"),
    },
    {
      id: "mem_3",
      organizationId: "org_demo_123",
      clerkUserId: "user_3",
      role: "agent",
      email: "carol@acme.com",
      name: "Carol Davis",
      avatarUrl: null,
      createdAt: new Date("2024-11-12"),
      updatedAt: new Date("2024-11-12"),
    },
  ];
}

function getMockApiKeys(): ApiKeyRow[] {
  return [
    {
      id: "key_1",
      organizationId: "org_demo_123",
      name: "Production Widget",
      keyPrefix: "sk_live_a1",
      isLive: true,
      lastUsedAt: new Date("2025-03-27"),
      createdAt: new Date("2024-10-01"),
      revokedAt: null,
    },
    {
      id: "key_2",
      organizationId: "org_demo_123",
      name: "Development",
      keyPrefix: "sk_test_b2",
      isLive: false,
      lastUsedAt: new Date("2025-03-20"),
      createdAt: new Date("2024-11-15"),
      revokedAt: null,
    },
    {
      id: "key_3",
      organizationId: "org_demo_123",
      name: "Old Integration",
      keyPrefix: "sk_live_c3",
      isLive: true,
      lastUsedAt: new Date("2025-01-05"),
      createdAt: new Date("2024-09-20"),
      revokedAt: new Date("2025-02-01"),
    },
  ];
}

// ---- Query functions ------------------------------------------------------

export async function getOrganization(
  orgId: string
): Promise<OrganizationRow | null> {
  if (DEV_MODE) return getMockOrganization();

  const rows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  return (rows[0] as OrganizationRow | undefined) ?? null;
}

export async function getWidgetConfig(
  orgId: string
): Promise<WidgetConfigRow | null> {
  if (DEV_MODE) return getMockWidgetConfig();

  const rows = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.organizationId, orgId))
    .limit(1);

  if (!rows[0]) return null;

  return {
    ...rows[0],
    allowedDomains: (rows[0].allowedDomains as string[] | null) ?? [],
  } as WidgetConfigRow;
}

export async function getTeamMembers(orgId: string): Promise<MemberRow[]> {
  if (DEV_MODE) return getMockMembers();

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.organizationId, orgId));

  return rows as MemberRow[];
}

export async function getApiKeys(orgId: string): Promise<ApiKeyRow[]> {
  if (DEV_MODE) return getMockApiKeys();

  const rows = await db
    .select({
      id: apiKeys.id,
      organizationId: apiKeys.organizationId,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      isLive: apiKeys.isLive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, orgId));

  return rows;
}
