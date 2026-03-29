/**
 * Analytics data queries -- plain async functions (NOT server actions).
 * Called from Server Components and run on the server.
 *
 * When DATABASE_URL is not set (local dev without DB), returns mock data.
 */

import type { DateRange } from "@/lib/dashboard-utils";
import { db, conversations, messages, contacts, members } from "@repo/db";
import { eq, and, gte, lte, count, avg, sql, desc, isNull } from "@repo/db";

const DEV_MODE = !process.env.DATABASE_URL;

// ---- Types ----------------------------------------------------------------

export interface ConversationFunnel {
  total: number;
  aiResolved: number;
  humanResolved: number;
  escalated: number;
  abandoned: number;
}

export interface AIPerformance {
  avgConfidence: number;
  avgResponseTime: number;
  resolutionRate: number;
  topFailedTopics: { topic: string; count: number }[];
}

export interface ChannelDistributionItem {
  channel: string;
  count: number;
  percentage: number;
}

export interface ResponseTimeBucket {
  bucket: "<1m" | "1-5m" | "5-15m" | "15-30m" | "30m+";
  count: number;
}

export interface AgentPerformanceRow {
  agentName: string;
  conversationsHandled: number;
  avgResponseTime: number;
  avgCsat: number;
  resolutionRate: number;
}

export interface CsatBreakdownItem {
  score: number;
  count: number;
  percentage: number;
}

export interface KnowledgeGapItem {
  query: string;
  occurrences: number;
  avgConfidence: number;
  lastAsked: string;
}

