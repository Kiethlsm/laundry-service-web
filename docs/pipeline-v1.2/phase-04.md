# Phase 04 - optional task board and unclaimed simulation - v1.2

Deferred extension, 1-2 days, not a minimal-demo dependency. Entry P03. Drop first: calendar. Read [U1-U4/I2/A2/A4/P3](contracts.md), [optional tables](schema-and-access.md).

**MOCK ONLY:** on-demand injected-clock evaluation creates reminder/charge/custody state. No cron/outbox, SMS, real storage debt or actual disposal. Task assignment and courier scope change atomically. Customer absence creates attempt history, not delivered state.

Command planned if chosen: npm run test:gate -- P04, acceptance and E2E phase-04 files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P04_SCOPE_TRANSFER | A2 | Reassign task, reuse previous courier session | Old scope denied, task/assignment agree |
| P04_READY_CLOCK | U1 | Advance ready order without acknowledgment, then simulate customer acknowledgment | No fee clock before proof, due reminders 0/3/7/14 shown within business hours |
| P04_STORAGE_BOUNDARIES | U2,Q5,A4 | Days 7/8/27/50, duplicate evaluate, unconsented policy | 0/5k/100k/100k, same-day no duplicate, no consent zero, settlement updated once |
| P04_DISPUTE_PAUSE | U3,U2 | Hold day5-15 then advance 3 days | Effective age8, one charged day, open dispute blocks ordinary handover |
| P04_DISPOSITION | U4 | Day90 no simulated release, then admin adds valid simulated evidence | Hold first, demonstrative closed_unclaimed only with evidence, no paid/delivered fabrication |
| P04_FAILED_ATTEMPT | I2,P3 | Recipient absent or flagged item missing | Ready retained, no receipt/returned custody, attempt visible |

- [ ] Optional gate tick only after every listed test passes, otherwise remains deferred.
