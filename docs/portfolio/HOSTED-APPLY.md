# Future hosted apply plan — blocked pending owner approval

No hosted changes were authorized or attempted in this run. No push, Preview, merge or production switch occurred. The parked booking-fixes branch remains excluded. Current production must keep its old schema-compatible code. This document is a future plan, not a passing deployment report.

## Preparation before any apply

Require **owner approval** for the exact project, migration hashes and code commit. Confirm the project name/ref with the owner again. Take a **fresh export** outside Git (schema/functions/ACLs/default privileges/triggers/RLS and all public rows), verify every table's count and document excluded auth/storage/sequence coverage. Compare current definitions with the last verified baseline; 27 is only the historical row total. Never print rows, keys or URLs containing credentials.

Check migration/name/column/index collisions, old default grants/owners, profile constraints, active/disabled admins, existing role data, pending/rate-cap conflicts and legacy order flags. Existing orders remain `legacy_review_required`; no quote, consent, payment, QC or ownership is backfilled. Fresh backup and acceptable exact rollback are blockers, not optional checklist items. No migration references parked booking work.

Test a disposable copy of this fresh snapshot under the actual hosted PostgreSQL version/owners/defaults. The local PostgreSQL 17.11 simulation alone does not prove hosted compatibility. Prepare and test an exact rollback for **each migration prefix** against that copy before touching hosted. Retain original function definitions/owners/ACLs/policies/triggers/indexes/constraints and row/sequence baselines. Review all generated DROP/ALTER statements. Never rerun `schema.sql` or `functions.sql` against hosted.

## Transactional migration order

| Order | File | Main change / risk |
|---|---|---|
| 1 | `202610230101_portfolio_access_foundation.sql` | Live roles/RLS/assignments/audit; old status RPC becomes restricted. Profile constraint and table grants change. |
| 2 | `202610230201_demo_booking_quotes.sql` | New booking/lookup RPC, v0 quotes/consent/snapshots, rate and synthetic caps. |
| 3 | `202610230301_quote_workflow.sql` | Bags/evidence/issues/settlements, bound revisions/actions; legacy status mutation is retired. |
| 4 | `202610230501_simulated_ledger_handover.sql` | Immutable simulated ledger, signed effects, atomic handover and financial report. |
| 5 | `202610230901_work_scope_guards.sql` | Quote-bound work/QC and ready-stage additional work. Existing new-demo ready rows require explicit reconciliation; no fabricated historical QC. |

Each file has BEGIN/COMMIT and fixed-search-path/restrictive grants. Apply once, one at a time, verifying after each. On a write/apply transport error: **read state before retry**; inspect functions/tables/migration markers/created synthetic keys to determine whether the transaction committed. Never repeat an unknown write. Stop on any unexpected ACL, data, default owner, schema or result. Use the reviewed matching rollback if safe, otherwise stop for owner direction; do not patch forward blindly.

## Post-apply and Preview checks

Re-run the same saved ACL/default-ACL queries and compare to the disposable-copy rehearsal. Public/anon must have no execution on privileged demo RPCs; authenticated gets only the documented bound identity/scoped RPCs, not service booking or private helpers. `book_demo_order`/`lookup_demo_order` are service-only; `current_profile_role`, `order_command`, detail/summary/report and contact/capability helpers are authenticated with in-function scope checks. Internal `app_private` functions stay unavailable to public roles. Direct authenticated/anon grants from hosted defaults must also be removed. Query column as well as table ACLs and RLS. Do not apply the old “both functions service-role only” rule to intentionally authenticated new admin RPCs.

Probe hosted PostgREST with the actual anon key without logging it: call service-only booking/lookup RPCs and select idempotency/audit/payment-private data; expect denied/no unauthorized rows according to the exact RLS/column grants. Then verify anonymous cannot execute bound admin commands; authenticated owner/unrelated/assigned/disabled profiles follow the 170-cell matrix and private-evidence rules. Denial alone is insufficient: verify authenticated legitimate paths as well. Old legacy rows stay readable to authorized admins but their retired mutation RPC must reject changes.

Use synthetic `ZZ TEST`, fake phone and isolated operation keys only. Before hosted HTTP tests, agree **exact-row cleanup** compatible with append-only triggers. Do not assume ordinary DELETE can clean a ledger/order-history fixture. There is **no trigger bypass** and no generic reset endpoint. If exact cleanup cannot be achieved with existing controls, use rollback-only SQL transaction probes instead; do not create persistent HTTP fixtures until the owner separately approves a specific safe cleanup plan. If deletion is blocked, stop. Compare all row counts and sequence changes with the fresh baseline; never restore a sequence backwards if concurrent real writes occurred.

Only after approved hosted schema checks: separately authorize pushing this branch for Preview. Verify Preview-only environment bindings and its project target, no secret in client artifacts, and real Auth/cookie integration. Exercise 201 booking, 200 replay/same code, 409 payload conflict, invalid timezone/past pickup 400, fourth per-phone/hour 429, quote/approval/work/QC/ledger/handover and wrong-user denials. Log synthetic order codes and exact cleanup/count proof privately. A lost write response requires state inspection/idempotent replay. A failing check blocks merge. Owner browser review and passing Preview precede any separately approved master/production switch.

## Rollback implementation and limits

`scripts/local-rollback.mjs` captures table columns/constraints/indexes/triggers/RLS/policies, table/column/function ACLs, function definitions/default privileges and canonical baseline row hashes. `scripts/prepare-local-rollback.mjs` generates the five **local-only** scripts in [rollback-local](rollback-local/), each bound to its exact disposable database. `P10_ROLLBACK` applies and reverses every prefix and compares the original catalog/ACLs/row hashes. It also proves rollback refuses a newly populated business table. All inverse DDL is transactional, uses bounded locks, removes explicit objects without CASCADE, restores old function behavior/permissions, and preserves original tables/rows. No DML erases evidence. PostgreSQL internal dropped-column tombstones and original OIDs are not part of this logical comparison.

These checked-in scripts are **not hosted-ready**: they contain synthetic local hashes, exact local database guards and local baseline definitions/ACLs. Running them on hosted is intentionally rejected. A future hosted script must be regenerated/rehearsed from the fresh private hosted snapshot and reviewed before approval; the local adapter/generator has no hosted connection capability. Do not remove its guard as a shortcut. The rollback refuses new business data, modified original columns or changed profile activation/revision. If users have started the new workflow, restoring old schema would discard history and is not an acceptable automatic rollback. Stop for a separate preservation/recovery plan instead.

Risks: old code and new schema cannot be switched independently; hosted defaults/actual Auth gateway can differ; DDL locks need a quiet window; immutable evidence blocks naive fixture deletion; time-dependent synthetic pickup fixtures can expire; current Free projects can pause; sequence values/auth/storage require separate backup coverage; local logs are not an uptime/load/recovery claim. No live bank/payment/notification provider is included. The keep-alive job remains planned, not implemented.
