# v1.1 — acceptance, severity and retention

All tests below and in phase files are **planned artifacts**, not tests already present. This revision creates Markdown only. A phase is complete only when its named tests exist, execute, and pass with evidence.

## Runner contract

Phase 00 uses current commands: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

Phase 01 installs/configures the test tooling and adds `npm run test:gate -- PNN`. This command runs `tests/acceptance/phase-NN.test.ts` with Vitest and, when specified by the phase, `tests/e2e/phase-NN.spec.ts` with Playwright. It exits nonzero if either suite fails or has no tests. `PIPELINE_TRACK=portfolio|shop` selects an explicit expected test-ID manifest; a missing, skipped or unexpectedly unexecuted required ID fails the runner. `--list` lists IDs without passing the gate. Optional feature cuts update that manifest in the reviewed scope record.

Integration fixtures run against local/disposable staging Supabase, seeded synthetic identities (admin, staff processor, courier, unrelated staff, customers A/B) and deterministic service/slot/order data. Refuse to reset a DB unless its configured reference is on the test allowlist. CI uses isolated test credentials; no production secrets in untrusted PR jobs. Clock-based tests inject a clock; concurrency tests use two independent connections, not two calls inside the same transaction.

Commands are invoked from PowerShell after setting `$env:PIPELINE_TRACK='portfolio'` or `'shop'`. Each phase specifies named tests with setup and expected result. Runner captures test IDs, counts, stdout, exit code, commit and environment into `docs/verification/phase-NN/<commit>/report.md`; reports redact PII/secrets. Manual/provider gates include reproducible steps, evidence and an actual human/operator identity, not an automated fake approval.

## Severity and release rule

| Severity | Definition with examples | Release rule |
|---|---|---|
| S0 | Cross-customer data access, privilege escalation, exposed secret, lost/duplicated money or irreversible data corruption | Blocks both tracks |
| S1 | Booking/quote/fulfillment unusable, invalid transition accepted, cash/order atomicity broken, required restore failing, required job silently lost | Blocks affected track |
| S2 | Workaround exists; nonfinancial report/filter defect, missing optional notification with visible fallback | Document owner, workaround and fix date; owner explicitly accepts |
| S3 | Cosmetic/copy issue without loss of action, readability or accessibility | Can defer with issue reference |

Passing tests plus zero open S0/S1 in the selected track is necessary; it does not declare legal compliance or guarantee unlimited capacity.

## Numeric shop targets (not portfolio requirements)

- Design baseline: one shop, **50 orders/day**, 10 staff accounts, 5,000 customers, **10,000 historical orders**, 20 tags/order average, up to 5 MB/photo; validate limits on upload and constrain storage growth by retention.
- Load script `tests/load/shop.js`: 2-minute warmup + **15 minutes at 10 requests/second, 20 concurrent clients**, synthetic mix 60% public prices, 25% authenticated order lists, 10% detail/lookup, 5% creates. Distribute public identifiers so legitimate traffic remains within rate rules. Separate abuse tests assert 429s. Run on isolated shop-sized staging, never Hobby/production.
- Acceptance: server-observed **p95 ≤2s**, writes p95 ≤3s, unexpected HTTP 5xx <1%, zero duplicate orders/receipts/slot oversells; record cold versus warm samples separately. Do not exclude unexpected timeouts from error counts. Intentional 429/validation tests run separately and do not pad success metrics.
- Outbox: first dispatch p95 ≤2 minutes, **maximum 5 minutes** in a healthy-provider 100-message staging test; test retry/dead-letter independently. Alert if oldest due item >5 minutes or scheduler health >3 minutes old; manual tasks remain visible.
- Backups: target **RPO ≤24h, RTO ≤4h** on the baseline dataset. Time from declared failure to restored DB/Auth/objects and successful smoke tests. Hash-check every manifest object and reconcile all financial aggregates. A restore with missing photos does not pass.

## Retention proposal — concrete defaults, pending legal review

Timers start at final closure unless noted. Active/unclaimed cases remain operationally retained; a dispute creates a scoped hold with reason, approver and review date every 90 days. Legal holds override automated expiry and are individually reviewable.

| Data | Proposed duration and action |
|---|---|
| Raw phone/address/order contact snapshots | 12 months after closure, then remove direct identifiers from business records unless a documented legal hold applies |
| Customer account/saved addresses | After 24 months inactive: notice at day -30, then delete/anonymize account subject to active orders, verified deletion requests and holds |
| Intake/handover/approval images and messages | 90 days after closure; if disputed, 180 days after dispute resolution, then purge object and identifying evidence payload; retain nonidentifying hash/event |
| Operational logs/error traces | 14 days, redacted at ingestion; platform shorter limits may reduce available window |
| Audit, approvals metadata and item events | 12 months; keep nonidentifying financial references longer only where required by the financial record below |
| Financial ledger, settlement snapshots, reconciliation evidence needed for accounting | Proposed 10 years with minimum necessary identifiers, segregated access; legal/accounting reviewer must confirm required categories/durations before real use |
| Raw webhook/message payload | 30 days; keep transaction ID, environment, normalized amount/reference and dedupe hash with financial record, avoiding unnecessary bank-counterparty details |
| Idempotency response cache | 7 days for ordinary mutations; immutable receipt/provider operation references provide long-term duplicate protection |
| OTP/challenges, rate keys | Expire codes in 10 minutes; purge challenge metadata after 24h, counter keys within 24h; keep only redacted abuse counts |
| Successful outbox payload | 30 days; failed payload 90 days or until issue resolution within that window, then minimal outcome only |
| Encrypted backups | 30-day rolling retention; provider Pro daily DB copies have their separately documented 7-day availability |
| Portfolio data | Synthetic only; demo reset is deterministic, and no real contact records are accepted for testing |

Daily cleanup is idempotent, chunked to ≤500 rows per transaction, and respects holds. Financial immutability means payload minimization and erasing separate identifying links, not rewriting ledger amounts. A deletion tombstone records only the minimum pseudonymous resource reference/erasure scope, with 30-day expiry after backup aging. On restore, replay tombstones from a separate protected deletion journal **before opening access**; restored backups do not silently revive erased contact data. B2 lifecycle rules align with the same 30-day window.

**Vietnamese personal-data rules require a real applicability review before shop launch.** Law 91/2025/QH15 took effect 1 January 2026 ([official law record](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=)); Decree 356/2025/NĐ-CP details implementation ([official decree PDF](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf)). The reviewer must check current amendments, processing/legal bases, notice/consent, customer rights, incident obligations, cross-border hosting/backups and accounting retention. These technical defaults are not statutory advice or a compliance claim.

## Release evidence manifest

`docs/verification/release/<commit>/manifest.md` links each required phase gate, accepted S2/S3 issues, selected cut, actual plan/provider evidence and manual sign-off. Portfolio manifest explicitly marks 07, load, restore, runbooks and live money **N/A**. Shop manifest includes backup freshness, restore report, runbooks, provider test/live distinction and named operator. A deployment build alone never satisfies this manifest.
