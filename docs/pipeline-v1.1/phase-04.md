# Phase 04 — staff, custody and unclaimed orders · v1.1

Read: [I/U/T](contracts.md), [permission matrix](schema-and-access.md), [SMTP/jobs](infrastructure.md), [runner](acceptance.md). Effort: portfolio **2–3 days**, shop **4–6 days**. Drop first: visual route/calendar; keep sortable task list. Entry: P03; shop SMTP delivery proven in P01.

## Work

- Staff invitation/reset uses configured custom SMTP on shop track, synthetic provisioned accounts on portfolio track. Assign processors/couriers from the canonical role/scope model; disable/transfer staff without losing history.
- Provide date/assignee task lists, failed-attempt reasons, pickup/return evidence, item custody scans and recipient evidence. Task assignee and active courier assignment update together.
- Implement U1–U4 reminder tasks, evidenced-contact timestamp, overdue/dispute/disposition-review states, fee accrual/cap/waivers and lawful-disposition recording. Shop uses SQL jobs; portfolio uses injected clock and admin evaluation, not a scheduler/outbox.
- Delivery task completion is not an independent shortcut: until P3 is implemented in phase 05, leave handover as a pending action in staging.

## Gate P04_CUSTODY

Command: `npm run test:gate -- P04`; artifacts `tests/acceptance/phase-04.test.ts`, `tests/e2e/phase-04.spec.ts`.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P04_SCOPE_TRANSFER` | Reassign task from courier A to B; keep A's session alive | Task and assignment agree; A immediately loses mutation scope; B gains only assigned access |
| `P04_READY_CLOCK` | Mark ready without successful notice; advance clock 30 days; then record evidenced contact | No fees before notice; initial/+3/+7/+14 tasks keyed once from actual notice, within contact hours |
| `P04_STORAGE_BOUNDARIES` | Consented policy and contacted order at days 7, 8, 27, 50; run duplicate ticks | Charges 0/5,000/100,000/100,000; no duplicate daily charge; fee-free if policy unaccepted |
| `P04_DISPUTE_PAUSE` | Hold from day 5 to day 15, resolve then advance 3 days | Ten held days excluded from effective age; only one charged day at effective day 8 |
| `P04_DISPOSITION` | Day 90, no release evidence; try dispose, then supply itemized reviewed authorization | First denied and held; valid admin action records all tags/disposition and closed_unclaimed, not delivered/paid |
| `P04_FAILED_ATTEMPT` | Recipient absent or piece mismatch | Failure recorded; order stays ready; next attempt/task visible; no delivery timestamp/receipt |
| `P04_STAFF_INVITE` shop only | Admin invites real test address, recipient follows link, then account disabled | Valid one-time invite/login; old invitation reuse rejected; disabled user denied |

- [ ] All applicable IDs pass; label/custody and reminder evidence included in report.

Handoff: staff/task interfaces, physical inventory continuity and unclaimed-order workflow. Commercial storage/disposition text remains subject to the local review gate before external use.
