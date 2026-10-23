# Phase 10 - portfolio release package - v1.2

Planned minimal phase, 0.5 day. Entry P09. Drop first: marketing video. Read [index](../../FULL_SCOPE_PIPELINE.md), [acceptance](acceptance.md). Deployment/push remains a separate future authorization; current task authorizes neither.

Prepare README/demo guide, exact included feature/test manifest, synthetic-data labels, private/safe demo accounts, migrations and verified demo URL only after later deployment authorization. Keep Hobby non-commercial terms and Free pausing visible. Do not claim continuous notifications or bank settlement.

**MOCK ONLY:** every provider/monetary action in the demo. External service secrets/senders/scheduled jobs are not release requirements.

Command planned: npm run test:gate -- P10; manifest + E2E files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P10_MANIFEST | B2,A4 | Validate mandatory gate reports/commit, optional-selection record | No missing required pass, no fabricated skipped pass |
| P10_DEMO_SMOKE | A1,A3,Q1,P3 | Authorized synthetic local/preview demo, wrong admin session | Selected scenario works; wrong session denied; no real secret in client assets |
| P10_SAFE_LABELS | Q6,P2,P4,I2 | Review README/UI/provider/bag limitations | Simulated money/evidence, no per-garment proof, no real-shop readiness claims |

- [ ] Gate requires actual checks and owner review; a successful build alone is not a release. Domain evidence stays pending while deployment is unauthorized.
