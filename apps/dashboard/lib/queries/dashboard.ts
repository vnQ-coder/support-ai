/**
 * Dashboard data queries -- plain async functions (NOT server actions).
 * These are called from Server Components and run on the server.
 *
 * When DATABASE_URL is not set (local dev without DB), returns mock data.
 */

import type { DateRange } from "@/lib/dashboard-utils";
import { calculateDelta } from "@/lib/dashboard-utils";
import { db, conversations, contacts, members } from "@repo/db";
import { eq, and, gte, lte, count, avg, sql, desc, inArray } from "drizzle-orm";

// ---- Types ----------------------------------------------------------------

export interface KPIData {
  label: string;
  value: number;
  previousValue: number;
  delta: number;
  format: "count" | "percentage" | "hours" | "csat";
}

export interface KPISummary {
  totalConversations: KPIData;
  aiResolutionRate: KPIData;
  avgCsat: KPIData;
  timeSaved: KPIData;
}

export interface VolumeDataPoint {
  date: string;
  aiResolved: number;
  humanResolved: number;
}

export interface CsatResolutionDataPoint {
  date: string;
  avgCsat: number;
  resolutionRate: number;
}

export interface EscalatedConversation {
  id: string;
  subject: string;
  contactName: string;
  contactEmail: string;
  channel: string;
  createdAt: string;
  assigneeName: string | null;
}

// ---- Mock helpers ----------------------------------------------------------

function generateDailyData(from: Date, to: Date) {
  const days: string[] = [];
  const current = new Date(from);
  while (current <= to) {
    days.push(current.toISOString().split("T")[0]!);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

const DEV_MODE = !process.env.DATABASE_URL;

// ---- Mock data functions ---------------------------------------------------

function getMockKPIs(): KPISummary {
  const currentTotal = 847;
  const previousTotal = 723;
  const currentAiRate = 62;
  const previousAiRate = 55;
  const currentCsat = 4.3;
  const previousCsat = 4.1;
  const currentTimeSaved = 71;
  const previousTimeSaved = 58;

  return {
    totalConversations: {
      label: "Total Conversations",
      value: currentTotal,
      previousValue: previousTotal,
      delta: calculateDelta(currentTotal, previousTotal),
      format: "count",
    },
    aiResolutionRate: {
      label: "AI Resolution Rate",
      value: currentAiRate,
      previousValue: previousAiRate,
      delta: calculateDelta(currentAiRate, previousAiRate),
      format: "percentage",
    },
    avgCsat: {
      label: "Avg. CSAT",
      value: currentCsat,
      previousValue: previousCsat,
      delta: calculateDelta(currentCsat, previousCsat),
      format: "csat",
    },
    timeSaved: {
      label: "Time Saved",
      value: currentTimeSaved,
      previousValue: previousTimeSaved,
      delta: calculateDelta(currentTimeSaved, previousTimeSaved),
      format: "hours",
    },
  };
}

function getMockNeedsAttention(): EscalatedConversation[] {
  return [
    {
      id: "conv_1",
      subject: "Billing issue \u2014 double charged",
      contactName: "Emma Wilson",
      contactEmail: "emma@example.com",
      channel: "web_chat",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      assigneeName: null,
    },
    {
      id: "conv_2",
      subject: "Integration not syncing data",
      contactName: "James Chen",
      contactEmail: "james@example.com",
      channel: "email",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      assigneeName: "Priya Sharma",
    },
    {
      id: "conv_3",
      subject: "Cannot access account settings",
      contactName: "Sarah Johnson",
      contactEmail: "sarah@example.com",
      channel: "web_chat",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      assigneeName: null,
    },
    {
      id: "conv_4",
      subject: "Feature request: bulk export",
      contactName: "David Park",
      contactEmail: "david@example.com",
      channel: "email",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      assigneeName: "Mike Torres",
    },
    {
      id: "conv_5",
      subject: "Webhook delivery failures",
      contactName: "Lisa Rodriguez",
      contactEmail: "lisa@example.com",
      channel: "web_chat",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      assigneeName: null,
    },
  ];
}

// ---- Real query helpers ----------------------------------------------------

const AVG_HANDLE_TIME_MINUTES = 12;

async function countConversationsInRange(
  orgId: string,
  from: Date,
  to: Date
): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, from),
        lte(conversations.createdAt, to)
      )
    );
  return result[0]?.total ?? 0;
}

async function aiResolvedCountInRange(
  orgId: string,
  from: Date,
  to: Date
): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.status, "resolved"),
        eq(conversations.resolvedBy, "ai"),
        gte(conversations.createdAt, from),
        lte(conversations.createdAt, to)
      )
    );
  return result[0]?.total ?? 0;
}

