# Phase 01 - core schema, roles and CI - v1.2

Planned, not authorized now. Required minimal phase; 2-3 days. Drop first: CI caching. Entry P00. Read [A1-A4/Q/P](contracts.md), [core tables/access](schema-and-access.md), [runner](acceptance.md).

Later work: additive core schema on local/disposable fixtures, fixed capability helper/RLS and server checks, seeded synthetic identities, Vitest/Playwright runner and CI lint/types/gates/build. CI checks can be reported without changing GitHub branch-protection settings if the private repo's account does not support enforcing them. Hosted test/data actions need later authorization.

**MOCK ONLY:** onboarding uses seeded confirmed demo accounts. No SMTP, real invites, SMS, jobs, outbox or provider account. Customers A/B exist as test fixtures without phase 06 UI.

Command planned: npm run test:gate -- P01. Runner manifest names tests/acceptance/phase-01.test.ts only; it does not require an empty E2E file.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P01_MIGRATE_EXISTING | Q1,A4 | Migrate disposable copy with old order/history | IDs/totals retained; legacy consent review-required |
| P01_RLS_MATRIX | A1,A2,A3,Q8 | Direct DB/API queries as A/B, assigned/unassigned staff | Only authorized rows/projection; matching phone grants nothing |
| P01_SERVICE_ROLE_GUARD | A1 | Forge actor/role/order IDs on server path and anon RPC | Denied; actual session identity controls actor |
| P01_REVOKE_AND_LAST_ADMIN | A2 | Disable staff with live cookie, race last-admin removal | Next write denied; active admin remains |
| P01_CI_REQUIRED | B2,A4 | Failing/corrected test and missing required ID | Runner/CI fails then passes; no empty-suite success |

- [ ] Pass only with runner results, migration comparison and actual CI check output.
