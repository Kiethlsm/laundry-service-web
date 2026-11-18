# Phase 05 - immutable ledger and atomic handover - v1.2

Planned minimal phase, 1.5-2.5 days. Entry P03 and P01, **not optional P04**. Drop first: charts/CSV. Read [P1-P3/A2/A4/T5-T8](contracts.md), [core schema](schema-and-access.md).

Build simulated cash receipts/refunds/reversals, derived balance, basic receipt/report. deliver_and_collect completes order + bag/flagged custody + ledger + history in one locked transaction, task completion applies only if an optional task exists. Minimal demo requires balance zero, no credit override.

**MOCK ONLY:** no real money or bank integration. Optional courier remittance follows 04 if chosen, core handover needs neither task board nor that ledger extension.

Command planned: npm run test:gate -- P05, acceptance and E2E phase-05 files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P05_ATOMIC_DELIVER_COLLECT | P3,T5,I2 | Ready due147,500, expected bag + flagged item, same amount retained | One commit: receipt/order/history/bag and flagged-item returns, order_custody/task also complete if enabled, zero balance |
| P05_CASH_ROLLBACK | P3,I2 | Missing bag/item, unapproved waiver, under/over cash, refund-due | No partial receipt/delivery/custody change, authorized documented waiver tested separately |
| P05_RETRY_RACE | A4,P3 | Concurrent identical key then altered cash/stale revision | One receipt, replay result, altered/stale rejected |
| P05_LEDGER_INVARIANTS | P1,P2,A2 | 100k+47.5k receipt,10k refund, reversal/reversal-of-refund, excess refund and edit/delete | Net sign math correct, one reversal/original, no double refund, immutable amount/history |
| P05_REPORT | P2,Q6 | Different receive/delivery days and unverified approval | Cash flow/delivered value separated, balance and approval exceptions visible |
| P05_CANCEL_INCIDENT | T6,T7,T8,A2 | Cancel pending prepaid and picked-up, request cancellation after processing/delivery | Admin transitions only, explicit return/refund-due, no fake refund or status rollback |
| P05_END_TO_END | T1,T2,T3,T4,T5,Q4,P1,A1 | Full booking-v1 approval-QC-cash delivery with fixtures | Intended states/history/rates/ledger match, wrong identity denied |
| P05_REMITTANCE optional | P3 | Optional courier cash handed to admin twice | Allocation once, customer receipt unchanged |

- [ ] Core requires first seven IDs, no claim that mock cash is real settlement.
