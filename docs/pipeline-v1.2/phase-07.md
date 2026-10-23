# Phase 07 - optional in-app/simulated notifications - v1.2

Deferred extension, 0.5-1 day. Entry P06, and P04 only if unclaimed reminders are selected. Drop first: animation. Read [Q6/Q7/U1/A1/A3](contracts.md).

**MOCK ONLY:** external channels. Use customer-owned in-app records and a simulator action; no SMS sender, SMTP, provider retries, outbox, persistent workers, cron, dispatch latency SLA or background delivery. A demo-customer view receives quote codes; staff sees status only. R1 reminders are displayed on explicit evaluate action.

Command planned if selected: npm run test:gate -- P07; acceptance and E2E phase-07 files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P07_PHONE_APPROVAL_SIM | Q7,Q6 | Wrong/expired/reused/stale-hash code; sixth guess/fourth issue; inspect persisted challenge | Only current purpose-bound code accepted; no plaintext at rest; old challenge invalidated; limits enforced; every approval labeled simulated |
| P07_CHANNEL_LABEL | Q6,U1 | Simulate pending/failed/delivered acknowledgment on synthetic order | Clear in-app/simulated labels; acceptance alone does not establish ready notice |
| P07_CUSTOMER_VIEW | A1,A3,Q7 | Staff/other-customer requests notification/code | Denied; intended demo customer only |
| P07_ON_DEMAND | U1,A4 | Repeat evaluate action with frozen clock | One logical notification; no job or external send |

- [ ] Tick only on passing simulation tests; it never certifies SMS delivery.
