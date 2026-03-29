/**
 * Seed script: populates the database with demo data.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm --filter @repo/db db:seed
 */

import {
  organizations,
  members,
  apiKeys,
  widgetConfigs,
} from "./schema/organizations";
import {
  contacts,
  conversations,
  messages,
} from "./schema/conversations";
import {
  knowledgeSources,
  knowledgeChunks,
} from "./schema/knowledge";

// ---------- helpers ----------

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

// ---------- main ----------

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required to run the seed script.");
    process.exit(1);
  }

  // Use postgres.js for local, neon for remote
  let db: any;
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    const sql = postgres(url);
    db = drizzle(sql);
  } else {
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    const sql = neon(url);
    db = drizzle(sql);
  }

  console.log("Seeding database...\n");

  // 1. Organization
  const orgId = "org_demo_123";
  await db.insert(organizations).values({
    id: orgId,
    clerkOrgId: "org_clerk_demo",
    name: "Demo Company",
    slug: "demo-company",
    plan: "growth",
  }).onConflictDoNothing();
  console.log("  [+] Organization: Demo Company");

  // 2. Members
  const memberId1 = "member_owner_01";
  const memberId2 = "member_agent_01";
  await db.insert(members).values([
    {
      id: memberId1,
      organizationId: orgId,
      clerkUserId: "user_clerk_owner",
      role: "owner",
      email: "owner@demo.com",
      name: "Alex Owner",
    },
    {
      id: memberId2,
      organizationId: orgId,
      clerkUserId: "user_clerk_agent",
      role: "agent",
      email: "priya@demo.com",
      name: "Priya Sharma",
    },
  ]).onConflictDoNothing();
  console.log("  [+] Members: 2 created");

  // 3. API Keys (sk_live_demo123 and sk_test_demo123)
  const liveKeyHash = await sha256("sk_live_demo123");
  const testKeyHash = await sha256("sk_test_demo123");
  await db.insert(apiKeys).values([
    {
      id: "apikey_live_01",
      organizationId: orgId,
      name: "Live Key",
      keyHash: liveKeyHash,
      keyPrefix: "sk_live_dem",
      isLive: true,
    },
    {
      id: "apikey_test_01",
      organizationId: orgId,
      name: "Test Key",
      keyHash: testKeyHash,
      keyPrefix: "sk_test_de",
      isLive: false,
    },
  ]).onConflictDoNothing();
  console.log("  [+] API Keys: sk_live_demo123, sk_test_demo123");

  // 4. Widget Config
  await db.insert(widgetConfigs).values({
    id: "wc_demo_01",
    organizationId: orgId,
    primaryColor: "#6366f1",
    greeting: "Hi! How can we help you today?",
    placeholder: "Type a message...",
    position: "bottom-right",
    showBranding: true,
    allowedDomains: [],
  }).onConflictDoNothing();
  console.log("  [+] Widget Config");

  // 5. Contacts
  const contactIds = [
    { id: "contact_emma", email: "emma@example.com", name: "Emma Wilson" },
    { id: "contact_james", email: "james@example.com", name: "James Chen" },
    { id: "contact_sarah", email: "sarah@example.com", name: "Sarah Johnson" },
    { id: "contact_david", email: "david@example.com", name: "David Park" },
    { id: "contact_lisa", email: "lisa@example.com", name: "Lisa Rodriguez" },
  ];
  await db.insert(contacts).values(
    contactIds.map((c) => ({
      id: c.id,
      organizationId: orgId,
      email: c.email,
      name: c.name,
    }))
  ).onConflictDoNothing();
  console.log(`  [+] Contacts: ${contactIds.length} created`);

  // 6. Conversations
  const now = new Date();
  const convData = [
    {
      id: "conv_1",
      contactId: "contact_emma",
      status: "escalated",
      subject: "Billing issue \u2014 double charged",
      channel: "web_chat",
      resolvedBy: null,
      csatScore: null,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: "conv_2",
      contactId: "contact_james",
      status: "waiting",
      subject: "Integration not syncing data",
      channel: "email",
      resolvedBy: null,
      csatScore: null,
      assigneeId: memberId2,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: "conv_3",
      contactId: "contact_sarah",
      status: "resolved",
      subject: "Password reset help",
      channel: "web_chat",
      resolvedBy: "ai" as const,
      csatScore: 5,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: "conv_4",
      contactId: "contact_david",
      status: "resolved",
      subject: "How to export data",
      channel: "web_chat",
      resolvedBy: "ai" as const,
      csatScore: 4,
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
    {
      id: "conv_5",
      contactId: "contact_lisa",
      status: "resolved",
      subject: "Webhook configuration",
      channel: "web_chat",
      resolvedBy: "human" as const,
      csatScore: 3,
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
    },
  ];

  await db.insert(conversations).values(
    convData.map((c) => ({
      id: c.id,
      organizationId: orgId,
      contactId: c.contactId,
      channel: c.channel,
      status: c.status,
      subject: c.subject,
      resolvedBy: c.resolvedBy,
      csatScore: c.csatScore,
      assigneeId: (c as { assigneeId?: string }).assigneeId ?? null,
      createdAt: c.createdAt,
      updatedAt: c.createdAt,
      resolvedAt: c.resolvedBy ? c.createdAt : null,
      csatSubmittedAt: c.csatScore ? c.createdAt : null,
    }))
  ).onConflictDoNothing();
  console.log(`  [+] Conversations: ${convData.length} created`);

  // 7. Messages
  const msgData = [
    { convId: "conv_3", sender: "user", content: "I forgot my password, how do I reset it?" },
    { convId: "conv_3", sender: "ai", content: "You can reset your password by clicking 'Forgot Password' on the login page. You will receive a reset link via email.", confidence: 0.95 },
    { convId: "conv_4", sender: "user", content: "How can I export my data to CSV?" },
    { convId: "conv_4", sender: "ai", content: "Go to Settings > Data > Export. Select CSV format and the date range, then click Export. The file will be emailed to you.", confidence: 0.92 },
    { convId: "conv_1", sender: "user", content: "I was charged twice for my subscription this month." },
    { convId: "conv_1", sender: "ai", content: "I'm sorry to hear about the double charge. Let me connect you with our billing team who can issue a refund right away.", confidence: 0.6 },
  ];

  await db.insert(messages).values(
    msgData.map((m, i) => ({
      id: `msg_seed_${i + 1}`,
      conversationId: m.convId,
      sender: m.sender,
      content: m.content,
      confidence: m.confidence ?? null,
    }))
  ).onConflictDoNothing();
  console.log(`  [+] Messages: ${msgData.length} created`);

  // 8. Knowledge Sources and Chunks
  const sourceId = "ks_demo_01";
  await db.insert(knowledgeSources).values({
    id: sourceId,
    organizationId: orgId,
    type: "text",
    name: "Getting Started Guide",
    status: "ready",
    chunkCount: 3,
    lastSyncedAt: now,
  }).onConflictDoNothing();

  await db.insert(knowledgeChunks).values([
    {
      id: "kc_demo_01",
      sourceId,
      organizationId: orgId,
      content: "To reset your password, go to the login page and click 'Forgot Password'. Enter your email and a reset link will be sent.",
      chunkIndex: 0,
    },
    {
      id: "kc_demo_02",
      sourceId,
      organizationId: orgId,
      content: "To export data, navigate to Settings > Data > Export. Choose your format (CSV, JSON) and date range, then click Export.",
      chunkIndex: 1,
    },
    {
      id: "kc_demo_03",
      sourceId,
      organizationId: orgId,
      content: "Webhook endpoints can be configured in Settings > Integrations > Webhooks. Add your URL and select the events you want to receive.",
      chunkIndex: 2,
    },
  ]).onConflictDoNothing();
  console.log("  [+] Knowledge: 1 source, 3 chunks");

  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
