# Phase 10 — release and handover · v1.1

Read: [index/cut](../../FULL_SCOPE_PIPELINE.md), [release manifest](acceptance.md), [dependency register](infrastructure.md). Effort: portfolio **1–2 days**, shop **2–4 days**. Drop first: marketing video. Entry: P09 passed, selected plan/provider dependencies resolved, and user authorizes the intended push/deployment/migration action.

## Work

- Prepare PR/release notes, CI evidence, compatible migration order and feature flags. Deploy Preview against isolated staging; production `master` points to production env only. Keep schema additions compatible with prior code; use forward repair where data rollback would lose new records.
- Portfolio: retain Hobby + Free, synthetic input/demo labels and reset process, mock/Test Mode payments. README includes actual verified URL and scoped demo login. No live provider webhook route/secret or real customer data.
- Shop: verify Pro billing, domain, Auth redirects, SMTP/SMS senders, provider bank account, job secrets, backup freshness and operator access. Activate booking/payment flags only after required smoke checks.
- Produce the release evidence manifest, update README/PRODUCT and train the shop operator. Shop receives runbooks; portfolio receives a concise demo guide, not operational readiness claims.
- A bounded live bank-transfer check needs explicit approval of payer/account/amount/refund plan. Without it, keep online payment disabled and mark R3 live integration pending; do not label full shop scope complete.

## Gate P10_RELEASE

Command: `npm run test:gate -- P10`; artifact `tests/e2e/phase-10.spec.ts` plus `tests/acceptance/phase-10.test.ts` manifest checks. CI/test phases do not make real payments. Production smoke writes are a separately authorized, labeled test order with recorded cleanup/accounting treatment.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P10_MANIFEST` | Validate selected track report links and required-ID results at release commit | No missing/skipped required tests, no open S0/S1, exact deployed commit/environment recorded |
| `P10_DOMAIN_SMOKE` | Browser checks public pages; authorized synthetic/test order; account/admin login, quote and handover | Domain uses intended env, full selected flow works, unauthorized admin denied, no real secrets in client assets |
| `P10_DEPLOY_COMPAT` | Deploy candidate with additive schema, then previous compatible code on staging | Prior reader works; new records preserved; feature disable/forward repair path documented |
| `P10_SHOP_PROVIDERS` shop only | Operator verifies subscription/send/job/backup status and one approved small live transfer | Authorized live receipt matches bank/API/ledger once; agreed refund confirmed by bank evidence; backup age ≤24h; credentials redacted |
| `P10_HANDOVER` | Owner reviews actual release and exclusions; shop operator signs operational handover | Named, dated real sign-off; portfolio labeled non-commercial demo, shop full R1–R3 only if all real gates pass |

- [ ] Tick after selected gate passes and owner sign-off is recorded. Build-green/push-success alone does not satisfy it.

End condition: a reviewed release matching the selected cut, with explicit pending items. Neither this phase file nor the review approval authorizes future paid-service activation by implication.
