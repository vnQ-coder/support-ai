import {
  db,
  conversations,
  contacts,
  members,
  eq,
  and,
  isNull,
  asc,
  count,
} from "@repo/db";

export type EscalatedConversation = {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
};

export async function getEscalatedConversations(orgId: string): Promise<EscalatedConversation[]> {
  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      channel: conversations.channel,
      status: conversations.status,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      contactId: contacts.id,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactAvatarUrl: contacts.avatarUrl,
      assigneeId: members.id,
      assigneeName: members.name,
      assigneeAvatarUrl: members.avatarUrl,
    })
    .from(conversations)
    .leftJoin(contacts, eq(conversations.contactId, contacts.id))
    .leftJoin(members, eq(conversations.assigneeId, members.id))
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.status, "escalated"),
        isNull(conversations.deletedAt)
      )
    )
    .orderBy(asc(conversations.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    channel: r.channel,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    contact: r.contactId
      ? { id: r.contactId, name: r.contactName, email: r.contactEmail, avatarUrl: r.contactAvatarUrl }
      : null,
    assignee: r.assigneeId
      ? { id: r.assigneeId, name: r.assigneeName, avatarUrl: r.assigneeAvatarUrl }
      : null,
  }));
}

export async function getEscalationStats(orgId: string) {
  const all = await db
    .select({
      id: conversations.id,
      assigneeId: conversations.assigneeId,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.status, "escalated"),
        isNull(conversations.deletedAt)
      )
    );

  const total = all.length;
  const unassigned = all.filter((c) => !c.assigneeId).length;
  const now = Date.now();
  const avgWaitMs = total > 0
    ? all.reduce((sum, c) => sum + (now - c.updatedAt.getTime()), 0) / total
    : 0;

  return {
    total,
    unassigned,
    avgWaitMinutes: Math.round(avgWaitMs / 60000),
  };
}

export async function getEscalationCount(orgId: string): Promise<number> {
  const [r] = await db
    .select({ count: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.status, "escalated"),
        isNull(conversations.deletedAt)
      )
    );
  return r?.count ?? 0;
}
