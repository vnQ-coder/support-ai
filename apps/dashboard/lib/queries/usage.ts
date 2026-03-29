import {
  db,
  conversations,
  members,
  knowledgeSources,
  and,
  eq,
  gte,
  count,
  isNull,
} from "@repo/db";

export const PLAN_LIMITS = {
  starter:    { conversations: 1000,  teamMembers: 3,   knowledgeSources: 5 },
  growth:     { conversations: 5000,  teamMembers: 10,  knowledgeSources: 25 },
  scale:      { conversations: 20000, teamMembers: 50,  knowledgeSources: 100 },
  enterprise: { conversations: -1,    teamMembers: -1,  knowledgeSources: -1 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export async function getUsageMetrics(orgId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [convResult, memberResult, knowledgeResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.organizationId, orgId),
          gte(conversations.createdAt, monthStart),
          isNull(conversations.deletedAt)
        )
      ),
    db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.organizationId, orgId),
          isNull(knowledgeSources.deletedAt)
        )
      ),
  ]);

  return {
    conversations: convResult[0]?.count ?? 0,
    teamMembers: memberResult[0]?.count ?? 0,
    knowledgeSources: knowledgeResult[0]?.count ?? 0,
  };
}
