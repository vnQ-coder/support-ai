/**
 * Dashboard proxy for analytics CSV export.
 *
 * Authenticates via Clerk, queries the database directly, and returns
 * daily aggregate analytics as CSV.
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  db,
  organizations,
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

const HEADERS_CSV =
  "date,total_conversations,resolved,escalated,avg_response_time_min,avg_csat_score";

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
    const csv = mockRows.length > 0 ? toCSV(mockRows) : HEADERS_CSV;
    const today = new Date().toISOString().split("T")[0];
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${today}.csv"`,
      },
    });
  }

  // 5. Query daily aggregates (tenant-scoped)
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
        eq(conversations.organizationId, org.id),
        gte(conversations.createdAt, fromDate),
        lte(conversations.createdAt, toDate),
        isNull(conversations.deletedAt)
      )
    )
    .groupBy(dateTrunc)
    .orderBy(dateTrunc);

  // Avg response time per day via lateral join
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
    WHERE c.organization_id = ${org.id}
      AND c.created_at >= ${fromDate.toISOString()}
      AND c.created_at <= ${toDate.toISOString()}
      AND c.deleted_at IS NULL
    GROUP BY date_trunc('day', c.created_at)::date
    ORDER BY date_trunc('day', c.created_at)::date
  `);

  const responseTimeMap = new Map<string, string>();
  for (const row of avgResponseTimeSq.rows as Array<{
    date: string;
    avg_response_time_min: string;
  }>) {
    responseTimeMap.set(String(row.date), String(row.avg_response_time_min));
  }

  // 6. Build CSV
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

  const csv = csvRows.length > 0 ? toCSV(csvRows) : HEADERS_CSV;
  const today = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${today}.csv"`,
    },
  });
}
