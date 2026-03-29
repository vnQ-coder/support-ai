import { NextRequest } from "next/server";
import { db, messages, conversations, eq, and } from "@repo/db";
import { validateApiKey, validateSessionToken, apiError } from "../../../_lib/auth";
import { buildCorsHeaders, corsOptionsResponse } from "../../../_lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request, []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  // --- Auth: accept either API key or session token ---
  const auth = await validateApiKey(request);
  let orgId: string | null = auth?.organizationId ?? null;

  if (!orgId) {
    // Try session token from X-Session-Token header
    const sessionToken = request.headers.get("x-session-token");
    if (sessionToken) {
      const session = await validateSessionToken(sessionToken);
      orgId = session?.orgId ?? null;
    }
  }

  const corsHeaders = buildCorsHeaders(request, []);

  if (!orgId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Valid API key or session token required" } },
      { status: 401, headers: corsHeaders }
    );
  }

  const { messageId } = await params;
  const body = await request.json();
  const { feedback } = body;

  if (!feedback || !["thumbs_up", "thumbs_down"].includes(feedback)) {
    return Response.json(
      { error: "Invalid feedback" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Verify the message belongs to a conversation owned by this org
  const [msg] = await db
    .select({ id: messages.id })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(messages.id, messageId),
        eq(conversations.organizationId, orgId)
      )
    )
    .limit(1);

  if (!msg) {
    return Response.json(
      { error: "Message not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  await db
    .update(messages)
    .set({ feedback, feedbackAt: new Date() })
    .where(eq(messages.id, messageId));

  return Response.json({ success: true }, { headers: corsHeaders });
}