export interface HourlyVolumeItem {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface TrendDataPoint {
  date: string;
  conversations: number;
  aiResolved: number;
  avgCsat: number;
  avgConfidence: number;
}

// ---- Mock helpers -----------------------------------------------------------

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

function generateDailyDates(from: Date, to: Date): string[] {
  const days: string[] = [];
  const current = new Date(from);
  while (current <= to) {
    days.push(current.toISOString().split("T")[0]!);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// ---- Mock data functions ---------------------------------------------------

function getMockConversationFunnel(): ConversationFunnel {
  return {
    total: 847,
    aiResolved: 525,
    humanResolved: 189,
    escalated: 78,
    abandoned: 55,
  };
}

function getMockAIPerformance(): AIPerformance {
  return {
    avgConfidence: 0.82,
    avgResponseTime: 1.3,
    resolutionRate: 62,
    topFailedTopics: [
      { topic: "Custom API integration setup", count: 23 },
      { topic: "Enterprise SSO configuration", count: 18 },
      { topic: "Billing plan downgrades", count: 15 },
      { topic: "Data export compliance", count: 12 },
      { topic: "Webhook retry policies", count: 9 },
    ],
  };
}

function getMockChannelDistribution(): ChannelDistributionItem[] {
  const data = [
    { channel: "web_chat", count: 523 },
    { channel: "email", count: 214 },
    { channel: "whatsapp", count: 110 },
  ];
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return data.map((d) => ({
    ...d,
    percentage: Math.round((d.count / total) * 100),
  }));
}

function getMockResponseTimeDistribution(): ResponseTimeBucket[] {
  return [
    { bucket: "<1m", count: 312 },
    { bucket: "1-5m", count: 278 },
    { bucket: "5-15m", count: 145 },
    { bucket: "15-30m", count: 72 },
    { bucket: "30m+", count: 40 },
  ];
}

function getMockAgentPerformance(): AgentPerformanceRow[] {
  return [
    { agentName: "Priya Sharma", conversationsHandled: 67, avgResponseTime: 3.2, avgCsat: 4.6, resolutionRate: 89 },
    { agentName: "Mike Torres", conversationsHandled: 52, avgResponseTime: 4.1, avgCsat: 4.3, resolutionRate: 82 },
    { agentName: "Sarah Chen", conversationsHandled: 48, avgResponseTime: 2.8, avgCsat: 4.7, resolutionRate: 91 },
    { agentName: "David Kim", conversationsHandled: 34, avgResponseTime: 5.6, avgCsat: 4.1, resolutionRate: 76 },
    { agentName: "Lisa Rodriguez", conversationsHandled: 28, avgResponseTime: 3.9, avgCsat: 4.4, resolutionRate: 85 },
  ];
}

function getMockCsatBreakdown(): CsatBreakdownItem[] {
  const data = [
    { score: 5, count: 312 },
    { score: 4, count: 198 },
    { score: 3, count: 87 },
    { score: 2, count: 34 },
    { score: 1, count: 16 },
  ];
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return data.map((d) => ({
    ...d,
    percentage: Math.round((d.count / total) * 100),
  }));
}

function getMockKnowledgeGaps(): KnowledgeGapItem[] {
  return [
    { query: "How to configure custom SAML SSO?", occurrences: 23, avgConfidence: 0.31, lastAsked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { query: "Can I downgrade from Pro to Starter mid-cycle?", occurrences: 18, avgConfidence: 0.28, lastAsked: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { query: "What are the webhook retry policies?", occurrences: 15, avgConfidence: 0.42, lastAsked: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    { query: "How to export data for GDPR compliance?", occurrences: 12, avgConfidence: 0.35, lastAsked: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { query: "Is there a bulk import API for contacts?", occurrences: 9, avgConfidence: 0.39, lastAsked: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    { query: "How to set up Slack integration?", occurrences: 8, avgConfidence: 0.44, lastAsked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  ];
}

function getMockHourlyVolume(): HourlyVolumeItem[] {
  const items: HourlyVolumeItem[] = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    for (let hour = 0; hour < 24; hour++) {
      const isBusinessHours = hour >= 9 && hour <= 17;
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const base = isBusinessHours && isWeekday ? 15 : isWeekday ? 4 : 2;
      const seed = seededRandom(`heatmap-${dayOfWeek}-${hour}`);
      items.push({
        hour,
        dayOfWeek,
        count: Math.floor(seed * base) + (isBusinessHours ? 5 : 1),
      });
    }
  }
  return items;
}

function getMockTrends(from: Date, to: Date): TrendDataPoint[] {
  const days = generateDailyDates(from, to);
  return days.map((date) => ({
    date,
    conversations: Math.floor(seededRandom(`conv-${date}`) * 30) + 15,
    aiResolved: Math.floor(seededRandom(`ai-${date}`) * 20) + 8,
    avgCsat: Number((seededRandom(`csat-${date}`) * 1.5 + 3.5).toFixed(2)),
    avgConfidence: Number((seededRandom(`conf-${date}`) * 0.3 + 0.65).toFixed(2)),
  }));
}

// ---- Public query functions ------------------------------------------------

export async function getConversationFunnel(
  orgId: string,
  range: DateRange
): Promise<ConversationFunnel> {
  if (DEV_MODE) return getMockConversationFunnel();

  const rows = await db
    .select({
      total: count(),
      aiResolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.resolvedBy} = 'ai' AND ${conversations.status} = 'resolved')`,
      humanResolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.resolvedBy} = 'human' AND ${conversations.status} = 'resolved')`,
      escalated: sql<number>`COUNT(*) FILTER (WHERE ${conversations.status} = 'escalated')`,
      abandoned: sql<number>`COUNT(*) FILTER (WHERE ${conversations.status} = 'abandoned')`,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to)
      )
    );

  const row = rows[0];
  return {
    total: row?.total ?? 0,
    aiResolved: Number(row?.aiResolved ?? 0),
    humanResolved: Number(row?.humanResolved ?? 0),
    escalated: Number(row?.escalated ?? 0),
    abandoned: Number(row?.abandoned ?? 0),
  };
}

export async function getAIPerformance(
  orgId: string,
  range: DateRange
): Promise<AIPerformance> {
  if (DEV_MODE) return getMockAIPerformance();

  // Average confidence from AI messages
  const confidenceResult = await db
    .select({
      avgConf: avg(messages.confidence),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(messages.sender, "ai"),
        gte(messages.createdAt, range.from),
        lte(messages.createdAt, range.to)
      )
    );

  // Resolution rate
  const resolutionResult = await db
    .select({
      total: count(),
      aiResolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.resolvedBy} = 'ai' AND ${conversations.status} = 'resolved')`,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to)
      )
    );

  // Top failed topics: low confidence AI messages grouped by content snippet
  const failedTopics = await db
    .select({
      topic: sql<string>`LEFT(${messages.content}, 80)`,
      cnt: count(),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(messages.sender, "ai"),
        sql`${messages.confidence} < 0.5`,
        gte(messages.createdAt, range.from),
        lte(messages.createdAt, range.to)
      )
    )
    .groupBy(sql`LEFT(${messages.content}, 80)`)
    .orderBy(desc(count()))
    .limit(5);

  const total = resolutionResult[0]?.total ?? 0;
  const aiResolved = Number(resolutionResult[0]?.aiResolved ?? 0);

  return {
    avgConfidence: confidenceResult[0]?.avgConf
      ? Number(Number(confidenceResult[0].avgConf).toFixed(2))
      : 0,
    avgResponseTime: 1.3, // Placeholder — would need message timestamp diff
    resolutionRate: total > 0 ? Math.round((aiResolved / total) * 100) : 0,
    topFailedTopics: failedTopics.map((r) => ({
      topic: r.topic,
      count: r.cnt,
    })),
  };
}

export async function getChannelDistribution(
  orgId: string,
  range: DateRange
): Promise<ChannelDistributionItem[]> {
  if (DEV_MODE) return getMockChannelDistribution();

  const rows = await db
    .select({
      channel: conversations.channel,
      cnt: count(),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to)
      )
    )
    .groupBy(conversations.channel)
    .orderBy(desc(count()));

  const total = rows.reduce((sum, r) => sum + r.cnt, 0);
  return rows.map((r) => ({
    channel: r.channel,
    count: r.cnt,
    percentage: total > 0 ? Math.round((r.cnt / total) * 100) : 0,
  }));
}

export async function getResponseTimeDistribution(
  orgId: string,
  range: DateRange
): Promise<ResponseTimeBucket[]> {
  if (DEV_MODE) return getMockResponseTimeDistribution();

  // Calculate response time as diff between first customer message and first AI/agent reply
  const rows = await db
    .select({
      bucket: sql<string>`
        CASE
          WHEN EXTRACT(EPOCH FROM (MIN(reply.created_at) - MIN(first_msg.created_at))) / 60 < 1 THEN '<1m'
          WHEN EXTRACT(EPOCH FROM (MIN(reply.created_at) - MIN(first_msg.created_at))) / 60 < 5 THEN '1-5m'
          WHEN EXTRACT(EPOCH FROM (MIN(reply.created_at) - MIN(first_msg.created_at))) / 60 < 15 THEN '5-15m'
          WHEN EXTRACT(EPOCH FROM (MIN(reply.created_at) - MIN(first_msg.created_at))) / 60 < 30 THEN '15-30m'
          ELSE '30m+'
        END
      `,
      cnt: count(),
    })
    .from(conversations)
    .innerJoin(
      sql`LATERAL (SELECT created_at FROM messages WHERE messages.conversation_id = ${conversations.id} AND messages.sender = 'customer' ORDER BY created_at ASC LIMIT 1) AS first_msg`,
      sql`true`
    )
    .innerJoin(
      sql`LATERAL (SELECT created_at FROM messages WHERE messages.conversation_id = ${conversations.id} AND messages.sender != 'customer' ORDER BY created_at ASC LIMIT 1) AS reply`,
      sql`true`
    )
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to)
      )
    )
    .groupBy(sql`1`);

  const bucketOrder: Record<string, number> = {
    "<1m": 0,
    "1-5m": 1,
    "5-15m": 2,
    "15-30m": 3,
    "30m+": 4,
  };

  const allBuckets: ResponseTimeBucket["bucket"][] = [
    "<1m",
    "1-5m",
    "5-15m",
    "15-30m",
    "30m+",
  ];

  const lookup = new Map(rows.map((r) => [r.bucket, r.cnt]));

  return allBuckets.map((bucket) => ({
    bucket,
    count: lookup.get(bucket) ?? 0,
  }));
}

export async function getAgentPerformance(
  orgId: string,
  range: DateRange
): Promise<AgentPerformanceRow[]> {
  if (DEV_MODE) return getMockAgentPerformance();

  const rows = await db
    .select({
      agentName: members.name,
      conversationsHandled: count(),
      avgCsat: avg(conversations.csatScore),
      resolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.status} = 'resolved')`,
      total: count(),
    })
    .from(conversations)
    .innerJoin(members, eq(conversations.assigneeId, members.id))
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to),
        sql`${conversations.assigneeId} IS NOT NULL`
      )
    )
    .groupBy(members.id, members.name)
    .orderBy(desc(count()));

