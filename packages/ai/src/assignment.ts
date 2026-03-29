/**
 * Agent assignment logic.
 * Implements round-robin assignment of escalated conversations
 * to available human agents within an organization.
 */

import { db, members, conversations } from "@repo/db";
import { eq, and, sql, inArray } from "drizzle-orm";

export interface AssignedAgent {
  agentId: string;
  agentName: string;
}

/**
 * Assign an escalated conversation to the next available agent
 * using round-robin based on current active assignment count.
 *
 * Selection criteria:
 * 1. Query members with role 'agent' or 'owner' in the organization
 * 2. Count each member's current active escalated assignments
 * 3. Pick the agent with the fewest assignments (round-robin)
 *
 * Returns null if no agents are available in the organization.
 */
export async function assignToAgent(
  organizationId: string
): Promise<AssignedAgent | null> {
  // If DATABASE_URL is not configured, return a mock assignment
  if (!process.env.DATABASE_URL) {
    return {
      agentId: "member_mock_1",
      agentName: "Support Agent",
    };
  }

  // 1. Get all eligible agents in the organization
  const eligibleAgents = await db
    .select({
      id: members.id,
      name: members.name,
    })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        inArray(members.role, ["agent", "owner"])
      )
    );

  if (eligibleAgents.length === 0) {
    return null;
  }

  // 2. Count current active assignments per agent
  const assignmentCounts = await db
    .select({
      assigneeId: conversations.assigneeId,
      activeCount: sql<number>`COUNT(*)`.as("active_count"),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, organizationId),
        inArray(conversations.status, ["escalated", "active", "waiting"])
      )
    )
    .groupBy(conversations.assigneeId);

  const countMap = new Map<string, number>();
  for (const row of assignmentCounts) {
    if (row.assigneeId) {
      countMap.set(row.assigneeId, Number(row.activeCount));
    }
  }

  // 3. Pick the agent with the fewest current assignments (round-robin)
  let bestAgent = eligibleAgents[0]!;
  let lowestCount = countMap.get(bestAgent.id) ?? 0;

  for (const agent of eligibleAgents) {
    const agentCount = countMap.get(agent.id) ?? 0;
    if (agentCount < lowestCount) {
      bestAgent = agent;
      lowestCount = agentCount;
    }
  }

  return {
    agentId: bestAgent.id,
    agentName: bestAgent.name ?? "Support Agent",
  };
}
