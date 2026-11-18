# v1.2 - portfolio acceptance only

Phase 01 access foundation is now authorized locally, after Phase 00. Later domain slices and every hosted change require their own scope. [Inactive commercial requirements](appendix-real-shop.md) do not contribute phase checkboxes.

## Planned runner and manifest

Phase 00 uses existing npm run lint, npx tsc --noEmit, npm run build and a dependency-free focused validation check. Phase 01 implements npm run test:gate -- P01 with an explicit required-ID manifest and Node's built-in test runner, it needs no new dependencies. Run only listed files, P01 is integration-only with no empty E2E file. Missing/empty/skipped required IDs fail. Future browser tests need a separately reviewed runner choice, no package is assumed installed.

Minimal manifest includes phases 01/02(core)/03/05/09/10. Phases 04/06/07/08 and 02's editor/slot extension are deferred until separately chosen. Every test row has a Rules column referring to a real contract ID, every contract ID has a forward test link in consistency-audit.md. A planned mapping is not a passing test result.

Fixtures: synthetic admin, processor/courier with both assignments, unrelated staff, customers A/B, two owned orders and a guest. Minimal RLS tests use these fixtures, no customer portal dependency. Isolated reset requires test-DB allowlist. No remote SQL/reset during Phase 00. CI/secrets must not expose service-role to untrusted PRs.

Report command, environment, source commit, test IDs, output and exit code. Gate passes only on those records. Reports state deferred cases rather than giving a fake N/A pass to needed tests. Human sign-off is separate.

## Severity

| Severity | Definition | Rule |
|---|---|---|
| S0 | Cross-customer access, privilege escalation, exposed secret, duplicate/lost ledger money | blocks release |
| S1 | Booking/quote/handover broken, stale approval accepted, invalid transition, atomic rollback broken | blocks release |
| S2 | Nonfinancial defect with workaround | owner accepts with issue/workaround/date |
| S3 | Cosmetic defect without accessibility/action loss | may defer with issue |

## Synthetic data and finite resources

Dataset cap proposal: 100 synthetic orders, 20 bags/order maximum, 20 flagged items/order maximum, optional image 2 MB, limit demo account capabilities and label every monetary/provider action simulated. Retain last 100 orders for presentation, reset only explicit disposable demo environment via an authenticated admin action, which is future work and may be manual maintenance rather than an unattended job.

No load, recovery-time, continuous-delivery or uptime claim. Only functional/security regression and the selected end-to-end scenario gate the demo. Runtime/egress limits are in infrastructure.md, pause/unavailable state must be visible instead of inventing order success.

## Retention and append-only qualification

Keep synthetic demo data until reviewed reset, redact credentials and avoid collecting real addresses/phone numbers from reviewers. Append-only means ordinary application mutations cannot rewrite history, not that an explicitly allowlisted synthetic reset is impossible. No automated cleanup worker is required. Platform logs have their actual plan retention, no promised 14-day log archive.

Commercial durations, legal holds, erased-record replay and the Vietnamese legal/accounting review belong exclusively to the inactive appendix. This portfolio does not assert regulatory compliance. Treat any accidental real personal data as out of scope: stop using that fixture, restrict access and request owner-directed removal rather than pretending it is synthetic.

## Release manifest

List passing mandatory phases, the exact minimal/optional features included, unresolved issues and actual demo deployment URL. No live provider token, SMTP sender, scheduled job, restore/load report or commercial operator sign-off is required. Domain deployment remains a separate action, not authorized by the current Phase 00 task.
