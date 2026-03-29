/**
 * GET /api/v1/export/analytics — Export daily analytics aggregates as CSV.
 *
 * Query params:
 *   from — ISO date string (required)
 *   to   — ISO date string (required)
 *
 * Auth: Bearer API key
 * Rate limit: apiRatelimit (100/min per org)
 *
 * Columns: date, total_conversations, resolved, escalated,
 *          avg_response_time_min, avg_csat_score
 */

import { validateApiKey, apiError } from "../../_lib/auth";
import { apiRatelimit, checkRatelimit } from "../../_lib/ratelimit";
import {
  db,
  conversations,
  messages,
  eq,
  and,
  gte,
  lte,
  count,
  avg,
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

function parseISODate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

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
    `export:analytics:${auth.organizationId}`
  );
  if (!rl.allowed) {
    return apiError("rate_limited", "Too many requests. Try again later.", 429);
  }

  // 3. Parse query params
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (!fromParam || !toParam) {
    return apiError(
      "bad_request",
      "Both 'from' and 'to' query parameters are required (ISO date strings)",
      400
    );
  }

  const fromDate = parseISODate(fromParam);
  const toDate = parseISODate(toParam);

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

  // 4. DEV_MODE fallback
  if (!process.env.DATABASE_URL) {
    const mockRows = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dateStr = current.toISOString().split("T")[0]!;
      mockRows.push({
        date: dateStr,
        total_conversations: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 30) + 5,
        escalated: Math.floor(Math.random() * 10),
        avg_response_time_min: (Math.random() * 10 + 1).toFixed(1),
        avg_csat_score: (Math.random() * 2 + 3).toFixed(1),
      });
      current.setDate(current.getDate() + 1);
    }

    const csv = toCSV(mockRows);
    const today = new Date().toISOString().split("T")[0];
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${today}.csv"`,
      },
    });
  }

  // 5. Query daily aggregates
  // We group conversations by date (truncated to day) and compute:
  //   - total conversations created that day
  //   - resolved count (status = 'resolved')
  //   - escalated count (status = 'escalated')
  //   - avg CSAT score (where not null)
  //
  // For avg_response_time we compute the average time between the first
  // customer message and the first AI/agent reply within each conversation
  // via a subquery. This is approximated by (first reply createdAt - conversation createdAt).

  const dateTrunc = sql<string>`date_trunc('day', ${conversations.createdAt})::date`;

  const rows = await db
    .select({
      date: dateTrunc.as("date"),
      totalConversations: count().as("total_conversations"),
      resolved:
        sql<number>`COUNT(*) FILTER (WHERE ${conversations.status} = 'resolved')`.as(
          "resolved"
        ),
      escalated:
        sql<number>`COUNT(*) FILTER (WHERE ${conversations.status} = 'escalated')`.as(
          "escalated"
        ),
      avgCsatScore: avg(conversations.csatScore).as("avg_csat_score"),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, auth.organizationId),
        gte(conversations.createdAt, fromDate),
        lte(conversations.createdAt, toDate),
        isNull(conversations.deletedAt)
      )
    )
    .groupBy(dateTrunc)
    .orderBy(dateTrunc);

  // Compute avg response time per day from the messages table.
  // First reply = earliest message with sender != 'customer' per conversation.
  const avgResponseTimeSq = await db.execute(sql`
    SELECT
      date_trunc('day', c.created_at)::date AS date,
      ROUND(AVG(EXTRACT(EPOCH FROM (first_reply.created_at - c.created_at)) / 60)::numeric, 1) AS avg_response_time_min
    FROM conversations c
    INNER JOIN LATERAL (
      SELECT m.created_at
      FROM messages m
      WHERE m.conversation_id = c.id AND m.sender != 'customer'
      ORDER BY m.created_at ASC
      LIMIT 1
    ) first_reply ON true
    WHERE c.organization_id = ${auth.organizationId}
      AND c.created_at >= ${fromDate.toISOString()}
      AND c.created_at <= ${toDate.toISOString()}
      AND c.deleted_at IS NULL
    GROUP BY date_trunc('day', c.created_at)::date
    ORDER BY date_trunc('day', c.created_at)::date
  `);

  // Build a map of date -> avg response time
  const responseTimeMap = new Map<string, string>();
  for (const row of avgResponseTimeSq.rows as Array<{
    date: string;
    avg_response_time_min: string;
  }>) {
    responseTimeMap.set(String(row.date), String(row.avg_response_time_min));
  }

  // 6. Transform to flat CSV rows
  const csvRows = rows.map((row) => {
    const dateStr = String(row.date);
    return {
      date: dateStr,
      total_conversations: row.totalConversations,
      resolved: row.resolved,
      escalated: row.escalated,
      avg_response_time_min: responseTimeMap.get(dateStr) ?? "",
      avg_csat_score: row.avgCsatScore
        ? Number(row.avgCsatScore).toFixed(1)
        : "",
    };
  });

  // Return CSV with headers even if empty
  const csv =
    csvRows.length > 0
      ? toCSV(csvRows)
      : "date,total_conversations,resolved,escalated,avg_response_time_min,avg_csat_score";

  const today = new Date().toISOString().split("T")[0];
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${today}.csv"`,
    },
  });
}
