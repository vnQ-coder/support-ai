/**
 * Advanced search query for conversations.
 * Supports full-text search, status/channel filters, tag filters, assignee, and date range.
 */

import {
  db,
  conversations,
  contacts,
  members,
  eq,
  and,
  isNull,
  gte,
  lte,
  desc,
  count,
  sql,
} from "@repo/db";

export interface SearchParams {
  query?: string;
  status?: string;
  channel?: string;
  tagIds?: string[];
  assigneeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  conversations: {
    id: string;
    subject: string | null;
    channel: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    contactName: string | null;
    contactEmail: string | null;
    assigneeName: string | null;
  }[];
  total: number;
  page: number;
  limit: number;
}

export async function searchConversations(
  orgId: string,
  params: SearchParams
): Promise<SearchResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, params.limit ?? 20);
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  // Using sql`` for type-flexible condition building
  const conditions: ReturnType<typeof eq>[] = [
    eq(conversations.organizationId, orgId),
    isNull(conversations.deletedAt),
  ];

  if (params.status && params.status !== "all") {
    conditions.push(eq(conversations.status, params.status));
  }
  if (params.channel && params.channel !== "all") {
    conditions.push(eq(conversations.channel, params.channel));
  }
  if (params.assigneeId) {
    conditions.push(eq(conversations.assigneeId, params.assigneeId));
  }
  if (params.dateFrom) {
    conditions.push(
      gte(conversations.createdAt, params.dateFrom) as ReturnType<typeof eq>
    );
  }
  if (params.dateTo) {
    conditions.push(
      lte(conversations.createdAt, params.dateTo) as ReturnType<typeof eq>
    );
  }

  if (params.query) {
    conditions.push(
      sql`to_tsvector('english', coalesce(${conversations.subject}, '')) @@ plainto_tsquery('english', ${params.query})` as unknown as ReturnType<
        typeof eq
      >
    );
  }

  for (const tagId of params.tagIds ?? []) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = ${conversations.id} AND ct.tag_id = ${tagId})` as unknown as ReturnType<
        typeof eq
      >
    );
  }

  const whereClause = and(...conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        channel: conversations.channel,
        status: conversations.status,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        contactName: contacts.name,
        contactEmail: contacts.email,
        assigneeName: members.name,
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(members, eq(conversations.assigneeId, members.id))
      .where(whereClause)
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(conversations)
      .where(whereClause),
  ]);

  return {
    conversations: rows,
    total: totalRows[0]?.count ?? 0,
    page,
    limit,
  };
}
