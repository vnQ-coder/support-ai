/**
 * POST /api/v1/escalate
 *
 * Trigger escalation for a conversation:
 * 1. Validate API key and request body
 * 2. Verify conversation belongs to the authenticated organization
 * 3. Update conversation status to 'escalated'
 * 4. Record escalation reason in conversation metadata
 * 5. Auto-assign to available agent (round-robin)
 * 6. Insert a system message indicating escalation
 * 7. Return escalation confirmation with assigned agent info
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { validateApiKey, apiError } from "../_lib/auth";
import { buildCorsHeaders, corsOptionsResponse } from "../_lib/cors";
import { db, conversations, messages, widgetConfigs } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { assignToAgent } from "@repo/ai";

function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

const escalateRequestSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  reason: z.string().min(1, "reason is required").max(1000),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export async function POST(request: Request) {
  // 1. Authenticate
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  const parsed = escalateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "validation_error",
      parsed.error.issues.map((i) => i.message).join(", "),
      400
    );
  }

  const { conversationId, reason, priority } = parsed.data;

  // Fetch allowed domains for dynamic CORS
  let allowedDomains: string[] = [];
  if (process.env.DATABASE_URL) {
    const widgetRows = await db
      .select({ allowedDomains: widgetConfigs.allowedDomains })
      .from(widgetConfigs)
      .where(eq(widgetConfigs.organizationId, auth.organizationId))
      .limit(1);
    allowedDomains = widgetRows[0]?.allowedDomains ?? [];
  }

  const corsHeaders = buildCorsHeaders(request, allowedDomains);

  // DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        escalated: true,
        conversationId,
        reason,
        priority,
        assignedAgent: { id: "member_mock_1", name: "Support Agent" },
      },
      { headers: corsHeaders }
    );
  }

  // 3. Verify conversation belongs to this organization
  const convRows = await db
    .select({ id: conversations.id, status: conversations.status })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.organizationId, auth.organizationId)
      )
    )
    .limit(1);

  if (convRows.length === 0) {
    return apiError("not_found", "Conversation not found", 404);
  }

  const conv = convRows[0]!;

  // Prevent double-escalation
  if (conv.status === "escalated") {
    return apiError(
      "conflict",
      "Conversation is already escalated",
      409
    );
  }

  // Prevent escalating resolved/closed conversations
  if (conv.status === "resolved" || conv.status === "closed") {
    return apiError(
      "conflict",
      `Cannot escalate a ${conv.status} conversation`,
      409
    );
  }

  // 4. Auto-assign to available agent
  const assigned = await assignToAgent(auth.organizationId);

  // 5. Update conversation
  await db
    .update(conversations)
    .set({
      status: "escalated",
      assigneeId: assigned?.agentId ?? null,
      metadata: {
        escalationReason: reason,
        escalationPriority: priority,
        escalatedAt: new Date().toISOString(),
        assignedAgentName: assigned?.agentName ?? null,
      },
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  // 6. Insert system message
  const systemMsgId = `msg_${nanoid(12)}`;
  const agentInfo = assigned
    ? `Assigned to ${assigned.agentName}.`
    : "Waiting for an available agent.";

  await db.insert(messages).values({
    id: systemMsgId,
    conversationId,
    sender: "system",
    content: `Conversation escalated. Reason: ${reason}. Priority: ${priority}. ${agentInfo}`,
  });

  // 7. Return confirmation
  return NextResponse.json(
    {
      escalated: true,
      conversationId,
      reason,
      priority,
      assignedAgent: assigned
        ? { id: assigned.agentId, name: assigned.agentName }
        : null,
      systemMessageId: systemMsgId,
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS(request: Request) {
  // For preflight we cannot authenticate, so pass empty allowedDomains (falls back to wildcard)
  return corsOptionsResponse(request, []);
}
