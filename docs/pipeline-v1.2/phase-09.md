# Phase 09 - portfolio functional/security evidence - v1.2

Planned minimal phase, 0.5-1 day. Entry P01/P02(core)/P03/P05. Optional phase results needed only for chosen extensions. Drop first: optional UI polish. Read [acceptance](acceptance.md), [A1-A4](contracts.md).

Aggregate named rule/test coverage, selected end-to-end scenario and security regressions. **MOCK ONLY:** external behavior remains simulated; no load test, restore drill, backup job, runbook, real-provider verification or legal-compliance certification.

Command planned: npm run test:gate -- P09; acceptance and E2E phase-09 files. Use synthetic data. Optional upload case uses <=2 MB file, never the former 5 MB server request.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P09_REGRESSION | A1,A2,A4,B2 | Run mandatory manifests and chosen optional IDs; omit a required ID intentionally | Valid selected suite passes; missing ID fails; zero S0/S1 |
| P09_PROJECTIONS_LOGS | A3 | Unrelated evidence access, failing request with credential/phone fields | Safe projection, no secrets/raw contact in log |
| P09_UPLOAD optional | A3,I1 | Implemented upload: oversized/disguised file, expired signed URL | Invalid blocked, private link expires at5min, permitted <=2MB file usable |
| P09_STATE_COVERAGE | T1,T2,T3,T4,T5,T6,T7,T8 | Execute transition table fixtures, invalid reverse and wrong-actor cases | Required from/to/actor/preconditions/side effects match one canonical table |

- [ ] Core gate includes regression/projections/state coverage; upload test becomes required only when upload UI exists. No operational tests hidden in this gate.
