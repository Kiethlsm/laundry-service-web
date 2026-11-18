# Phase 02 - reuse booking and add v0 - v1.2

Planned minimal core: 0.5-1 day. Entry P01. Drop first: new catalogue/slot editors. Read [Q1-Q3/A3/A4/T1/T6](contracts.md), [schema](schema-and-access.md).

Reuse current guest booking/lookup. Add v0/max-consent snapshot, strict DB total, atomic retry and synthetic-order flag. Keep existing times/services validation and public safe projection. A service-only DB counter may provide shared rate windows on existing Free DB; no Redis account prerequisite. Request/admin-driven bounded pruning, no jobs.

Slot capacity/editor is an optional 1-2-day extension; it is not a dependency of the minimal booking scenario. Any later UI work preserves the current design.

Command planned: npm run test:gate -- P02; manifest: tests/acceptance/phase-02.test.ts and tests/e2e/phase-02.spec.ts.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P02_IDEMPOTENT_BOOK | A4,T1 | Same create key twice then altered payload | One order/quote; replay result; altered payload 409 |
| P02_V0_SNAPSHOT | Q1,Q2,Q3 | 2.5kg*25,000 + pair*80,000; edit catalogue; compare max consent | Base 142,500; snapshots retained; max bound correct; declared approval v0 only |
| P02_INPUT_RULES | B3,Q2,T1 | Past/invalid time, inactive service, fractional discrete count | Rejected without partial order |
| P02_LOOKUP_PRIVACY | A3 | Correct/incorrect code+phone, unrelated user | Minimal progress/amount only; no internal contact/evidence |
| P02_SHARED_RATE | A3,A4 | Two instances use same DB window; exceed budget; DB unavailable | Aggregate limit enforced; unavailable returns 503, not fake success |
| P02_BOOKING_UI | A3,Q1 | Keyboard booking on 360/390/768/1440px, failed retry | Consent/errors clear, input preserved, no page overflow |
| P02_SLOT_RACE optional | A4,T1,T6 | Extension: two creates for final slot, then cancel | One reservation; cancel releases it once |

- [ ] Core gate requires first six IDs; slot ID added only if extension selected.