async function avgCsatInRange(
  orgId: string,
  from: Date,
  to: Date
): Promise<number> {
  const result = await db
    .select({ avgScore: avg(conversations.csatScore) })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, from),
        lte(conversations.createdAt, to),
        sql`${conversations.csatScore} IS NOT NULL`
      )
    );
  return result[0]?.avgScore ? Number(result[0].avgScore) : 0;
}

// ---- Public query functions ------------------------------------------------

export async function getKPIs(
  range: { current: DateRange; previous: DateRange },
  orgId?: string
): Promise<KPISummary> {
  if (DEV_MODE || !orgId) return getMockKPIs();

  const [currentTotal, previousTotal, currentAiResolved, previousAiResolved, currentCsat, previousCsat] =
    await Promise.all([
      countConversationsInRange(orgId, range.current.from, range.current.to),
      countConversationsInRange(orgId, range.previous.from, range.previous.to),
      aiResolvedCountInRange(orgId, range.current.from, range.current.to),
      aiResolvedCountInRange(orgId, range.previous.from, range.previous.to),
      avgCsatInRange(orgId, range.current.from, range.current.to),
      avgCsatInRange(orgId, range.previous.from, range.previous.to),
    ]);

  const currentAiRate = currentTotal > 0 ? Math.round((currentAiResolved / currentTotal) * 100) : 0;
  const previousAiRate = previousTotal > 0 ? Math.round((previousAiResolved / previousTotal) * 100) : 0;

  const currentTimeSaved = Math.round(
    (currentAiResolved * AVG_HANDLE_TIME_MINUTES) / 60
  );
  const previousTimeSaved = Math.round(
    (previousAiResolved * AVG_HANDLE_TIME_MINUTES) / 60
  );

  return {
    totalConversations: {
      label: "Total Conversations",
      value: currentTotal,
      previousValue: previousTotal,
      delta: calculateDelta(currentTotal, previousTotal),
      format: "count",
    },
    aiResolutionRate: {
      label: "AI Resolution Rate",
      value: currentAiRate,
      previousValue: previousAiRate,
      delta: calculateDelta(currentAiRate, previousAiRate),
      format: "percentage",
    },
    avgCsat: {
      label: "Avg. CSAT",
      value: currentCsat,
      previousValue: previousCsat,
      delta: calculateDelta(currentCsat, previousCsat),
      format: "csat",
    },
    timeSaved: {
      label: "Time Saved",
      value: currentTimeSaved,
      previousValue: previousTimeSaved,
      delta: calculateDelta(currentTimeSaved, previousTimeSaved),
      format: "hours",
    },
  };
}

export async function getVolumeTimeSeries(
  range: { current: DateRange },
  orgId?: string
): Promise<VolumeDataPoint[]> {
  const days = generateDailyData(range.current.from, range.current.to);

  if (DEV_MODE || !orgId) {
    return days.map((date) => ({
      date,
      aiResolved: Math.floor(seededRandom(`ai-${date}`) * 30) + 10,
      humanResolved: Math.floor(seededRandom(`human-${date}`) * 15) + 5,
    }));
  }

  // Query per-day AI-resolved vs human-resolved
  const rows = await db
    .select({
      date: sql<string>`DATE(${conversations.createdAt})`.as("date"),
      aiResolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.resolvedBy} = 'ai' AND ${conversations.status} = 'resolved')`.as("ai_resolved"),
      humanResolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.resolvedBy} = 'human' AND ${conversations.status} = 'resolved')`.as("human_resolved"),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.current.from),
        lte(conversations.createdAt, range.current.to)
      )
    )
    .groupBy(sql`DATE(${conversations.createdAt})`)
    .orderBy(sql`DATE(${conversations.createdAt})`);

  // Build a lookup from query results
  const lookup = new Map(rows.map((r) => [r.date, r]));

  return days.map((date) => {
    const row = lookup.get(date);
    return {
      date,
      aiResolved: row ? Number(row.aiResolved) : 0,
      humanResolved: row ? Number(row.humanResolved) : 0,
    };
  });
}

