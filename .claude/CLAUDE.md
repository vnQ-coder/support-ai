# SupportAI — AI Customer Support Agent

## Project Overview
B2B SaaS AI-powered customer support platform for SMBs and mid-market companies. Competes on predictable pricing, fast setup, superior AI accuracy, and seamless human handoff.

## Monorepo Structure (Turborepo)
```
apps/
  dashboard/     → Next.js 16 (admin panel, analytics, settings)
  widget/        → Next.js 16 (embeddable chat widget)
  api/           → Next.js 16 (API routes, webhooks, AI engine)
  marketing/     → Next.js 16 (landing page, docs, pricing)
packages/
  db/            → Drizzle ORM schema, migrations, seed
  ai/            → RAG pipeline, prompt templates, guardrails
  shared/        → Types, utils, constants, Zod schemas
  ui/            → Shared shadcn/ui components
```

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components)
- **UI**: shadcn/ui + Tailwind CSS + Geist fonts + AI Elements
- **AI**: AI SDK v6 + AI Gateway (OIDC auth) + Workflow DevKit
- **Database**: Neon Postgres + pgvector (via Drizzle ORM)
- **Cache**: Upstash Redis
- **Auth**: Clerk (Vercel Marketplace)
- **Storage**: Vercel Blob
- **Payments**: Stripe
- **Email**: Resend
- **Messaging**: Twilio (WhatsApp/SMS)
- **Monorepo**: Turborepo
- **Hosting**: Vercel (Fluid Compute)
- **Monitoring**: Sentry + Vercel Analytics

## Agent System
Available sub-agents in `.claude/agents/`:

### Core Pipeline
- `orchestrator` — Master coordinator, routes to pipeline or specialist
- `pipeline` — 9-stage feature pipeline (Understand→UX→DB→Architect→Build→Secure→Review→Test→Verify+Memory)

### Product & Design
- `product-engineer` — Frontend UI, components, pages (Next.js 16 + shadcn/ui)
- `ux-designer` — FAANG-level UI/UX: layouts, component choices, flows, copy, a11y
- `product-expert` — Product decisions, prioritization, feature specs

### Backend & Data
- `solution-architect` — Backend API design, data flow, integration patterns
- `database-expert` — FAANG-level Postgres/Drizzle/pgvector schema, queries, migrations
- `migration-agent` — Zero-downtime DB migrations, rollback planning, Neon branching

### AI & Intelligence
- `ai-architect` — AI features, RAG, LLM integration (AI SDK v6)
- `rag-specialist` — RAG pipeline: chunking, embedding, hybrid search, re-ranking, pgvector

### Quality & Testing
- `unit-test-specialist` — Unit tests only: Vitest, business logic, schemas, hooks
- `qa-agent` — Integration + E2E tests, test strategy, quality assurance
- `code-review-agent` — Code quality, patterns, performance review
- `a11y-agent` — WCAG 2.1 AA audits, screen reader, keyboard nav, ARIA

### Security & Compliance
- `security-agent` — Security review, auth, compliance, AI guardrails
- `tenant-isolation-agent` — Multi-tenant data isolation, org scoping, IDOR prevention

### Operations & Performance
- `devops-agent` — Deployment, CI/CD, build verification
- `performance-agent` — Core Web Vitals, bundle analysis, DB query performance
- `debug-agent` — Production bugs, hung processes, failing routes, mysterious errors
- `cost-optimizer` — LLM token costs, DB query cost, bundle budget, cache hit rates
- `incident-agent` — Incident response, postmortems, RCA, runbooks

### Documentation
- `docs-agent` — API docs, architecture decisions, onboarding guides, changelogs

## Slash Commands
Available in `.claude/commands/`:
- `/db-migrate` — Safe Drizzle migration workflow
- `/typecheck` — TypeScript check across all packages
- `/lint` — ESLint across monorepo
- `/test` — Run Vitest unit tests
- `/stripe-test` — Test Stripe webhooks locally with ngrok
- `/clean` — Clear .next and .turbo caches

