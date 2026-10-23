# Phase 08 — bank-transfer integration · v1.1

Read: [P](contracts.md), [provider comparison/jobs](infrastructure.md), [runner](acceptance.md). Effort: portfolio **1–2 days**, shop **5–8 days**. Drop first: card gateway, which remains outside the selected release unless separately approved. Entry: P05; shop launch also requires P07 and bank-compatible SePay tier/budget/credentials. Local signed mock is sufficient for portfolio; SePay Test Mode optional.

## Work

- Use SePay bank-transfer webhook/API path selected by the comparison, one receiving bank account and environment-specific secrets. Capture current provider HMAC raw-body fixture and API verification contract; separate test/live data and keys.
- `payment_attempts`: order/settlement revision, random unique transfer reference, exact expected VND, environment, expiry (30 min), state and provider ref; one active attempt/order. Reissuing a quote expires an old attempt without erasing later received money.
- `webhook_events`: environment/provider ID uniqueness, payload hash, verification status, normalized transaction, received/processed times and reconciliation result. Return success only after durable receipt/event recording; unknown bank references go to admin reconciliation.
- HMAC verification precedes parsing/money actions. Match configured destination, incoming direction, currency and reference. API reconciliation confirms provider transaction before ledger posting; queue when API is unavailable. Exact payments can settle automatically; partial, excess, expired-reference and cancelled-order transfers remain visibly reviewable.
- Reconcile pending events every 5 minutes using the existing scheduler, with bounded provider calls; browser return page polls server state. Refunds use existing admin/bank-evidence flow, not an invented gateway refund API.

## Gate P08_PROVIDER

Command: `npm run test:gate -- P08`; artifacts `tests/acceptance/phase-08.test.ts`, `tests/e2e/phase-08.spec.ts`. Portfolio runs signed local fixtures only and labels them mock. Shop additionally uses isolated SePay Test Mode evidence.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P08_SIGNATURE` | Alter raw body/signature, use wrong secret/environment/account | Rejected/quarantined; no ledger receipt |
| `P08_REPLAY` | Deliver identical authenticated event concurrently 10 times, then same ID with changed payload | One ledger receipt; safe prior result on repeat; conflicting payload creates alert, not altered money |
| `P08_MONEY_MATCH` | Attempt due 147,500; events 147,500, 140,000 and 160,000 with distinct references | Exact settles once; actual partial/excess preserved in reconciliation; no fabricated paid result |
| `P08_LATE_CANCELLED` | Cancel/expire attempt then receive transfer | Real incoming money tracked; order not reopened/delivered; refund/reconciliation task created |
| `P08_RETURN_UNTRUSTED` | Navigate returnUrl with forged paid query parameter | UI displays actual DB state; zero new receipt |
| `P08_API_RECOVERY` | API verification unavailable then restored; leave one webhook missing | Pending money not posted prematurely; reconciliation retrieves/dedupes evidence and posts once |
| `P08_PROVIDER_TEST_MODE` shop only | Create test bank/reference and simulated transfer in SePay | Real provider test webhook/API paths pass; no live transaction or live reporting |

- [ ] All applicable IDs pass with mock/sandbox distinction in report. Live verification is a separate explicitly authorized phase-10 step, never triggered by this document.

Handoff: one supported transfer provider, reconciliation UI, secret-rotation notes, and known limits. No card coverage or automated refund capability is claimed.
