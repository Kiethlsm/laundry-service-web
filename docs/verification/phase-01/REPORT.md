# Phase 01 — local access foundation

Implementation source: 35eb3a5 on feat/portfolio-phase-01. Base: local master a5491e272c5a815c76e9a12f27067c20d5a16c27. Parked fix/booking-tests-and-validation remains at 55ed45d; no merge/cherry-pick from it, push, deploy, or hosted Supabase tool call in this slice.

Estimate before implementation: 2–3 person-days for Phase 01. Full quote/ledger/UI route exceeds three days; therefore this implements only the authorized next foundation phase. [Shortest route](../../pipeline-v1.2/minimal-demo-route.md) specifies 02 core, 03 quotes, 05 ledger/handover, 09/10 verification. Quotes, payment entries, weight settlement and their admin UI are NOT implemented yet. No empty placeholder business tables were introduced.

## Changes

- Versioned transactional local migration 202610230101_portfolio_access_foundation.sql expands the role constraint, adds active/revision fields and legacy-review/synthetic markers, creates assignments/audit/idempotency tables. Preserves original order IDs, amounts, items and history; invents no historical consent, ownership or payments.
- Fixed private capability mapping serves auth-bound public helper and RLS. Customer A/B ownership never uses phone matching. Assigned staff see an explicit operational column projection; customer/admin contact RPC omits internal notes. Direct privilege escalation and private helper invocation are denied. All added/modified SECURITY DEFINER functions pin search_path; explicit REVOKEs cover permissive local Supabase defaults.
- Membership RPC binds auth.uid(), active admin state, expected profile revision and operation key/hash. Replays return the prior result, conflicts/stale revisions fail, audit contains role/active flags only. One advisory lock serializes membership changes; direct application profile writes are revoked. Guard prevents deleting/disabling/demoting the final active admin. Profile-scoped idempotency stores the expected target revision in the shared revision field. Responses expire at seven days and expired reuse is rejected; no cleanup job implemented.
- History/audit reject UPDATE/DELETE. Legacy server-only status RPC checks the active admin under lock, increments order revision and records actor at history INSERT, eliminating the previous historical-row rewrite. Old status transitions remain baseline compatibility only: bag/QC/quote/handover preconditions must be implemented in 03/05 before minimal-demo completion.
- Login/requireAdmin use fresh session-bound current_profile_role instead of an admin-only profile query. Actual Server Action tests show client actor/role fields are ignored and deactivation prevents the next server mutation. No new admin surface in Phase 01.
- Native Node test gate with explicit required IDs, no new dependencies. GitHub Actions workflow defines local PostgreSQL, lint/types/gate/build, with no hosted credentials or remote tests. No branch protection or remote settings changed.

## Red then green

Tests were committed before implementation (ec8957c). Baseline command `$env:PHASE01_BASELINE='1'; npm test` exited 1: six tests failed, zero passed. Full output: red.txt. Failures include missing legacy-review columns, rejected staff fixtures, missing gate validator, and stale-active server authorization. The test harness initially selected the set_config output instead of a trailing NULL; using SET LOCAL eliminated that harness artifact.

Additional explicit null-action test failed 1/1 before its SQL correction (red-null-action.txt). The helper now denies NULL rather than letting SQL three-valued logic reach the admin branch. A runner parsing defect initially treated TAP summary `# todo 0` as a TODO directive; it now checks only test-line directives, with regression assertions. No failing acceptance condition was removed.

Final output files:

| Command/environment | Result | Evidence |
| --- | --- | --- |
| npm run test:gate -- P01, local postgres:17.11 | 6 passed, 0 failed/skipped, exit 0 | green-pg17.txt |
| P01_ENGINE=supabase15 npm run test:gate -- P01, existing supabase/postgres:15.8.1.085 | 6 passed, 0 failed/skipped, exit 0 | green-supabase15.txt |
| npm run lint | exit 0, no diagnostics | lint.txt |
| npm run typecheck | exit 0 | typecheck.txt |
| Production build target, child process with Supabase env blanked | exit 0 | build.txt |

P01_MIGRATE_EXISTING compares complete before/after legacy order/item/history JSON. P01_RLS_MATRIX checks A/B/guest/assigned/unassigned/admin scopes, same-phone nonownership, protected projections, internal/anon ACLs and unknown/null actions. P01_SERVICE_ROLE_GUARD checks forged actor and anon privilege bypass attempts, active legacy actor history insertion, disabled-admin service-role mutation denial. P01_REVOKE_AND_LAST_ADMIN checks immediate disablement/reassignment, mutation hash/revision/retry integrity, append-only restrictions and a two-connection race retaining one admin. P01_CI_REQUIRED tests missing/empty/failed/skipped manifest conditions. P01_SERVER_SESSION_GUARD exercises transpiled real guard and action with mocked Next/session boundary.

## Reproduce safely and limits

The test helper never reads .env.local or accepts a database URL. It permits only the two exact local Docker names plus purpose labels, and creates uniquely named ss_p01_* fixture databases without altering existing fixture databases. It seeds only ZZ TEST orders and deterministic synthetic Auth UUIDs. No hosted rows were read, copied or changed. Fixture databases are retained locally; no DROP/reset against unknown data is automated.

For a fresh PG17 fixture use the Docker startup/role creation commands in .github/workflows/portfolio-ci.yml, then npm run test:gate -- P01. Existing Supabase image can be selected with P01_ENGINE=supabase15. Both SQL engines use a minimal local auth.users/auth.uid fixture with simulated request claims, not a running Auth/PostgREST stack. Server boundary tests mock verified-session responses; these are not live-cookie/browser integration proof. No actual external provider, SMTP, Auth account or customer data used.

GitHub CI itself has NOT run because this branch is local. The whole-phase checklist stays unchecked: its actual CI requirement has no remote output yet. Workflow commands and the required-ID validator passed locally; this is the exact scope of the evidence. Quote/ledger/UI and end-to-end browser tests remain later slices. Hosted DB/production remain on old code/functions; their 27-row baseline was not queried again because no hosted access was needed or authorized here. No runtime configured to this workspace should point at hosted to exercise this new schema; use local fixture connections only.
