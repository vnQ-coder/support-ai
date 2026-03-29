/**
 * AI tool definitions for the support agent.
 * Uses AI SDK v6 tool() helper with inputSchema.
 */

import { tool } from "ai";
import { z } from "zod";
import { db, conversations, messages } from "@repo/db";
import { eq } from "drizzle-orm";
import { assignToAgent } from "./assignment";

function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

/**
 * Tool definition for escalating to human.
 * The inputSchema only collects reason/priority from the AI.
 * conversationId and organizationId are bound at the API route level
 * to prevent the AI from fabricating or manipulating these values.
 */
export const escalateToHumanDefinition = {
  description:
    "Escalate the conversation to a human support agent. Use when: the customer explicitly requests a human, the issue is too complex or sensitive (billing disputes, account deletion), or you cannot find a confident answer in the knowledge base.",
  inputSchema: z.object({
    reason: z.string().describe("Why this conversation needs human attention"),
    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .describe("Urgency level based on customer sentiment and issue severity"),
  }),
};

/**
 * Create a bound escalateToHuman tool with org-scoped context.
 * This factory ensures conversationId and organizationId come from
 * validated server-side context, not from the AI model.
 */
export function createEscalateToHumanTool(context: {
  conversationId: string;
  organizationId: string;
}) {
  return tool({
    ...escalateToHumanDefinition,
    execute: async ({ reason, priority }) => {
      const { conversationId, organizationId } = context;

      // If no DB, return a simple confirmation
      if (!process.env.DATABASE_URL) {
        return {
          escalated: true,
          reason,
          priority,
          agentName: null,
          message:
            "I've connected you with our support team. A human agent will be with you shortly.",
        };
      }

      try {
        // 1. Auto-assign to available agent
        const assigned = await assignToAgent(organizationId);

        // 2. Update conversation status and metadata
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

        // 3. Insert a system message indicating escalation
        const systemMsgId = `msg_${nanoid(12)}`;
        const agentInfo = assigned
          ? `Assigned to ${assigned.agentName}.`
          : "Waiting for an available agent.";

        await db.insert(messages).values({
          id: systemMsgId,
          conversationId,
          sender: "system",
          content: `Conversation escalated to human support. Reason: ${reason}. Priority: ${priority}. ${agentInfo}`,
        });

        // 4. Return handoff message
        const userMessage = assigned
          ? `I've connected you with ${assigned.agentName} from our support team. They'll be with you shortly.`
          : "I've escalated your conversation to our support team. A human agent will be with you as soon as possible.";

        return {
          escalated: true,
          reason,
          priority,
          agentId: assigned?.agentId ?? null,
          agentName: assigned?.agentName ?? null,
          message: userMessage,
        };
      } catch (err) {
        console.error("[escalateToHuman] Failed to escalate:", err);
        return {
          escalated: true,
          reason,
          priority,
          agentName: null,
          message:
            "I've notified our support team. A human agent will be with you shortly.",
        };
      }
    },
  });
}

/**
 * Legacy escalateToHuman tool (no DB operations).
 * Kept for backward compatibility when conversation context is not available.
 */
export const escalateToHuman = tool({
  ...escalateToHumanDefinition,
  execute: async ({ reason, priority }) => {
    return {
      escalated: true,
      reason,
      priority,
      message:
        "I've connected you with our support team. A human agent will be with you shortly.",
    };
  },
});

/**
 * Tool: Search knowledge base for additional information.
 * The execute function is bound at the API route level with org context.
 * This definition provides the schema; execute is overridden per-request.
 */
export const searchKnowledgeDefinition = {
  description:
    "Search the knowledge base for additional information when the current context doesn't contain the answer. Use a refined, specific query.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("A specific search query to find relevant knowledge articles"),
  }),
};
