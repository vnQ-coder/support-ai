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