  return rows.map((r) => ({
    agentName: r.agentName ?? "Unknown",
    conversationsHandled: r.conversationsHandled,
    avgResponseTime: 3.5, // Placeholder
    avgCsat: r.avgCsat ? Number(Number(r.avgCsat).toFixed(1)) : 0,
    resolutionRate:
      r.total > 0
        ? Math.round((Number(r.resolved) / r.total) * 100)
        : 0,
  }));
}

export async function getCsatBreakdown(
  orgId: string,
  range: DateRange
): Promise<CsatBreakdownItem[]> {
  if (DEV_MODE) return getMockCsatBreakdown();

  const rows = await db
    .select({
      score: conversations.csatScore,
      cnt: count(),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to),
        sql`${conversations.csatScore} IS NOT NULL`
      )
    )
    .groupBy(conversations.csatScore)
    .orderBy(desc(conversations.csatScore));

  const total = rows.reduce((sum, r) => sum + r.cnt, 0);

  // Ensure all 5 scores are represented
  const lookup = new Map(rows.map((r) => [r.score, r.cnt]));
  return [5, 4, 3, 2, 1].map((score) => {
    const cnt = lookup.get(score) ?? 0;
    return {
      score,
      count: cnt,
      percentage: total > 0 ? Math.round((cnt / total) * 100) : 0,
    };
  });
}

