# v1.2 — cross-file consistency audit

Baseline preserved verbatim at local commit **e33b736**, covering the original **17 v1.1 Markdown files**. Finding paths refer to docs/pipeline-v1.1 at that commit; active files are docs/pipeline-v1.2 plus the root index.

## Method

Read every original file; extract contracts, state actors/preconditions/side effects, capability matrix, schema columns and phase dependencies/tests. Compare those sets by hand, recording direct conflicts separately from missing interface guarantees. Rewrite portfolio contracts/matrix/schema/phases together. Then check rule-to-test and test-to-rule coverage, core/extension dependencies, duplicate IDs, links and fences mechanically. A text scanner is not claimed to prove semantic correctness.

## Findings, winners and fixes

| ID/type | File A says X | File B says Y | Winner and fix |
|---|---|---|---|
| C01 conflict | infrastructure.md: portfolio has no scheduler | phase-08.md: reconcile every five minutes using existing scheduler | Portfolio cut wins: explicit mock retry |
| C02 conflict | index/phase-07.md: 07 N/A for portfolio | contracts Q7/phase-03: SMS proof arrives through07 | Seeded core approval; optional challenge explicitly simulated |
| C03 scope inconsistency | index: portfolio R2 includes in-app updates | phase-07: all notification work skipped | Optional in-app/simulated07, not minimal prerequisite |
| C04 conflict | acceptance: runner requires both Vitest and Playwright files, fails empty suites | phase-01: only acceptance file + CI logs specified | Explicit per-phase file manifest |
| C05 lifecycle gap | schema: audit/history append-only, restricted deletes | acceptance: daily purge of those classes by age | Restricted synthetic reset exception; commercial erasure moved to appendix with distinct privileges needed |
| C06 permission gap | matrix: processor issues quote with no stage restriction | Q5: controlled post-start amendment | Admin-only post-start amendment; matrix/P03 match |
| C07 action ambiguity | T: processing/ready same-state cancellation/rework actor admin | matrix: customer/assigned staff can request change/complaint | Separate request/incident creation from executing state/money mutation |
| C08 side-effect gap | U: collection sets custody returned | P3/phase-05: atomic write list omits order custody | P3 writes returned custody in same transaction/test |
| C09 set gap | I2: evidenced admin waiver permits resolved remedy | P3/phase-05: complete original tag set, exception unspecified | Expected set minus individually evidenced waivers |
| C10 schema ambiguity | schema header: UUID PK unless stated | migration promise/original schema: preserve serial integers; rows omit type exception | Existing ID types explicitly preserved |
| C11 billing gap | Q5: settlement materializes adjustments | phase-04: accrue/waive fees without pointer/revision guarantee | Charge + new settlement + pointer/revision atomic; explicit charge/link columns |
| C12 transport gap | acceptance/phase-09: upload up to5MB | infrastructure: function-based app, no direct-upload contract; verified function cap4.5MB | Active A3 cap2MB; larger upload needs separate direct-Storage design |
| C13 provider mismatch | P4/phase-08: match currency before posting | selected SePay bank payload/API has no currency field | Pinned independently confirmed VND account or fail closed; no direct currency claim |
| C14 provider-ID gap | phase-08/infrastructure: API re-query, mapping unspecified | shown numeric webhook ID vs v2 UUID | Versioned matching lookup/verified aliases; no ID guessing |
| C15 coverage ambiguity | Q1/Q3: unconsented actual-weight changes incompletely specified | phase-03 test: unconsented increase only | Exact-price path: any changed weight without consent needs new version; reduction tested |
| C16 privacy gap | matrix: customer reads full own order/evidence | privacy intent: purpose-limited internal evidence/contact | Customer-safe projection, minimum staff fields, no automatic internal-note exposure |

C12-C14 close newly verified external assumptions, not two opposite provider quotations. C05-C11/C15-C16 include interface gaps, not all literal contradictions. No finding is hidden behind a zero-contradiction claim.

## Requested scope changes, separate from old contradictions

Portfolio only; commercial46-72-day work moved to non-checklist appendix. Bag/flagged records replace per-garment child labels. Minimal zero-balance demo omits credit overrides, remittance board and commercial machinery. Phase00 drops unapproved Auth/UI writes and future-fixture prerequisites. Private-repo required branch checks are account-dependent; CI evidence is required without assuming enforceable protection ([GitHub availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)).

## Rule/test bidirectional map

Generated below from every Rules cell in the eleven revised phase files. These are **planned assertions**, not passes. B rules are exercised in Phase00; others await authorization. Optional rules Q7/P4/U are scoped explicitly.
<!-- GENERATED COVERAGE -->

