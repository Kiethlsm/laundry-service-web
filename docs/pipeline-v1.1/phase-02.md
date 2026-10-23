# Phase 02 — catalogue and booking · v1.1

Read: [Q1–Q3, Q8, T](contracts.md), [schema/access](schema-and-access.md), [rate store](infrastructure.md), [runner](acceptance.md). Effort: portfolio **2–4 days**, shop **4–6 days**. Drop first: address autocomplete. Entry: P01.

## Work

- Add admin catalogue/settings, archive services, explicit service areas, hours/holidays, pickup slots with capacity and preparation lead time. Default proposal: 2-hour slots, capacity 5, minimum lead time 2 hours; owner can edit validated settings.
- Booking snapshots quote v0 and policy/consent, validates quantities/time on server, reserves slot and returns one order under retry. Slot changes/cancellation release old capacity transactionally.
- Use configured shared Redis limits; synthetic UI tests use an isolated test namespace. Keep public lookup minimal and exclude address, internal notes and private images.
- Apply impeccable when implementation begins; preserve the accepted CSS washer design. Forms retain entries on failure and support keyboard/focus, responsive 360/390/768/1440px layouts and reduced motion.

## Gate P02_BOOKING

Command: `npm run test:gate -- P02`; files `tests/acceptance/phase-02.test.ts`, `tests/e2e/phase-02.spec.ts`.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P02_SLOT_RACE` | Slot has one space; two independent sessions create distinct valid bookings concurrently | Exactly one accepted; other returns slot-full; reserved_count matches |
| `P02_IDEMPOTENT_BOOK` | Send identical operation key twice, then change payload under same key | One order/v0/reservation; cached result on repeat; changed request 409 |
| `P02_V0_SNAPSHOT` | Book 2.5 kg at 25,000 plus one pair at 80,000; edit catalogue price | v0 remains 142,500 VND, original rates; max weight amount/disclosure saved |
| `P02_INPUT_RULES` | Past time, holiday, unsupported area, 1.5 discrete items, archived service | Each rejected with no partial order/slot reservation |
| `P02_RATE_SHARED` | Two app instances share Redis; exceed lookup threshold; then simulate Redis outage | Combined request threshold enforced with 429; outage returns documented 503; no per-process bypass |
| `P02_LOOKUP_PRIVACY` | Correct/incorrect code+phone pairs | Correct returns restricted projection; wrong pair reveals no existence/address/evidence |
| `P02_BOOKING_UI` | Keyboard booking on four named viewports, validation retry, reduced motion | Actions operable, input preserved, no horizontal page overflow; errors announced |

- [ ] All IDs pass with report; catalogue/settings changes do not alter existing quotes.

Handoff: booking/lookup contracts, v0 fixtures, rate settings and screenshot evidence. Client totals are presentation only; database remains pricing authority.
