# Phase 00 — baseline and cut selection · v1.1

Context: [index](../../FULL_SCOPE_PIPELINE.md), [acceptance runner/severity](acceptance.md). Effort: portfolio **1–2 days**, shop **2–3 days**. Drop first: extra screenshots. Entry: user authorizes implementation and chooses the track; currently neither phase nor fix is started.

## Work

1. Record portfolio/shop, confirmed Hobby + Free, actual deployment URL and whether existing data are synthetic. For shop, record the hosting/provider dependency register from [infrastructure](infrastructure.md).
2. **Reproduce the known `react-hooks/purity` lint violation** at `Date.now()` in `components/booking-form.tsx`. Save its diagnostic. Apply a narrow fix in this phase, preserve submit-time future-date validation on client and server, then run lint, typecheck and build. This is a scheduled fix, not an open investigation. Do not disable the rule globally or remove validation to obtain green output.
3. Capture current guest/admin functionality with synthetic data; confirm which failures are existing versus introduced. Update README/PRODUCT factual status after authorization, retaining the historical demo pipeline.

## Named gate P00_BASELINE

Run each existing command sequentially in a disposable/local workspace:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

| Test name | Setup/action | Expected result |
|---|---|---|
| `P00_REPRO_PURITY` | Before edit, run lint on current source | Capture the known diagnostic with file/line/rule; if already fixed externally, record exact prior/current diff instead of inventing failure |
| `P00_BUILD_CHECKS` | After narrow fix, run all three commands above | Each exits 0; lint rule remains enabled |
| `P00_PICKUP_VALIDATION` | On local UI, submit past time then a valid future time with same service/customer fixture | Past time rejected without order; future request reaches booking API and retains server validation |
| `P00_AUTH_BASELINE` | Synthetic admin credentials and unauthenticated browser | Unauthenticated /admin redirects; valid active admin reaches order list; failures documented and resolved before phase 01 |

- [ ] Gate passes only when all four results and selected cut are recorded in `docs/verification/phase-00/<commit>/report.md`.

Exit handoff: clean baseline commit reference, report, chosen cut and unresolved external dependencies. During the present **documentation revision**, no code fix/test harness is implemented or claimed complete.
