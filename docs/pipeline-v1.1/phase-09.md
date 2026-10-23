# Phase 09 — assurance and shop operations · v1.1

Read: [acceptance severity/targets/retention](acceptance.md), [backup/jobs](infrastructure.md), selected phase results. Effort: portfolio **1–2 days**, shop **5–8 days**. Drop first: a second load experiment above the agreed baseline; baseline/restore/security are mandatory for shop. Entry: all applicable P01–P08 pass.

## Work

- Both tracks: aggregate security/functional regressions, enforce severity rules, validate private upload types/sizes (≤5 MB/image), signed URL expiry, redacted logs and accessible layouts. Require MIME/content validation and object authorization, not filename extension alone.
- Portfolio cut: no load script execution, restore drill, backup automation, runbooks or outbox. Complete functional/security release evidence with synthetic data only.
- Shop: implement scheduled encrypted export/object backup to B2 with manifests, cleanup/holds/tombstones, health alerts and operator dashboard. Run the quantified load and recovery tests. Capture current legal/accounting review of retention, processing notices and cross-border data handling; change defaults if review requires it.
- Shop: write short runbooks for provider/API outage, duplicate/unknown money, missing tags, scheduler lag, backup failure, restore, credential rotation and rollback. Each names operator, exact steps and verification, plus an escalation contact supplied by owner.

## Gate P09_ASSURANCE

Command: `npm run test:gate -- P09`; artifacts `tests/acceptance/phase-09.test.ts`, `tests/e2e/phase-09.spec.ts`. Shop runner additionally invokes `k6 run tests/load/shop.js` and a disposable-environment restore harness `scripts/verify-restore.mjs`; those scripts are created in this phase. They are not executed on real production data for testing.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P09_REGRESSION` | Run all selected phase-ID manifests and secret/authorization checks | Required IDs present/passing; zero S0/S1; S2/S3 have owner/workaround/date |
| `P09_UPLOAD_AND_LOGS` | Oversized/disguised file, unrelated user URL fetch, expired URL, failing request with phone/token input | Invalid upload denied, private URL denied/expired, no raw token/phone in captured logs |
| `P09_LOAD` shop only | Baseline dataset and 15-minute 10 req/s scenario from acceptance artifact | p95 thresholds/error budget met; zero duplicates/oversells; cold samples reported |
| `P09_RESTORE` shop only | Encrypt snapshot + manifest, insert later control record, simulate loss in isolated target, restore under stopwatch | DB/Auth/RLS/grants and every referenced object hash verified; financial aggregates equal snapshot; later record absent; RPO ≤24h and RTO ≤4h |
| `P09_RETENTION_HOLD` shop only | Closed records beyond each retention boundary, one held dispute, erased-contact tombstone, restore older backup | Due fields/objects purged, held data retained, financial amount unchanged; deletion journal replay removes revived contact before access |
| `P09_RUNBOOK` shop only | Operator follows provider-outage/backup-failure procedure in staging | Failure detected within documented threshold, fallback/alert works, operator records successful recovery |
| `P09_LEGAL_RECORD` shop only | Owner supplies dated reviewer outcome and approved policy version | Manifest contains real reviewer identity/scope/outcome, retention exceptions and outstanding obligations; no compliance claim inferred from tests |

- [ ] Gate passes for the selected manifest. Operational IDs are explicitly N/A on portfolio; shop cannot omit them to meet a deadline.

Handoff: assurance report, actual measured limits, approved retention policy, backup/restore/runbooks for shop. A failed recovery or leaked cross-customer row is a release blocker with the stated severity.
