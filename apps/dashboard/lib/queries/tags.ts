/**
 * Tag queries -- plain async functions called from Server Components.
 * All queries are scoped by organizationId for tenant isolation.
 */

import { db, conversations, eq, and } from "@repo/db";
import {
  tags,
  conversationTags,
} from "../../../../packages/db/src/schema/tags";
import { randomUUID } from "crypto";

export type Tag = typeof tags.$inferSelect;

export async function getOrgTags(orgId: string): Promise<Tag[]> {
  return db
    .select()
    .from(tags)
    .where(eq(tags.organizationId, orgId))
    .orderBy(tags.name);
}

export async function getConversationTags(
  conversationId: string,
  orgId: string
): Promise<Tag[]> {
  return db
    .select({
      id: tags.id,
      organizationId: tags.organizationId,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt,
    })
    .from(conversationTags)
    .innerJoin(tags, eq(conversationTags.tagId, tags.id))
    .innerJoin(
      conversations,
      and(
        eq(conversationTags.conversationId, conversations.id),
        eq(conversations.organizationId, orgId)
      )
    )
    .where(eq(conversationTags.conversationId, conversationId));
}

export async function createTag(
  orgId: string,
  name: string,
  color: string
): Promise<Tag> {
  const [tag] = await db
    .insert(tags)
    .values({
      id: randomUUID(),
      organizationId: orgId,
      name: name.trim(),
      color,
    })
    .returning();
  return tag!;
}

export async function deleteTag(
  tagId: string,
  orgId: string
): Promise<void> {
  // Delete associated conversation_tags first (cascade manually)
  const orgTag = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.organizationId, orgId)))
    .limit(1);

  if (orgTag.length === 0) return;

  await db
    .delete(conversationTags)
    .where(eq(conversationTags.tagId, tagId));

  await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.organizationId, orgId)));
}

export async function addTagToConversation(
  conversationId: string,
  tagId: string,
  orgId: string
): Promise<void> {
  // Verify both conversation and tag belong to the org
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.organizationId, orgId)
      )
    )
    .limit(1);

  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.organizationId, orgId)))
    .limit(1);

  if (!conv || !tag) throw new Error("Not found or access denied");

  await db
    .insert(conversationTags)
    .values({ conversationId, tagId })
    .onConflictDoNothing();
}

export async function removeTagFromConversation(
  conversationId: string,
  tagId: string,
  orgId: string
): Promise<void> {
  // Verify conversation belongs to org
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.organizationId, orgId)
      )
    )
    .limit(1);

  if (!conv) throw new Error("Not found or access denied");

  await db
    .delete(conversationTags)
    .where(
      and(
        eq(conversationTags.conversationId, conversationId),
        eq(conversationTags.tagId, tagId)
      )
    );
}
