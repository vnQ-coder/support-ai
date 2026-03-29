/**
 * Dashboard proxy for conversation CSV export.
 *
 * Authenticates via Clerk, queries the database directly using the
 * shared @repo/db package (same tenant-scoped pattern as other dashboard
 * queries), and returns CSV. This avoids exposing API keys to the browser.
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  db,
  organizations,
  conversations,
  contacts,
  messages,
  eq,
  and,
  gte,
  lte,
  count,
  isNull,
} from "@repo/db";

// ---- CSV helper -------------------------------------------------------------

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

const HEADERS_CSV = "id,contact_name,contact_email,channel,status,subject,created_at,resolved_at,csat_score,message_count";

// ---- Handler ----------------------------------------------------------------

export async function GET(request: NextRequest) {
  // 1. Authenticate with Clerk
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new Response(
      JSON.stringify({ error: { code: "unauthorized", message: "Not authenticated" } }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Look up internal org ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, orgId),
  });
  if (!org) {
    return new Response(
      JSON.stringify({ error: { code: "not_found", message: "Organization not found" } }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Parse and validate query params
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const statusParam = url.searchParams.get("status");

  if (!fromParam || !toParam) {
    return new Response(
      JSON.stringify({ error: { code: "bad_request", message: "'from' and 'to' are required" } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const fromDate = new Date(fromParam);
  const toDate = new Date(toParam);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return new Response(
      JSON.stringify({ error: { code: "bad_request", message: "Invalid date format" } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    const today = new Date().toISOString().split("T")[0];
    const csv =
      HEADERS_CSV +
      '\n"conv_demo_1","Jane Doe","jane@example.com","web_chat","resolved","Password reset","2025-03-01T10:00:00Z","2025-03-01T10:15:00Z","5","4"';
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conversations-${today}.csv"`,
      },
    });
  }

  // 5. Build query conditions (tenant-scoped)
  const conditions = [
    eq(conversations.organizationId, org.id),
    gte(conversations.createdAt, fromDate),
    lte(conversations.createdAt, toDate),
    isNull(conversations.deletedAt),
  ];

  if (statusParam) {
    conditions.push(eq(conversations.status, statusParam));
  }

  // Message count subquery
  const msgCountSq = db
    .select({
      conversationId: messages.conversationId,
      messageCount: count().as("message_count"),
    })
    .from(messages)
    .groupBy(messages.conversationId)
    .as("msg_count");

  const rows = await db
    .select({
      id: conversations.id,
      contactName: contacts.name,
      contactEmail: contacts.email,
      channel: conversations.channel,
      status: conversations.status,
      subject: conversations.subject,
      createdAt: conversations.createdAt,
      resolvedAt: conversations.resolvedAt,
      csatScore: conversations.csatScore,
      messageCount: msgCountSq.messageCount,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .leftJoin(msgCountSq, eq(conversations.id, msgCountSq.conversationId))
    .where(and(...conditions))
    .orderBy(conversations.createdAt);

  // 6. Build CSV
  const csvRows = rows.map((row) => ({
    id: row.id,
    contact_name: row.contactName ?? "",
    contact_email: row.contactEmail ?? "",
    channel: row.channel,
    status: row.status,
    subject: row.subject ?? "",
    created_at: row.createdAt.toISOString(),
    resolved_at: row.resolvedAt?.toISOString() ?? "",
    csat_score: row.csatScore ?? "",
    message_count: row.messageCount ?? 0,
  }));

  const csv = csvRows.length > 0 ? toCSV(csvRows) : HEADERS_CSV;
  const today = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversations-${today}.csv"`,
    },
  });
}