## Key Conventions
- Server Components by default, `'use client'` only at leaf nodes
- AI Elements for ALL AI-generated text (never raw `{text}`)
- AI Gateway for all LLM calls (`'provider/model'` strings)
- Drizzle ORM for all database access (no raw SQL)
- Zod schemas for all input validation
- Dark mode default for dashboard
- Multi-tenant: every query scoped by `organization_id`
- Flat-rate pricing model ($49/$99/$199/custom)

## Browser Testing: dev-browser (MANDATORY)
**Always use `dev-browser` for browser verification, E2E testing, and debugging.**
**Do NOT use Chrome MCP tools (`mcp__Claude_in_Chrome__*`) — they consume ~10x more tokens.**

```bash
# Navigate and check page renders
dev-browser --headless --timeout 15 <<'EOF'
const page = await browser.getPage("test");
await page.goto("http://localhost:3000");
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
EOF

# Get page structure (replaces Chrome MCP read_page)
dev-browser --headless --timeout 15 <<'EOF'
const page = await browser.getPage("test");
const snap = await page.snapshotForAI();
console.log(snap.full);
EOF

# Check for JS errors (replaces Chrome MCP read_console_messages)
dev-browser --headless --timeout 15 <<'EOF'
const page = await browser.getPage("test");
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.goto("http://localhost:3000");
await page.waitForTimeout(2000);
console.log(JSON.stringify({ errors }));
EOF
```

Named pages persist between runs. Full Playwright Page API available.
Only use Chrome MCP when you specifically need to interact with the user's live browser session.

## Token Optimization Rules

### 1. Use `model: haiku` for simple agents
Agents doing straightforward work (lint checks, file moves, simple CRUD) should use `model: haiku`.
Reserve `model: opus` for complex reasoning (architecture, security audits, debugging).
Reserve `model: sonnet` for balanced work (building features, code review).

### 2. Agent prompt efficiency
- Give agents ONLY the context they need — don't paste full specs when they only need a file list
- Use file paths instead of file contents when possible — let the agent read what it needs
- For parallel agents, specify exact file ownership to prevent redundant reads

### 3. dev-browser efficiency patterns
```bash
# BAD: Screenshot for every check (large image tokens)
dev-browser --headless <<'EOF'
const page = await browser.getPage("test");
await page.goto("http://localhost:3000");
const buf = await page.screenshot();
await saveScreenshot(buf, "check.png");
EOF

# GOOD: Text snapshot only — 10x fewer tokens
dev-browser --headless <<'EOF'
const page = await browser.getPage("test");
await page.goto("http://localhost:3000");
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
EOF

# GOOD: Combine multiple checks in ONE script (1 Bash call vs 4)
dev-browser --headless --timeout 20 <<'EOF'
const results = {};
for (const [name, url] of [["dashboard","http://localhost:3000"],["widget","http://localhost:3001?apiKey=test"],["api","http://localhost:3002/api/health"],["marketing","http://localhost:3003"]]) {
  const page = await browser.getPage(name);
  try {
    await page.goto(url);
    results[name] = { status: "OK", url: page.url(), title: await page.title() };
  } catch(e) {
    results[name] = { status: "FAIL", error: e.message };
  }
}
console.log(JSON.stringify(results, null, 2));
EOF

# GOOD: Use incremental snapshots for multi-step flows
dev-browser --headless <<'EOF'
const page = await browser.getPage("flow");
await page.goto("http://localhost:3000/sign-in");
const snap1 = await page.snapshotForAI({ track: "flow" });
console.log("STEP1:", snap1.full.substring(0, 500));
await page.fill('input[name="email"]', 'test@test.com');
await page.click('button[type="submit"]');
const snap2 = await page.snapshotForAI({ track: "flow" });
// snap2.incremental only contains CHANGES since snap1 — much smaller!
console.log("STEP2:", snap2.incremental || snap2.full.substring(0, 500));
EOF
```

### 4. Prefer Grep/Glob over Agent for simple searches
- Direct `Grep` call: ~100 tokens
- Agent with Explore: ~2-5K tokens
- Only use Agent/Explore for broad multi-file investigations

### 5. Batch tool calls
- Make ALL independent tool calls in a single message (parallel execution)
- Don't read files one-by-one when you can read them all at once
