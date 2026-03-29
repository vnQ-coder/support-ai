/**
 * Contact queries -- plain async functions called from Server Components.
 * All queries are scoped by organizationId for tenant isolation.
 */

import {
  db,
  contacts,
  conversations,
  messages,
  eq,
  and,
  desc,
  count,
  sql,
  isNull,
} from "@repo/db";

// ---- Types ----------------------------------------------------------------

export interface ContactListItem {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  channel: string;
  conversationCount: number;
  lastContactAt: string;
  createdAt: string;
}

export interface ContactDetail {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContactConversation {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ContactListResult {
  items: ContactListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Queries --------------------------------------------------------------

export async function getContacts(
  orgId: string,
  opts: { search?: string; page?: number; limit?: number } = {}
): Promise<ContactListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.limit ?? 20));
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions = [
    eq(contacts.organizationId, orgId),
    isNull(contacts.deletedAt),
  ];

  if (opts.search && opts.search.trim().length > 0) {
    const term = `%${opts.search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(LOWER(${contacts.name}) LIKE ${term} OR LOWER(${contacts.email}) LIKE ${term})`
    );
  }

  const whereClause = and(...conditions);

  // Count total
  const [countResult] = await db
    .select({ total: count() })
    .from(contacts)
    .where(whereClause);

  const total = countResult?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Subquery: conversation count per contact
  const convCountSq = db
    .select({
      contactId: conversations.contactId,
      convCount: count().as("conv_count"),
      lastConvAt: sql<Date>`MAX(${conversations.updatedAt})`.as("last_conv_at"),
      latestChannel: sql<string>`(
        SELECT ${conversations.channel}
        FROM ${conversations} c2
        WHERE c2.contact_id = ${conversations.contactId}
        ORDER BY c2.updated_at DESC
        LIMIT 1
      )`.as("latest_channel"),
    })
    .from(conversations)
    .where(eq(conversations.organizationId, orgId))
    .groupBy(conversations.contactId)
    .as("conv_stats");

  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      avatarUrl: contacts.avatarUrl,
      createdAt: contacts.createdAt,
      conversationCount: convCountSq.convCount,
      lastContactAt: convCountSq.lastConvAt,
      channel: convCountSq.latestChannel,
    })
    .from(contacts)
    .leftJoin(convCountSq, eq(contacts.id, convCountSq.contactId))
    .where(whereClause)
    .orderBy(desc(contacts.createdAt))
    .limit(pageSize)
    .offset(offset);

  const items: ContactListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    channel: row.channel ?? "web_chat",
    conversationCount: Number(row.conversationCount ?? 0),
    lastContactAt: row.lastContactAt
      ? new Date(row.lastContactAt).toISOString()
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

export async function getContact(
  orgId: string,
  contactId: string
): Promise<ContactDetail | null> {
  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      avatarUrl: contacts.avatarUrl,
      metadata: contacts.metadata,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.id, contactId),
        eq(contacts.organizationId, orgId),
        isNull(contacts.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getContactConversations(
  orgId: string,
  contactId: string
): Promise<ContactConversation[]> {
  // Subquery for message count per conversation
  const msgCountSq = db
    .select({
      conversationId: messages.conversationId,
      msgCount: count().as("msg_count"),
    })
    .from(messages)
    .groupBy(messages.conversationId)
    .as("msg_stats");

  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      channel: conversations.channel,
      status: conversations.status,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: msgCountSq.msgCount,
    })
    .from(conversations)
    .leftJoin(msgCountSq, eq(conversations.id, msgCountSq.conversationId))
    .where(
      and(
        eq(conversations.contactId, contactId),
        eq(conversations.organizationId, orgId)
      )
    )
    .orderBy(desc(conversations.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    channel: row.channel,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messageCount: Number(row.messageCount ?? 0),
  }));
}
