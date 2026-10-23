# Phase 01 - core schema, roles and CI - v1.2

Local implementation authorized 23 October 2026 on feat/portfolio-phase-01, branched from master a5491e2. Required minimal phase; 2-3 days. Drop first: CI caching. Entry P00. Read [A1-A4/Q/P](contracts.md), [core tables/access](schema-and-access.md), [runner](acceptance.md). [Execution route](minimal-demo-route.md) preserves the later quote/ledger/UI cut lines.

Implemented locally: additive access foundation, fixed capability helper/RLS and live server checks, synthetic identity fixtures, dependency-free Node test runner and CI definition for lint/types/gates/build. No Vitest/Playwright installation was needed for this integration-only phase. Existing legacy orders remain review-required; quote and ledger tables arrive in 02/03/05 with their own contracts, rather than placeholders. CI checks can be reported without changing GitHub branch protection. Actual GitHub CI is unrun (no push); hosted actions still need authorization.

**MOCK ONLY:** onboarding uses seeded confirmed demo accounts. No SMTP, real invites, SMS, jobs, outbox or provider account. Customers A/B exist as test fixtures without phase 06 UI.

Command: npm run test:gate -- P01. Explicit required-ID manifest: scripts/gate-manifest.mjs. Files: tests/phase01/access.test.mjs, server.test.mjs and gate.test.mjs. Missing, failed or skipped required IDs fail the gate. Both existing labelled local Docker engines are supported; details/evidence in [report](../verification/phase-01/REPORT.md).

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P01_MIGRATE_EXISTING | Q1,A4 | Migrate disposable copy with old order/history | IDs/totals retained; legacy consent review-required |
| P01_RLS_MATRIX | A1,A2,A3,Q8 | Direct DB/API queries as A/B, assigned/unassigned staff | Only authorized rows/projection; matching phone grants nothing |
| P01_SERVICE_ROLE_GUARD | A1 | Forge actor/role/order IDs on server path and anon RPC | Denied; actual session identity controls actor |
| P01_REVOKE_AND_LAST_ADMIN | A2 | Disable staff with live cookie, race last-admin removal | Next write denied; active admin remains |
| P01_CI_REQUIRED | B2,A4 | Failing/corrected test and missing required ID | Runner/CI fails then passes; no empty-suite success |

- [ ] Pass only with runner results, migration comparison and actual CI check output.
