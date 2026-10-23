# Phase 01 — schema, authorization and CI · v1.1

Read: [R1 schema/access](schema-and-access.md), [contracts Q/P/T](contracts.md), [runner](acceptance.md), applicable [infrastructure](infrastructure.md). Effort: portfolio **3–5 days**, shop **5–8 days**. Drop first: CI caching/convenience scripts. Entry: P00 passed; track recorded.

## Work

1. Implement additive schema baseline and fixed role/action helper from the supplied R1 design. Preserve existing IDs/history; migrate unknown old consent/payment/custody to review-required data. Exercise migration on local/staging copy, not live production.
2. Add Vitest, Playwright, local Supabase fixtures, `test:gate` runner/ID manifest per acceptance contract; CI runs lint, `tsc --noEmit`, gates and production build. Set required GitHub checks before allowing release merge.
3. Implement service-role server-session checks and DB authorization helper; seed customer A/B, unrelated staff, courier and processor. Enable RLS and constrained RPC grants. Real admin writes require AAL2.
4. Portfolio: local Auth/test inbox and seeded confirmed demo accounts, local Supabase or a second Free project if available; no outbox/jobs/live senders.
5. Shop: budget and provision approved Pro production/staging, Redis, private backup destination/runner quota, custom Resend SMTP with verified sender. Verify `pg_cron/pg_net` on staging; install SQL tick, bounded leases and health checks. Edge/outbox execution is delivered in 07. Credentials remain in environment/secret stores.

## Gate P01_FOUNDATION

Command: `npm run test:gate -- P01`. Artifact: `tests/acceptance/phase-01.test.ts`, plus CI/build logs. Tests in this phase may use raw SQL to test grants, but reset only allowlisted disposable environments.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P01_MIGRATE_EXISTING` | Apply additive migrations to copy with 2 old orders, items/history/totals | IDs/counts/totals retained; missing evidence flagged for review; prior compatible reader still works |
| `P01_RLS_MATRIX` | Direct authenticated queries as customer A/B and assigned/unassigned staff | Only matrix-allowed rows/fields; forbidden mutations fail |
| `P01_SERVICE_ROLE_GUARD` | Call app with forged actor/role/order IDs, then actual authorized session | Forged inputs cannot change identity/scope; authorized action succeeds; direct public execute on service RPC denied |
| `P01_REVOKE_AND_LAST_ADMIN` | Disable staff while keeping old session; concurrently try removing last admin | Next staff mutation denied; at least one active admin remains |
| `P01_CI_REQUIRED` | CI run with failing fixture then corrected fixture | Failure blocks merge; lint/typecheck/test/build pass after correction; missing test ID fails runner |
| `P01_SHOP_INFRA` shop only | Stage billing evidence; send invite/reset to non-team test address via custom SMTP; invoke two SQL ticks concurrently | SMTP delivered within 5 min; quota captured; one logical task; cron health updates; backup/Redis secrets reachable without logging values |

- [ ] Tick only after required IDs pass and report includes the migration comparison, tested permissions and CI URL.

Handoff: versioned migrations, fixtures, runner, CI checks, capability contract and actual environment/provider evidence. Missing shop provider/budget leaves that gate blocked; portfolio does not inherit the shop cost requirement.
