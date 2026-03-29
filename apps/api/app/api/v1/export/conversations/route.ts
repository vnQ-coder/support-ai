/**
 * GET /api/v1/export/conversations — Export conversations as CSV.
 *
 * Query params:
 *   from  — ISO date string (required)
 *   to    — ISO date string (required)
 *   status — open | resolved | escalated (optional, all if omitted)
 *
 * Auth: Bearer API key
 * Rate limit: apiRatelimit (100/min per org)
 */

import { validateApiKey, apiError } from "../../_lib/auth";
import { apiRatelimit, checkRatelimit } from "../../_lib/ratelimit";
import {
  db,
  conversations,
  contacts,
  messages,
  eq,
  and,
  gte,
  lte,
  count,
  sql,
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

// ---- Validation -------------------------------------------------------------

function parseISODate(value: string | null, _label?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

const VALID_STATUSES = new Set(["active", "resolved", "escalated", "waiting"]);

// ---- Handler ----------------------------------------------------------------

export async function GET(request: Request) {
  // 1. Auth
  const auth = await validateApiKey(request);
  if (!auth) {
    return apiError("unauthorized", "Invalid or missing API key", 401);
  }

  // 2. Rate limit
  const rl = await checkRatelimit(
    apiRatelimit,
    `export:conversations:${auth.organizationId}`
  );
  if (!rl.allowed) {
    return apiError("rate_limited", "Too many requests. Try again later.", 429);
  }

  // 3. Parse query params
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const statusParam = url.searchParams.get("status");

  if (!fromParam || !toParam) {
    return apiError(
      "bad_request",
      "Both 'from' and 'to' query parameters are required (ISO date strings)",
      400
    );
  }

  const fromDate = parseISODate(fromParam, "from");
  const toDate = parseISODate(toParam, "to");

  if (!fromDate || !toDate) {
    return apiError(
      "bad_request",
      "Invalid date format. Use ISO 8601 (e.g. 2025-01-01T00:00:00Z)",
      400
    );
  }

  if (fromDate > toDate) {
    return apiError("bad_request", "'from' must be before 'to'", 400);
  }

  if (statusParam && !VALID_STATUSES.has(statusParam)) {
    return apiError(
      "bad_request",
      `Invalid status. Valid values: ${[...VALID_STATUSES].join(", ")}`,
      400
    );
  }

  // 4. DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    const mockRows = [
      {
        id: "conv_demo_1",
        contact_name: "Jane Doe",
        contact_email: "jane@example.com",
        channel: "web_chat",
        status: "resolved",
        subject: "How do I reset my password?",
        created_at: "2025-03-01T10:00:00Z",
        resolved_at: "2025-03-01T10:15:00Z",
        csat_score: 5,
        message_count: 4,
      },
      {
        id: "conv_demo_2",
        contact_name: "John Smith",
        contact_email: "john@example.com",
        channel: "email",
        status: "escalated",
        subject: "Billing issue with invoice #1234",
        created_at: "2025-03-02T14:30:00Z",
        resolved_at: "",
        csat_score: "",
        message_count: 7,
      },
    ];

    const csv = toCSV(mockRows);
    const today = new Date().toISOString().split("T")[0];
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conversations-${today}.csv"`,
      },
    });
  }

  // 5. Query conversations with contact info and message counts
  const conditions = [
    eq(conversations.organizationId, auth.organizationId),
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

  // 6. Transform to flat CSV rows
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

  // Return CSV with headers even if empty
  const csv =
    csvRows.length > 0
      ? toCSV(csvRows)
      : "id,contact_name,contact_email,channel,status,subject,created_at,resolved_at,csat_score,message_count";

  const today = new Date().toISOString().split("T")[0];
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversations-${today}.csv"`,
    },
  });
}