export async function getKnowledgeGaps(
  orgId: string,
  range: DateRange
): Promise<KnowledgeGapItem[]> {
  if (DEV_MODE) return getMockKnowledgeGaps();

  // Find customer messages where the AI response had low confidence
  const rows = await db
    .select({
      query: sql<string>`LEFT(customer_msg.content, 120)`,
      occurrences: count(),
      avgConfidence: avg(messages.confidence),
      lastAsked: sql<string>`MAX(customer_msg.created_at)`,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(
      sql`messages AS customer_msg`,
      sql`customer_msg.conversation_id = ${conversations.id} AND customer_msg.sender = 'customer'`
    )
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(messages.sender, "ai"),
        sql`${messages.confidence} < 0.5`,
        gte(messages.createdAt, range.from),
        lte(messages.createdAt, range.to)
      )
    )
    .groupBy(sql`LEFT(customer_msg.content, 120)`)
    .orderBy(desc(count()))
    .limit(10);

  return rows.map((r) => ({
    query: r.query,
    occurrences: r.occurrences,
    avgConfidence: r.avgConfidence
      ? Number(Number(r.avgConfidence).toFixed(2))
      : 0,
    lastAsked: r.lastAsked,
  }));
}

export async function getHourlyVolume(
  orgId: string,
  range: DateRange
): Promise<HourlyVolumeItem[]> {
  if (DEV_MODE) return getMockHourlyVolume();

  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${conversations.createdAt})::int`,
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${conversations.createdAt})::int`,
      cnt: count(),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to)
      )
    )
    .groupBy(
      sql`EXTRACT(HOUR FROM ${conversations.createdAt})`,
      sql`EXTRACT(DOW FROM ${conversations.createdAt})`
    );

  // Fill the full 7x24 grid
  const lookup = new Map(
    rows.map((r) => [`${r.dayOfWeek}-${r.hour}`, r.cnt])
  );

  const items: HourlyVolumeItem[] = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    for (let hour = 0; hour < 24; hour++) {
      items.push({
        hour,
        dayOfWeek,
        count: lookup.get(`${dayOfWeek}-${hour}`) ?? 0,
      });
    }
  }
  return items;
}

export async function getTrends(
  orgId: string,
  range: DateRange
): Promise<TrendDataPoint[]> {
  if (DEV_MODE) return getMockTrends(range.from, range.to);

  const days = generateDailyDates(range.from, range.to);

  const rows = await db
    .select({
      date: sql<string>`DATE(${conversations.createdAt})`.as("date"),
      conversations: count(),
      aiResolved: sql<number>`COUNT(*) FILTER (WHERE ${conversations.resolvedBy} = 'ai' AND ${conversations.status} = 'resolved')`,
      avgCsat: sql<number>`COALESCE(AVG(${conversations.csatScore}) FILTER (WHERE ${conversations.csatScore} IS NOT NULL), 0)`,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        gte(conversations.createdAt, range.from),
        lte(conversations.createdAt, range.to)
      )
    )
    .groupBy(sql`DATE(${conversations.createdAt})`)
    .orderBy(sql`DATE(${conversations.createdAt})`);

  const lookup = new Map(rows.map((r) => [r.date, r]));

  return days.map((date) => {
    const row = lookup.get(date);
    return {
      date,
      conversations: row ? row.conversations : 0,
      aiResolved: row ? Number(row.aiResolved) : 0,
      avgCsat: row ? Number(Number(row.avgCsat).toFixed(2)) : 0,
      avgConfidence: 0, // Would require joining messages table per day
    };
  });
}

// ---- CSV export helper -----------------------------------------------------

export async function getAllAnalyticsData(orgId: string, range: DateRange) {
  const [
    funnel,
    aiPerf,
    channels,
    responseTimes,
    agents,
    csat,
    gaps,
    trends,
  ] = await Promise.all([
    getConversationFunnel(orgId, range),
    getAIPerformance(orgId, range),
    getChannelDistribution(orgId, range),
    getResponseTimeDistribution(orgId, range),
    getAgentPerformance(orgId, range),
    getCsatBreakdown(orgId, range),
    getKnowledgeGaps(orgId, range),
    getTrends(orgId, range),
  ]);

  return { funnel, aiPerf, channels, responseTimes, agents, csat, gaps, trends };
}