export async function getCsatResolutionTimeSeries(
  range: { current: DateRange },
  orgId?: string
): Promise<CsatResolutionDataPoint[]> {
  const days = generateDailyData(range.current.from, range.current.to);

  if (DEV_MODE || !orgId) {
    return days.map((date) => ({
      date,
      avgCsat: Number((seededRandom(`csat-${date}`) * 1.5 + 3.5).toFixed(2)),
      resolutionRate: Math.floor(seededRandom(`rate-${date}`) * 20) + 50,
    }));
  }

  const rows = await db
    .select({
      date: sql<string>`DATE(${conversations.createdAt})`.as("date"),
      avgCsat: sql<number>`COALESCE(AVG(${conversations.csatScore}) FILTER (WHERE ${conversations.csatScore} IS NOT NULL), 0)`.as("avg_csat"),
      total: sql<number>`COUNT(*)`.as("total"),
      resolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.status} = 'resolved')`.as("resolved"),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.current.from),
        lte(conversations.createdAt, range.current.to)
      )
    )
    .groupBy(sql`DATE(${conversations.createdAt})`)
    .orderBy(sql`DATE(${conversations.createdAt})`);

  const lookup = new Map(rows.map((r) => [r.date, r]));

  return days.map((date) => {
    const row = lookup.get(date);
    const total = row ? Number(row.total) : 0;
    const resolved = row ? Number(row.resolved) : 0;
    return {
      date,
      avgCsat: row ? Number(Number(row.avgCsat).toFixed(2)) : 0,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  });
}

export async function getNeedsAttention(
  orgId?: string
): Promise<EscalatedConversation[]> {
  if (DEV_MODE || !orgId) return getMockNeedsAttention();

  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      channel: conversations.channel,
      createdAt: conversations.createdAt,
      assigneeId: conversations.assigneeId,
      contactName: contacts.name,
      contactEmail: contacts.email,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(
      and(
        eq(conversations.organizationId, orgId),
        inArray(conversations.status, ["escalated", "waiting"])
      )
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(10);

  // Batch-load assignee names if any
  const assigneeIds = rows
    .map((r) => r.assigneeId)
    .filter((id): id is string => id !== null);

  let assigneeMap = new Map<string, string>();
  if (assigneeIds.length > 0) {
    const assignees = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(inArray(members.id, assigneeIds));
    assigneeMap = new Map(assignees.map((a) => [a.id, a.name ?? "Unknown"]));
  }

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject ?? "No subject",
    contactName: row.contactName ?? "Unknown",
    contactEmail: row.contactEmail ?? "",
    channel: row.channel,
    createdAt: row.createdAt.toISOString(),
    assigneeName: row.assigneeId
      ? assigneeMap.get(row.assigneeId) ?? null
      : null,
  }));
}

// ---- Escalation panel data ---------------------------------------------------

export interface EscalationSummaryData {
  totalEscalated: number;
  unassigned: number;
  conversations: Array<{
    id: string;
    subject: string;
    contactName: string;
    priority: string;
    assigneeName: string | null;
    escalatedAt: string;
  }>;
}

function getMockEscalationSummary(): EscalationSummaryData {
  return {
    totalEscalated: 3,
    unassigned: 2,
    conversations: [
      {
        id: "conv_1",
        subject: "Billing issue -- double charged",
        contactName: "Emma Wilson",
        priority: "high",
        assigneeName: null,
        escalatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "conv_3",
        subject: "Cannot access account settings",
        contactName: "Sarah Johnson",
        priority: "urgent",
        assigneeName: null,
        escalatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: "conv_2",
        subject: "Integration not syncing data",
        contactName: "James Chen",
        priority: "medium",
        assigneeName: "Priya Sharma",
        escalatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export async function getEscalationSummary(
  orgId?: string
): Promise<EscalationSummaryData> {
  if (DEV_MODE || !orgId) return getMockEscalationSummary();

  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      metadata: conversations.metadata,
      assigneeId: conversations.assigneeId,
      contactName: contacts.name,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.status, "escalated")
      )
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(10);

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
    assigneeMap = new Map(assignees.map((a) => [a.id, a.name ?? "Unknown"]));
  }

  const mapped = rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      subject: row.subject ?? "No subject",
      contactName: row.contactName ?? "Unknown",
      priority: (meta.escalationPriority as string) ?? "medium",
      assigneeName: row.assigneeId
        ? assigneeMap.get(row.assigneeId) ?? null
        : null,
      escalatedAt:
        (meta.escalatedAt as string) ?? row.updatedAt.toISOString(),
    };
  });

  const unassigned = mapped.filter((c) => c.assigneeName === null).length;

  return {
    totalEscalated: mapped.length,
    unassigned,
    conversations: mapped,
  };
}

export async function hasAnyConversations(orgId?: string): Promise<boolean> {
  if (DEV_MODE || !orgId) return true;

  const result = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.organizationId, orgId))
    .limit(1);

  return result.length > 0;
}
