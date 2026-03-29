/**
 * Conversation queries -- plain async functions called from Server Components.
 * All queries are scoped by organizationId for tenant isolation.
 */

import {
  db,
  conversations,
  contacts,
  members,
  messages,
  eq,
  and,
  or,
  desc,
  count,
  sql,
  ilike,
} from "@repo/db";

// ---- Types ----------------------------------------------------------------

export interface ConversationListItem {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  contactName: string | null;
  contactEmail: string | null;
  assigneeName: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  assigneeId: string | null;
  assigneeName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactCreatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  sender: string;
  content: string;
  confidence: number | null;
  sources: string[] | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface ConversationListResult {
  items: ConversationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Filters --------------------------------------------------------------

export interface ConversationFilters {
  status?: string;
  channel?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---- Queries --------------------------------------------------------------

export async function getConversations(
  orgId: string,
  filters: ConversationFilters = {}
): Promise<ConversationListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions = [eq(conversations.organizationId, orgId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(conversations.status, filters.status));
  }
  if (filters.channel && filters.channel !== "all") {
    conditions.push(eq(conversations.channel, filters.channel));
  }

  // Text search across subject, contact name, and contact email
  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    conditions.push(
      or(
        ilike(conversations.subject, pattern),
        ilike(contacts.name, pattern),
        ilike(contacts.email, pattern),
      )!
    );
  }

  const whereClause = and(...conditions);

  // Count total matching rows (join contacts when search is active)
  const countQuery = db
    .select({ total: count() })
    .from(conversations);

  if (searchTerm) {
    countQuery.innerJoin(contacts, eq(conversations.contactId, contacts.id));
  }

  const [countResult] = await countQuery.where(whereClause);

  const total = countResult?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Fetch conversations with contact join and latest message subquery
  const latestMessageSq = db
    .select({
      conversationId: messages.conversationId,
      lastMessageAt: sql<Date>`MAX(${messages.createdAt})`.as("last_message_at"),
    })
    .from(messages)
    .groupBy(messages.conversationId)
    .as("latest_msg");

  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      channel: conversations.channel,
      status: conversations.status,
      assigneeId: conversations.assigneeId,
      createdAt: conversations.createdAt,
      contactName: contacts.name,
      contactEmail: contacts.email,
      lastMessageAt: latestMessageSq.lastMessageAt,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .leftJoin(
      latestMessageSq,
      eq(conversations.id, latestMessageSq.conversationId)
    )
    .where(whereClause)
    .orderBy(desc(conversations.updatedAt))
    .limit(pageSize)
    .offset(offset);

  // Batch-load assignee names
  const assigneeIds = rows
    .map((r) => r.assigneeId)
    .filter((id): id is string => id !== null);

  let assigneeMap = new Map<string, string>();
  if (assigneeIds.length > 0) {
    const uniqueIds = [...new Set(assigneeIds)];
    const assignees = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(sql`${members.id} IN ${uniqueIds}`);
    assigneeMap = new Map(assignees.map((a) => [a.id, a.name ?? "Unknown"]));
  }

  const items: ConversationListItem[] = rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    channel: row.channel,
    status: row.status,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    assigneeName: row.assigneeId
      ? assigneeMap.get(row.assigneeId) ?? null
      : null,
    lastMessageAt: row.lastMessageAt
      ? new Date(row.lastMessageAt).toISOString()
      : row.createdAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getConversationById(
  orgId: string,
  conversationId: string
): Promise<ConversationDetail | null> {
  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      channel: conversations.channel,
      status: conversations.status,
      assigneeId: conversations.assigneeId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactCreatedAt: contacts.createdAt,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.organizationId, orgId)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Load assignee name if assigned
  let assigneeName: string | null = null;
  if (row.assigneeId) {
    const [assignee] = await db
      .select({ name: members.name })
      .from(members)
      .where(eq(members.id, row.assigneeId))
      .limit(1);
    assigneeName = assignee?.name ?? null;
  }

  return {
    id: row.id,
    subject: row.subject,
    channel: row.channel,
    status: row.status,
    assigneeId: row.assigneeId,
    assigneeName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactCreatedAt: row.contactCreatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getConversationMessages(
  conversationId: string
): Promise<MessageItem[]> {
  const rows = await db
    .select({
      id: messages.id,
      sender: messages.sender,
      content: messages.content,
      confidence: messages.confidence,
      sources: messages.sources,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return rows.map((row) => ({
    id: row.id,
    sender: row.sender,
    content: row.content,
    confidence: row.confidence,
    sources: row.sources,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getTeamMembers(
  orgId: string
): Promise<TeamMember[]> {
  const rows = await db
    .select({
      id: members.id,
      name: members.name,
      email: members.email,
      role: members.role,
    })
    .from(members)
    .where(eq(members.organizationId, orgId))
    .orderBy(members.name);

  return rows;
}