| Rule | Named tests |
|---|---|
| A1 | P01_RLS_MATRIX, P01_SERVICE_ROLE_GUARD, P05_END_TO_END, P06_CUSTOMER_ISOLATION, P07_CUSTOMER_VIEW, P09_REGRESSION, P10_DEMO_SMOKE |
| A2 | P01_RLS_MATRIX, P01_REVOKE_AND_LAST_ADMIN, P03_APPROVAL_EVIDENCE, P03_WORK_TRANSITIONS, P04_SCOPE_TRANSFER, P05_LEDGER_INVARIANTS, P05_CANCEL_INCIDENT, P09_REGRESSION |
| A3 | P01_RLS_MATRIX, P02_LOOKUP_PRIVACY, P02_SHARED_RATE, P02_BOOKING_UI, P03_BAG_INTEGRITY, P06_CUSTOMER_ISOLATION, P07_CUSTOMER_VIEW, P09_PROJECTIONS_LOGS, P09_UPLOAD, P10_DEMO_SMOKE |
| A4 | P01_MIGRATE_EXISTING, P01_CI_REQUIRED, P02_IDEMPOTENT_BOOK, P02_SHARED_RATE, P02_SLOT_RACE, P03_QUOTE_RACE, P04_STORAGE_BOUNDARIES, P05_RETRY_RACE, P07_ON_DEMAND, P08_REPLAY, P09_REGRESSION, P10_MANIFEST |
| B1 | P00_REPRO_PURITY |
| B2 | P00_BUILD_CHECKS, P01_CI_REQUIRED, P09_REGRESSION, P10_MANIFEST |
| B3 | P00_PICKUP_VALIDATION, P02_INPUT_RULES |
| I1 | P03_BAG_INTEGRITY, P09_UPLOAD |
| I2 | P03_BAG_INTEGRITY, P04_FAILED_ATTEMPT, P05_ATOMIC_DELIVER_COLLECT, P05_CASH_ROLLBACK, P10_SAFE_LABELS |
| P1 | P05_LEDGER_INVARIANTS, P05_END_TO_END |
| P2 | P03_SETTLEMENT_IMMUTABLE, P05_LEDGER_INVARIANTS, P05_REPORT, P10_SAFE_LABELS |
| P3 | P04_FAILED_ATTEMPT, P05_ATOMIC_DELIVER_COLLECT, P05_CASH_ROLLBACK, P05_RETRY_RACE, P05_REMITTANCE, P10_DEMO_SMOKE |
| P4 | P08_SIGNATURE, P08_REPLAY, P08_MONEY_CURRENCY, P08_ID_VERSION, P08_LATE_CANCELLED, P08_RETURN_UNTRUSTED, P08_API_RECOVERY, P10_SAFE_LABELS |
| Q1 | P01_MIGRATE_EXISTING, P02_V0_SNAPSHOT, P02_BOOKING_UI, P03_TOLERANCE_SCOPE, P10_DEMO_SMOKE |
| Q2 | P02_V0_SNAPSHOT, P02_INPUT_RULES, P03_TOLERANCE_BOUNDARY, P03_TOLERANCE_SCOPE |
| Q3 | P02_V0_SNAPSHOT, P03_TOLERANCE_BOUNDARY, P03_TOLERANCE_SCOPE |
| Q4 | P03_QUOTE_RACE, P05_END_TO_END, P06_APPROVE_STALE |
| Q5 | P03_SETTLEMENT_IMMUTABLE, P03_WORK_TRANSITIONS, P04_STORAGE_BOUNDARIES |
| Q6 | P03_APPROVAL_EVIDENCE, P05_REPORT, P07_PHONE_APPROVAL_SIM, P07_CHANNEL_LABEL, P10_SAFE_LABELS |
| Q7 | P06_LINK_PROOF, P07_PHONE_APPROVAL_SIM, P07_CUSTOMER_VIEW |
| Q8 | P01_RLS_MATRIX, P06_CUSTOMER_ISOLATION, P06_LINK_PROOF, P06_CONTACT_CHANGE |
| T1 | P02_IDEMPOTENT_BOOK, P02_INPUT_RULES, P02_SLOT_RACE, P05_END_TO_END, P09_STATE_COVERAGE |
| T2 | P03_WORK_TRANSITIONS, P05_END_TO_END, P09_STATE_COVERAGE |
| T3 | P03_WORK_TRANSITIONS, P05_END_TO_END, P09_STATE_COVERAGE |
| T4 | P03_WORK_TRANSITIONS, P05_END_TO_END, P09_STATE_COVERAGE |
| T5 | P05_ATOMIC_DELIVER_COLLECT, P05_END_TO_END, P09_STATE_COVERAGE |
| T6 | P02_SLOT_RACE, P05_CANCEL_INCIDENT, P09_STATE_COVERAGE |
| T7 | P05_CANCEL_INCIDENT, P09_STATE_COVERAGE |
| T8 | P03_WORK_TRANSITIONS, P05_CANCEL_INCIDENT, P06_CHANGE_REQUEST, P09_STATE_COVERAGE |
| U1 | P04_READY_CLOCK, P07_CHANNEL_LABEL, P07_ON_DEMAND |
| U2 | P04_STORAGE_BOUNDARIES, P04_DISPUTE_PAUSE |
| U3 | P04_DISPUTE_PAUSE |
| U4 | P04_DISPOSITION |

Document coverage checks: 33 rule IDs, 59 test IDs; no uncovered rules or unknown references. This verifies planned coverage, not test execution.
