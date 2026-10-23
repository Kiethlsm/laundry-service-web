# Phase 05 — ledger, atomic collection and R1 · v1.1

Read: [P contract](contracts.md), [schema/access](schema-and-access.md), [runner/severity](acceptance.md). Effort: portfolio **3–5 days**, shop **5–8 days**. Drop first: trend charts/CSV; keep basic totals and reconciliation. Entry: P04. This is internal R1 acceptance, not permission to launch a real shop.

## Work

- Build append-only receipts/refunds/reversals, payment-derived balances, admin credit authorizations and courier remittance allocations. Manual bank transfers require matching bank evidence and a unique reference.
- Deliver P3 as one transaction/RPC, including actual cash receipt, tag reconciliation, task completion and delivered history; expose one “Deliver and collect” action. Separate cash held by courier from cash remitted to shop.
- Print customer receipt with accepted services/actual quantities/charges/payments; omit internal notes. Report cash flow, fulfilled value, debt/refund due and unverified approvals separately.
- Admin can resolve pre-processing cancellation with return/refund tasks, complaints, rework child order and lawful write-off adjustments. No fabricated refund entry while money has not been returned.

## Gate P05_R1_FINANCIAL

Command: `npm run test:gate -- P05`; artifacts `tests/acceptance/phase-05.test.ts`, `tests/e2e/phase-05.spec.ts`.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P05_ATOMIC_DELIVER_COLLECT` | Ready order due 147,500, zero paid; assigned courier records all tags/recipient and retains 147,500 cash | One transaction commits receipt, delivered task/items/order/history; resulting balance zero |
| `P05_CASH_ROLLBACK` | Same setup, but missing tag or collected 140,000 without approved credit | No receipt, no delivered status or handover side effect; readable error |
| `P05_RETRY_RACE` | Two simultaneous identical P3 requests; repeat key with altered cash | One receipt/history/task success; repeat returns prior result; altered request 409 |
| `P05_CREDIT_AND_REFUND_DUE` | Ready order with 7,500 debt and valid 7,500 credit, then expired credit; separate refund-due case | First can deliver with reported debt; expired/insufficient authorization rejected; refund-due requires admin resolution |
| `P05_LEDGER_INVARIANTS` | Collect 100,000 then 47,500; refund 10,000; try mutate/delete/over-refund/double reversal | Net 137,500 with explicit balance; invalid actions rejected; history intact |
| `P05_REMITTANCE` | Courier hands 147,500 to admin; attempt to allocate same receipt again | Cash-holder balance settles once; customer net receipts unchanged; over-allocation rejected |
| `P05_END_TO_END` | Multi-service booking, weigh/quote approval, process/QC, handover; second order cancelled after pickup | First completes with correct receipt/reports; second retains return/refund tasks and history until genuinely resolved |

- [ ] All IDs pass; DB aggregates match receipt and basic report, with zero S0/S1.

Handoff: R1 staging demo with money/custody evidence; excluded optional reporting features listed explicitly in scope record.
