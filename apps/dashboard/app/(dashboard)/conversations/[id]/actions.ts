"use server";

import { revalidatePath } from "next/cache";
import { getAuthOrRedirect } from "@/lib/auth";
import { db, conversations, messages, members, eq, and } from "@repo/db";
import {
  addTagToConversation,
  removeTagFromConversation,
} from "@/lib/queries/tags";
import { z } from "zod";

// ---- Validation Schemas ---------------------------------------------------

const sendReplySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(10000),
});

const updateStatusSchema = z.object({
  conversationId: z.string().min(1),
  status: z.enum(["active", "waiting", "escalated", "resolved"]),
});

const assignSchema = z.object({
  conversationId: z.string().min(1),
  assigneeId: z.string(), // empty string means unassign
});

// ---- Helpers --------------------------------------------------------------

async function verifyOrgOwnership(
  orgId: string,
  conversationId: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.organizationId, orgId)
      )
    )
    .limit(1);
  return !!row;
}

// ---- Server Actions -------------------------------------------------------

export async function sendAgentReply(
  conversationId: string,
  content: string
): Promise<{ error?: string }> {
  const { internalOrgId } = await getAuthOrRedirect();

  const parsed = sendReplySchema.safeParse({ conversationId, content });
  if (!parsed.success) {
    return { error: "Invalid input. Please provide a message." };
  }

  const hasAccess = await verifyOrgOwnership(internalOrgId, conversationId);
  if (!hasAccess) {
    return { error: "Conversation not found." };
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    sender: "agent",
    content: parsed.data.content,
    confidence: null,
    sources: [],
    metadata: {},
  });

  // Update conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  revalidatePath(`/conversations/${conversationId}`);
  return {};
}

export async function updateConversationStatus(
  conversationId: string,
  status: string
): Promise<{ error?: string }> {
  const { internalOrgId } = await getAuthOrRedirect();

  const parsed = updateStatusSchema.safeParse({ conversationId, status });
  if (!parsed.success) {
    return { error: "Invalid status value." };
  }

  const hasAccess = await verifyOrgOwnership(internalOrgId, conversationId);
  if (!hasAccess) {
    return { error: "Conversation not found." };
  }

  const updateData: Record<string, unknown> = {
    status: parsed.data.status,
    updatedAt: new Date(),
  };

  if (parsed.data.status === "resolved") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = "human";
  }

  await db
    .update(conversations)
    .set(updateData)
    .where(eq(conversations.id, conversationId));

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");
  return {};
}

export async function assignConversation(
  conversationId: string,
  assigneeId: string
): Promise<{ error?: string }> {
  const { internalOrgId } = await getAuthOrRedirect();

  const parsed = assignSchema.safeParse({ conversationId, assigneeId });
  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const hasAccess = await verifyOrgOwnership(internalOrgId, conversationId);
  if (!hasAccess) {
    return { error: "Conversation not found." };
  }

  // Verify assignee belongs to the same organization
  if (parsed.data.assigneeId) {
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.id, parsed.data.assigneeId),
          eq(members.organizationId, internalOrgId)
        )
      )
      .limit(1);
    if (!member) {
      return { error: "Invalid assignee." };
    }
  }

  await db
    .update(conversations)
    .set({
      assigneeId: parsed.data.assigneeId || null,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");
  return {};
}

// ---- Tag Actions ----------------------------------------------------------

export async function addTagAction(
  conversationId: string,
  tagId: string
): Promise<void> {
  const { internalOrgId } = await getAuthOrRedirect();
  await addTagToConversation(conversationId, tagId, internalOrgId);
  revalidatePath(`/conversations/${conversationId}`);
}

export async function removeTagAction(
  conversationId: string,
  tagId: string
): Promise<void> {
  const { internalOrgId } = await getAuthOrRedirect();
  await removeTagFromConversation(conversationId, tagId, internalOrgId);
  revalidatePath(`/conversations/${conversationId}`);
}
