# Phase 07 — SMS-first notifications and R2 · v1.1

Read: [Q7/U](contracts.md), [job/channel design](infrastructure.md), [runner/retention](acceptance.md). Effort: shop **4–6 days**; **N/A for portfolio**. Drop first: Zalo adapter and optional email receipts. Entry: P06, eSMS transactional sender/template/tariff approved, prepaid balance and operator recorded. A marketing price quote is not sufficient evidence.

## Work

- Add `notification_outbox` with unique event/channel/recipient key, transactional event creation, due time, state and leases; `notification_attempts` record provider reference, outcome and ambiguity without raw secrets.
- Extend the phase-01 SQL dispatcher through `pg_net` to bounded Edge Function batches per infrastructure contract. Schedule ready reminders, quote requests and core order notifications; in-app updates available to signed-in customers.
- SMS is primary for phone-only guests. Auth email is independent, already available since R1. Deliver quote-bound challenge using Q7; messages identify exactly what the code authorizes.
- Provider delivery status updates can establish `ready_notice_at`; mere API acceptance cannot. If provider cannot evidence delivery, create a manual contact task rather than starting fees automatically.

## Gate P07_NOTIFICATION

Command: `npm run test:gate -- P07`; artifacts `tests/acceptance/phase-07.test.ts`, `tests/e2e/phase-07.spec.ts`, redacted provider/cron evidence. An approved test recipient is used for a bounded real-channel check; bulk tests use a fake provider.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P07_OUTBOX_COMMIT` | Force rollback of an order change, then commit same event | Rollback emits nothing; commit creates one logical message |
| `P07_LEASE_RETRY` | Two dispatchers claim same work; one crashes after lease; provider fails first two attempts | Single lease, expired work reclaimed, retries match schedule, no duplicate logical event |
| `P07_AMBIGUOUS_SEND` | Provider accepts request but connection times out before response | `delivery_unknown` tracked; query/idempotency reconciliation or manual task, not blind duplicate send |
| `P07_PHONE_APPROVAL` | Correct/incorrect/expired/reused quote code, stale quote hash, max guesses | Only valid current single-use code accepts quote; guesses/issues throttled; staff cannot retrieve plaintext |
| `P07_DISPATCH_LATENCY` | 100 due messages, healthy fake provider, actual stage cron/Edge schedule | First-dispatch p95 ≤2 min, max ≤5 min; no infinite/persistent worker needed |
| `P07_CHANNEL_EVIDENCE` | One guest with no email, approved SMS test phone; delivery unknown and delivered callbacks | SMS operational path works; unknown does not start notice clock; evidenced delivery does; fallback task visible |
| `P07_ALERT` | Suppress worker tick >3 min and leave due message >5 min | Named operator receives alert, failure visible in admin, order remains committed |

- [ ] Real-shop gate passes only with runner and provider/cron evidence. Portfolio records N/A; it never gets an artificial pass by sending a mock email.

Handoff: R2 automated messages with known delivery semantics, budget/limits and manual fallback. Do not add Zalo/OA work unless owner explicitly keeps it in scope.
