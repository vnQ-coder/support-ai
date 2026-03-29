import { streamText, tool, type ModelMessage } from "ai";
import { z } from "zod";
import {
  AI_MODELS,
  AI_CONFIG,
  buildFullSystemPrompt,
  retrieveContext,
  escalateToHuman,
  createEscalateToHumanTool,
  searchKnowledgeDefinition,
  extractConfidence,
} from "@repo/ai";
import { validateApiKey, apiError } from "../_lib/auth";
import { chatRatelimit, checkRatelimit } from "../_lib/ratelimit";
import { db, messages, conversations } from "@repo/db";
import { eq } from "drizzle-orm";

function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

export const maxDuration = 30;

export async function POST(request: Request) {
  // 1. Validate API key
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  // 1b. Rate limit check (by organization ID)
  const rl = await checkRatelimit(chatRatelimit, `chat:${auth.organizationId}`);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: { code: "rate_limited", message: "Too many requests" } }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.reset! - Date.now()) / 1000)),
        },
      }
    );
  }

  // 2. Parse request body
  let body: {
    messages: Array<{ role: string; content: string }>;
    conversationId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  if (
    !body.messages ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return apiError("bad_request", "messages array is required", 400);
  }

  // 3. Extract last user message for RAG query
  const lastUserMessage = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) {
    return apiError("bad_request", "No user message found", 400);
  }

  // 4. RAG retrieval
  const contextChunks = await retrieveContext(
    lastUserMessage.content,
    auth.organizationId
  );

  // 5. Build system prompt with grounding context
  const system = buildFullSystemPrompt(
    auth.organizationName,
    contextChunks.map((c) => ({ content: c.content, sourceName: c.sourceName }))
  );

  // 6. Stream AI response
  const result = streamText({
    model: AI_MODELS.chat,
    system,
    messages: body.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })) as ModelMessage[],
    tools: {
      escalateToHuman: body.conversationId
        ? createEscalateToHumanTool({
            conversationId: body.conversationId,
            organizationId: auth.organizationId,
          })
        : escalateToHuman,
      searchKnowledge: tool({
        ...searchKnowledgeDefinition,
        execute: async ({ query }) => {
          const results = await retrieveContext(query, auth.organizationId, {
            maxChunks: 3,
          });
          return results.map((r) => ({
            source: r.sourceName,
            content: r.content,
          }));
        },
      }),
    },
    temperature: AI_CONFIG.temperature,
    maxOutputTokens: AI_CONFIG.maxTokens,
    onFinish: async ({ text }) => {
      // Extract confidence and persist message
      const { confidence } = extractConfidence(text);

      // Persist to database if DATABASE_URL is configured
      if (process.env.DATABASE_URL && body.conversationId) {
        try {
          // Insert the user message
          const userMsgId = `msg_${nanoid(12)}`;
          await db.insert(messages).values({
            id: userMsgId,
            conversationId: body.conversationId,
            sender: "user",
            content: lastUserMessage.content,
          });

          // Insert the assistant message with confidence and sources
          const aiMsgId = `msg_${nanoid(12)}`;
          await db.insert(messages).values({
            id: aiMsgId,
            conversationId: body.conversationId,
            sender: "ai",
            content: text,
            confidence,
            sources: contextChunks.map((c) => c.sourceId),
          });

          // Update conversation lastMessageAt and timestamps
          await db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, body.conversationId));
        } catch (err) {
          console.error("[chat] Failed to persist messages:", err);
        }
      }

      console.log(
        `[chat] org=${auth.organizationId} confidence=${confidence.toFixed(2)} chunks=${contextChunks.length}`
      );
    },
  });

  // 7. Return streaming response
  return result.toUIMessageStreamResponse();
}
