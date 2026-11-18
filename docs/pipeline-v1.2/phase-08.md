# Phase 08 - optional payment verification demonstration - v1.2

Deferred extension, 1-2 days. Entry P05, no dependency on 07 or scheduler. Drop first: actual SePay Test Mode connection. Read [P4/A4](contracts.md), [exact provider mechanism](infrastructure.md).

**MOCK ONLY:** local signed webhook and fake authenticated transaction lookup, synthetic VND-account evidence, explicit retry/reconcile button. No bank connection, live transfer, real refund, timed polling or queue. Optional external Test Mode would need a separately approved account/key test, it is not necessary to pass portfolio acceptance.

Provider fixture uses timestamp.raw-body HMAC, matched API ID version, separate lookup response and pinned denomination context. Show what cannot be proven directly: currency missing from shown SePay bank payload. API unavailable means pending review until explicit demo retry, mock returnUrl never writes money.

Command planned if selected: npm run test:gate -- P08, acceptance and E2E phase-08 files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P08_SIGNATURE | P4 | Alter bytes/header/key, missing/old/future timestamp | Invalid proof rejected before ledger change |
| P08_REPLAY | P4,A4 | Ten repeated/aliased events, then same ID altered payload | One receipt, alias mapping deduped, conflicting payload quarantined |
| P08_MONEY_CURRENCY | P4 | Exact/partial/excess/outgoing transfer, missing currency with/without independently confirmed VND account | Only exact incoming pinned-VND context auto posts, no missing-currency default |
| P08_ID_VERSION | P4 | Numeric webhook ID sent to UUID lookup, then matching versioned lookup | First blocks for mismatch, correct lookup/account/ref confirms identity |
| P08_LATE_CANCELLED | P4 | Expired reference/cancelled order transfer | Explicit actual simulated receipt/reconciliation, order not reopened/paid blindly |
| P08_RETURN_UNTRUSTED | P4 | Forged success query parameter | No ledger mutation |
| P08_API_RECOVERY | P4 | Fake API unavailable then explicit retry | First stays pending, verified retry posts once, no scheduler |

- [ ] All mock IDs must pass if extension included. No live-payment checkbox exists.
