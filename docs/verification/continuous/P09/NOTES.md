# Phase 09 local evidence

All fixtures are synthetic, on labelled local PostgreSQL 17.11 with postgres ownership and permissive Supabase-style default grants. Nothing here is hosted evidence. The browser's loopback adapter simulates Auth/PostgREST transport and forwards the permitted calls into real SQL; it does not prove integration with the hosted Auth or API gateway. Login cookies and Next server actions run in the actual browser/app.

Two regressions were red before fixes (`red.txt`): missing safe action-error logging and a ready-stage amendment reusing old work/QC. Migration 0901 binds work and QC to the active quote. An accepted amendment requires explicit additional work and QC, preserving the forward status history. No historical work is inferred. `red-discrete-step.txt` separately proves native whole-piece input validation was incorrectly anchored at 0.01; its minimum now matches its unit.

## Canonical transition evidence

| Contract row | Named executable coverage |
|---|---|
| T1 new → pending | P02_IDEMPOTENT_BOOK, P02_V0_SNAPSHOT, P02_BOOKING_UI |
| T2 pending → picked_up | P03_BAG_INTEGRITY, P09_BROWSER_WORKFLOW |
| T3 picked_up → processing | P03_WORK_TRANSITIONS, P03_APPROVAL_EVIDENCE, P09_BROWSER_WORKFLOW |
| T4 processing → ready | P03_BAG_INTEGRITY, P03_WORK_TRANSITIONS, P09_BROWSER_WORKFLOW |
| T5 ready → delivered | P05_ATOMIC_DELIVER_COLLECT, P05_CASH_ROLLBACK, P05_RETRY_RACE, P09_BROWSER_WORKFLOW |
| T6 pending → cancelled | P05_CANCEL_INCIDENT |
| T7 picked_up → cancelled | P05_CANCEL_INCIDENT |
| T8 request/incident/amendment, unchanged status | P03_WORK_TRANSITIONS, P05_CANCEL_INCIDENT, P09_STATE_COVERAGE |

Authorization: P01_AUTHORIZATION_MATRIX checks 170/170 capability cells (17 actions × 10 actor categories), plus 20 null/unknown-action denials. Workflow tests separately check state preconditions and effects; the matrix alone does not establish them. P01_HOSTED_DEFAULTS verifies restrictive grants and detects a deliberately leaky control under permissive local defaults. P09_REGRESSION verifies each required ID is mandatory in every cumulative gate.

Optional upload, providers, notifications, scheduling, unclaimed goods and dispatch extensions are outside this minimal path. No upload test is represented as passed. Money and customer-message/recipient evidence are simulated. The browser uses only ZZ TEST fixtures, never customer rows.

Static design checks over the four demo UI components returned exit 0 and `[]` (no findings). Browser tests check 390 and 1440px overflow. Both committed admin captures were inspected together: stacked mobile sections, horizontally scrollable quote/ledger tables, and desktop ruled sections remain readable with native controls. No additional visual changes were needed. Captures show synthetic fixtures and a dev indicator, not deployed production. This bounded inspection does not substitute for the domain gate.
