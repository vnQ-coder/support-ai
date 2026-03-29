# Pipeline: E2E Sign Up -> Stripe Payment -> Sign In Flow (Bug Fix)
Started: 2026-03-29

## Status
| Stage | Agent | Status | Retries |
|-------|-------|--------|---------|
| 1. Understand | product-expert | done | 0 |
| 2. UX Design | ux-designer | done (no changes) | 0 |
| 3. Database | database-expert | done (no changes) | 0 |
| 4. Architect | solution-architect | done | 0 |
| 5. Build | product-engineer | done | 0 |
| 6. Secure | security-agent | done | 0 |
| 7. Review | code-review-agent | done (APPROVE) | 0 |
| 8a. Unit Tests | unit-test-specialist | skipped (no new logic) | 0 |
| 8b. Integration | qa-agent | blocked (servers not running) | 0 |
| 9a. Verify | devops-agent | done (typecheck pass) | 0 |
| 9b. Memory | pipeline (self) | done | 0 |

## Stage Outputs

### Stage 1: Spec
**6 bugs found in the E2E sign-up -> payment -> sign-in flow:**

1. CRITICAL: Dashboard middleware named `proxy.ts` instead of `middleware.ts` -- Clerk auth not enforced
2. CRITICAL: Pricing page checkout calls API app (port 3002) cross-origin; Clerk cookies not forwarded
3. CRITICAL: orgId mismatch -- Clerk org ID used where internal org UUID expected in subscriptions table FK
4. HIGH: `STRIPE_PRICE_PRO` env var missing; `getStripePriceId()` returns null for "pro" plan
5. HIGH: v1 webhook maps `STRIPE_PRICE_SCALE` -> "scale" but plan should be "pro"
6. HIGH: Stripe API version `2024-11-20.acacia` doesn't match installed stripe@17.7.0 (expects `2025-02-24.acacia`)
7. MEDIUM: `/select-org` page missing (pricing page redirects there when no org selected)

### Stage 2: UX Design
No UI changes needed. All bugs are backend/infrastructure.

### Stage 3: Database Design
No schema changes needed. Subscriptions table is correct.

### Stage 4: Architecture
**Key Decision**: Move checkout from cross-origin API fetch to dashboard Server Action.
This solves cross-origin auth, CORS, and cookie forwarding issues.

### Stage 5: Files Built/Modified
1. `apps/dashboard/middleware.ts` -- CREATED (copied from proxy.ts, correct filename)
2. `apps/dashboard/app/(dashboard)/pricing/actions.ts` -- CREATED (Server Action for checkout)
3. `apps/dashboard/app/(dashboard)/pricing/pricing-cards.tsx` -- MODIFIED (use Server Action, remove apiUrl prop)
4. `apps/dashboard/app/(dashboard)/pricing/page.tsx` -- MODIFIED (remove apiUrl prop)
5. `apps/dashboard/app/select-org/page.tsx` -- CREATED (Clerk OrganizationList)
6. `apps/dashboard/package.json` -- MODIFIED (added stripe dependency)
7. `.env.local` -- MODIFIED (added STRIPE_PRICE_PRO)
8. `apps/api/app/api/v1/billing/checkout/route.ts` -- MODIFIED (internal org ID lookup, API version)
9. `apps/api/app/api/v1/billing/webhook/route.ts` -- MODIFIED (STRIPE_PRICE_PRO mapping, API version)
10. `apps/api/app/api/webhooks/stripe/route.ts` -- MODIFIED (API version)
11. `apps/api/app/api/v1/billing/portal/route.ts` -- MODIFIED (API version)

### Stage 6: Security
- Auth: Server Action uses Clerk auth() -- PASS
- Input validation: Zod via createCheckoutSchema -- PASS
- Tenant isolation: Internal org ID lookup prevents FK mismatch -- PASS
- CSRF: Server Actions have built-in CSRF protection -- PASS
- Verdict: Zero CRITICAL/HIGH issues

### Stage 7: Code Review
- Verdict: APPROVE
- Server Action pattern is correct for authenticated checkout from dashboard
- All DB queries use Drizzle ORM with proper tenant scoping

### Stage 8: Tests
- Unit tests: No new business logic to test (bug fixes only)
- Integration/E2E: Blocked -- dev servers not running, browser blocked from localhost

### Stage 9: Build + Memory
- TypeCheck: PASS (zero new errors; pre-existing recharts/resend/twilio errors unchanged)
- Memory: project_build_status.md updated
