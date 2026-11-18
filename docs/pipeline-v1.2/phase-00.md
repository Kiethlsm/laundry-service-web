# Phase 00 - approved lint baseline - v1.2

Status: implementation authorized **only for this phase**. Effort 0.5-1 day. Drop first: screenshots. Rules: B1-B3 in [contracts](contracts.md). No SQL, migrations, config/deployment changes, dependency additions or push. Work on a non-master branch.

Reproduce the diagnostic, fix the submit-time validation boundary without disabling the rule or changing server validation, then run the three current commands. A focused dependency-free regression check may test invalid/equal/past/future timestamps and reading a fresh clock on later submission. It must not submit orders or claim an unperformed Auth/UI end-to-end test.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P00_REPRO_PURITY | B1 | Run npm run lint before edit | Capture actual rule/file diagnostic and nonzero exit |
| P00_BUILD_CHECKS | B2 | After edit run npm run lint, npx tsc --noEmit, npm run build | All exit zero, no rule/dependency/config change |
| P00_PICKUP_VALIDATION | B3 | Focused check with controlled time, verify handler uses validation and server check unchanged | Invalid/equal/past rejected, future accepted, expired-on-later-submit rejected |

- [x] Gate complete: all three checks have real passing evidence in [report](../verification/phase-00/report.md), including the expected failing reproduction and successful post-fix checks.

Commit the fix and evidence on the review branch, do not push. Browser/Auth integration checks formerly in this phase are not part of the approved narrow task and are not passed by these commands.
