/**
 * Canned response queries -- plain async functions called from Server Components.
 * All queries are scoped by organizationId for tenant isolation.
 */

import { db } from "@repo/db";
import { eq, and, isNull, ilike, or, asc, sql } from "drizzle-orm";
import { cannedResponses } from "../../../../packages/db/src/schema/canned-responses";
import { randomUUID } from "crypto";

export type CannedResponse = typeof cannedResponses.$inferSelect;

export async function getCannedResponses(orgId: string, search?: string): Promise<CannedResponse[]> {
  const base = and(eq(cannedResponses.organizationId, orgId), isNull(cannedResponses.deletedAt));
  const where = search
    ? and(base, or(ilike(cannedResponses.shortcut, `%${search}%`), ilike(cannedResponses.title, `%${search}%`)))
    : base;
  return db.select().from(cannedResponses).where(where!).orderBy(asc(cannedResponses.shortcut));
}

export async function searchByShortcut(orgId: string, prefix: string): Promise<CannedResponse[]> {
  return db.select().from(cannedResponses)
    .where(and(eq(cannedResponses.organizationId, orgId), isNull(cannedResponses.deletedAt), ilike(cannedResponses.shortcut, `${prefix}%`))!)
    .orderBy(asc(cannedResponses.shortcut))
    .limit(8);
}

export async function createCannedResponse(orgId: string, data: { shortcut: string; title: string; content: string; isShared: boolean; createdById?: string }): Promise<CannedResponse> {
  const [cr] = await db.insert(cannedResponses).values({ id: randomUUID(), organizationId: orgId, ...data }).returning();
  return cr!;
}

export async function updateCannedResponse(id: string, orgId: string, data: Partial<Pick<CannedResponse, "shortcut"|"title"|"content"|"isShared">>): Promise<void> {
  await db.update(cannedResponses).set({ ...data, updatedAt: new Date() }).where(and(eq(cannedResponses.id, id), eq(cannedResponses.organizationId, orgId)));
}

export async function softDeleteCannedResponse(id: string, orgId: string): Promise<void> {
  await db.update(cannedResponses).set({ deletedAt: new Date() }).where(and(eq(cannedResponses.id, id), eq(cannedResponses.organizationId, orgId)));
}

export async function incrementCannedUsage(id: string, orgId: string): Promise<void> {
  await db.update(cannedResponses).set({ usageCount: sql`${cannedResponses.usageCount} + 1` }).where(and(eq(cannedResponses.id, id), eq(cannedResponses.organizationId, orgId)));
}
