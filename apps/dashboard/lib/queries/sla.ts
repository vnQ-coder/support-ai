/**
 * SLA queries -- plain async functions called from Server Components.
 * All queries are scoped by organizationId for tenant isolation.
 */

import { db, eq, and, count, sql } from "@repo/db";
import {
  slaPolicies,
  conversationSla,
} from "../../../../packages/db/src/schema/sla";
import crypto from "node:crypto";

// ---- Types ----------------------------------------------------------------

export interface SlaPolicy {
  id: string;
  name: string;
  description: string | null;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  priority: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSlaRecord {
  id: string;
  conversationId: string;
  policyId: string | null;
  firstResponseDeadline: Date | null;
  resolutionDeadline: Date | null;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
}

export interface SlaComplianceStats {
  totalWithSla: number;
  firstResponseCompliant: number;
  resolutionCompliant: number;
  breached: number;
}

// ---- Helpers --------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

// ---- Queries --------------------------------------------------------------

export async function getSlaPolicies(orgId: string): Promise<SlaPolicy[]> {
  const rows = await db
    .select({
      id: slaPolicies.id,
      name: slaPolicies.name,
      description: slaPolicies.description,
      firstResponseMinutes: slaPolicies.firstResponseMinutes,
      resolutionMinutes: slaPolicies.resolutionMinutes,
      priority: slaPolicies.priority,
      isDefault: slaPolicies.isDefault,
      createdAt: slaPolicies.createdAt,
      updatedAt: slaPolicies.updatedAt,
    })
    .from(slaPolicies)
    .where(eq(slaPolicies.organizationId, orgId))
    .orderBy(slaPolicies.createdAt);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getDefaultSlaPolicy(
  orgId: string
): Promise<SlaPolicy | null> {
  const rows = await db
    .select({
      id: slaPolicies.id,
      name: slaPolicies.name,
      description: slaPolicies.description,
      firstResponseMinutes: slaPolicies.firstResponseMinutes,
      resolutionMinutes: slaPolicies.resolutionMinutes,
      priority: slaPolicies.priority,
      isDefault: slaPolicies.isDefault,
      createdAt: slaPolicies.createdAt,
      updatedAt: slaPolicies.updatedAt,
    })
    .from(slaPolicies)
    .where(
      and(
        eq(slaPolicies.organizationId, orgId),
        eq(slaPolicies.isDefault, true)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSlaForConversation(
  conversationId: string,
  orgId: string
): Promise<ConversationSlaRecord | null> {
  const rows = await db
    .select({
      id: conversationSla.id,
      conversationId: conversationSla.conversationId,
      policyId: conversationSla.policyId,
      firstResponseDeadline: conversationSla.firstResponseDeadline,
      resolutionDeadline: conversationSla.resolutionDeadline,
      firstResponseAt: conversationSla.firstResponseAt,
      resolvedAt: conversationSla.resolvedAt,
      firstResponseBreached: conversationSla.firstResponseBreached,
      resolutionBreached: conversationSla.resolutionBreached,
    })
    .from(conversationSla)
    .where(
      and(
        eq(conversationSla.conversationId, conversationId),
        eq(conversationSla.organizationId, orgId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getSlaComplianceStats(
  orgId: string
): Promise<SlaComplianceStats> {
  const rows = await db
    .select({
      totalWithSla: count(),
      firstResponseCompliant: count(
        sql`CASE WHEN ${conversationSla.firstResponseBreached} = false AND ${conversationSla.firstResponseAt} IS NOT NULL THEN 1 END`
      ),
      resolutionCompliant: count(
        sql`CASE WHEN ${conversationSla.resolutionBreached} = false AND ${conversationSla.resolvedAt} IS NOT NULL THEN 1 END`
      ),
      breached: count(
        sql`CASE WHEN ${conversationSla.firstResponseBreached} = true OR ${conversationSla.resolutionBreached} = true THEN 1 END`
      ),
    })
    .from(conversationSla)
    .where(eq(conversationSla.organizationId, orgId));

  const row = rows[0];

  return {
    totalWithSla: row?.totalWithSla ?? 0,
    firstResponseCompliant: row?.firstResponseCompliant ?? 0,
    resolutionCompliant: row?.resolutionCompliant ?? 0,
    breached: row?.breached ?? 0,
  };
}

export async function createSlaPolicy(
  orgId: string,
  data: {
    name: string;
    description?: string | null;
    firstResponseMinutes: number;
    resolutionMinutes: number;
    priority: string;
    isDefault: boolean;
  }
): Promise<void> {
  const id = generateId();
  const now = new Date();

  // If this policy is set as default, un-default any existing default for this org
  if (data.isDefault) {
    await db
      .update(slaPolicies)
      .set({ isDefault: false, updatedAt: now })
      .where(
        and(
          eq(slaPolicies.organizationId, orgId),
          eq(slaPolicies.isDefault, true)
        )
      );
  }

  await db.insert(slaPolicies).values({
    id,
    organizationId: orgId,
    name: data.name,
    description: data.description ?? null,
    firstResponseMinutes: data.firstResponseMinutes,
    resolutionMinutes: data.resolutionMinutes,
    priority: data.priority,
    isDefault: data.isDefault,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateSlaPolicy(
  id: string,
  orgId: string,
  data: {
    name?: string;
    description?: string | null;
    firstResponseMinutes?: number;
    resolutionMinutes?: number;
    priority?: string;
    isDefault?: boolean;
  }
): Promise<void> {
  const now = new Date();

  // If setting as default, un-default others first
  if (data.isDefault) {
    await db
      .update(slaPolicies)
      .set({ isDefault: false, updatedAt: now })
      .where(
        and(
          eq(slaPolicies.organizationId, orgId),
          eq(slaPolicies.isDefault, true)
        )
      );
  }

  await db
    .update(slaPolicies)
    .set({ ...data, updatedAt: now })
    .where(and(eq(slaPolicies.id, id), eq(slaPolicies.organizationId, orgId)));
}

export async function deleteSlaPolicy(
  id: string,
  orgId: string
): Promise<void> {
  await db
    .delete(slaPolicies)
    .where(and(eq(slaPolicies.id, id), eq(slaPolicies.organizationId, orgId)));
}
