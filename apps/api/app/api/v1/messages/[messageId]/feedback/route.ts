import { NextRequest } from "next/server";
import { db } from "@repo/db";
import { messages } from "@repo/db";
import { eq } from "drizzle-orm";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const body = await request.json();
  const { feedback } = body;

  if (!feedback || !["thumbs_up", "thumbs_down"].includes(feedback)) {
    return Response.json(
      { error: "Invalid feedback" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  await db
    .update(messages)
    .set({ feedback, feedbackAt: new Date() })
    .where(eq(messages.id, messageId));

  return Response.json({ success: true }, { headers: CORS_HEADERS });
}
