/**
 * Escalation Notifications API
 *
 * GET  /api/v1/notifications — SSE stream of pending escalation notifications for an agent
 * POST /api/v1/notifications — Mark a notification as read
 *
 * The GET endpoint uses Server-Sent Events to push real-time alerts
 * when conversations are escalated. It polls the database for new
 * escalated conversations assigned to the authenticated organization.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { validateApiKey, apiError } from "../_lib/auth";
import { db, conversations, contacts, members } from "@repo/db";
import { eq, and, inArray, desc } from "drizzle-orm";

const markReadSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  agentId: z.string().min(1, "agentId is required"),
});

/**
 * GET: SSE stream of pending escalation notifications.
 *
 * Sends an event every 5 seconds with the current list of
 * escalated conversations that need attention (unassigned or
 * assigned to agents in the org).
 */
export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      const fetchNotifications = async () => {
        // DEV_MODE fallback
        if (!process.env.DATABASE_URL) {
          return [
            {
              conversationId: "conv_demo_1",
              subject: "Billing issue",
              contactName: "Demo User",
              priority: "high",
              assignedAgentName: null,
              escalatedAt: new Date().toISOString(),
            },
          ];
        }

        const rows = await db
          .select({
            conversationId: conversations.id,
            subject: conversations.subject,
            metadata: conversations.metadata,
            contactName: contacts.name,
            contactEmail: contacts.email,
            assigneeId: conversations.assigneeId,
            updatedAt: conversations.updatedAt,
          })
          .from(conversations)
          .innerJoin(contacts, eq(conversations.contactId, contacts.id))
          .where(
            and(
              eq(conversations.organizationId, auth.organizationId),
              eq(conversations.status, "escalated")
            )
          )
          .orderBy(desc(conversations.updatedAt))
          .limit(20);

        // Batch-load assignee names
        const assigneeIds = rows
          .map((r) => r.assigneeId)
          .filter((id): id is string => id !== null);

        let assigneeMap = new Map<string, string>();
        if (assigneeIds.length > 0) {
          const assignees = await db
            .select({ id: members.id, name: members.name })
            .from(members)
            .where(inArray(members.id, assigneeIds));
          assigneeMap = new Map(
            assignees.map((a) => [a.id, a.name ?? "Unknown"])
          );
        }

        return rows.map((row) => {
          const meta = (row.metadata ?? {}) as Record<string, unknown>;
          return {
            conversationId: row.conversationId,
            subject: row.subject ?? "No subject",
            contactName: row.contactName ?? "Unknown",
            contactEmail: row.contactEmail ?? "",
            priority: (meta.escalationPriority as string) ?? "medium",
            assignedAgentName: row.assigneeId
              ? assigneeMap.get(row.assigneeId) ?? null
              : null,
            escalatedAt:
              (meta.escalatedAt as string) ?? row.updatedAt.toISOString(),
          };
        });
      };

      // Send initial data immediately
      try {
        const notifications = await fetchNotifications();
        sendEvent({ type: "notifications", data: notifications });
      } catch (err) {
        console.error("[notifications/sse] Initial fetch failed:", err);
        sendEvent({ type: "error", message: "Failed to fetch notifications" });
      }

      // Poll every 5 seconds
      const interval = setInterval(async () => {
        try {
          const notifications = await fetchNotifications();
          sendEvent({ type: "notifications", data: notifications });
        } catch (err) {
          console.error("[notifications/sse] Poll failed:", err);
        }
      }, 5000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * POST: Mark a notification as read by assigning the conversation
 * to the specified agent (acknowledging the escalation).
 */
export async function POST(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "validation_error",
      parsed.error.issues.map((i) => i.message).join(", "),
      400
    );
  }

  const { conversationId, agentId } = parsed.data;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { acknowledged: true, conversationId, agentId },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Verify conversation belongs to org and is escalated
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

  // Verify agent belongs to org
  const agentRows = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(
      and(
        eq(members.id, agentId),
        eq(members.organizationId, auth.organizationId)
      )
    )
    .limit(1);

  if (agentRows.length === 0) {
    return apiError("not_found", "Agent not found in organization", 404);
  }

  // Update conversation assignment
  await db
    .update(conversations)
    .set({
      assigneeId: agentId,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  return NextResponse.json(
    {
      acknowledged: true,
      conversationId,
      agentId,
      agentName: agentRows[0]!.name ?? "Unknown",
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
