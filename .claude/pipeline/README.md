# Pipeline Artifacts

This directory stores the active feature pipeline state.

## How it works

When the `pipeline` agent runs, it creates `current-feature.md` here to track:
- Which stage is active
- Outputs from each completed stage
- Retry counts for feedback loops

## Files

- `current-feature.md` — Active feature tracker (created by pipeline agent)

## Pipeline Stages

```
Stage 1:  UNDERSTAND  → product-expert          → Feature spec + acceptance criteria
Stage 2:  UX DESIGN   → ux-designer             → Layouts, component choices, states, copy
Stage 3:  DATABASE    → database-expert         → Schema, migrations, indexes, queries
Stage 4:  ARCHITECT   → solution-architect      → API design, data flow, file plan
Stage 5:  BUILD       → product-engineer        → Implementation
                        + ai-architect           → (if AI features involved)
Stage 6:  SECURE      → security-agent          → Security audit + fixes
Stage 7:  REVIEW      → code-review-agent       → Code quality gate
Stage 8a: UNIT TEST   → unit-test-specialist    → Unit tests (logic, schemas, utils)
Stage 8b: INT/E2E     → qa-agent                → Integration + E2E tests
Stage 9a: VERIFY      → devops-agent            → Build + lint + typecheck
Stage 9b: MEMORY      → pipeline (self)         → Update project_build_status.md memory
```
