# Phase 03 - bag intake and versioned quotes - v1.2

Planned minimal phase, 2-3 days. Entry P02(core). Drop first: photo UI/camera scanning. Read [Q1-Q6/I1/I2/T2-T4/T8](contracts.md), [schema/matrix](schema-and-access.md).

One tag per bag, count/condition per service group, separate records only for flagged/high-value items. Text evidence sufficient. Processor measures/issues quotes before processing, courier handles intake. Admin alone issues post-start amendments. Record expected handover set here so phase 05 does not depend on optional 04.

**MOCK ONLY:** v1+ customer approval uses seeded owned account action or admin-reviewed simulated customer evidence. It never claims real phone verification. Implement immutable quote/settlement revisions and processing/QC gates.

Command planned: npm run test:gate -- P03, acceptance and E2E phase-03 files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P03_TOLERANCE_BOUNDARY | Q2,Q3 | 2kg measured at1.70/2.30/2.31, 5kg at5.50/5.51, no-consent increase and reduction | Inclusive bounds under v0 only when consented, others require exact new version |
| P03_TOLERANCE_SCOPE | Q1,Q2,Q3 | Offset two kg lines, change count/fee, repeat weighings | Per-original-line comparison, no net/rolling workaround |
| P03_QUOTE_RACE | Q4,A4 | Issue v1 then v2, accept stale v1, reject/expire v2 | Old hash denied, old approval not silently restored |
| P03_APPROVAL_EVIDENCE | Q6,A2 | Staff phone note, forged simulator, authorized synthetic approval | Note stays unverified, unauthorized simulation denied, exact verified demo evidence unlocks work |
| P03_SETTLEMENT_IMMUTABLE | Q5,P2 | Change actual weight, charge list, attempt old-content edit | New settlement/revision, old unchanged, charge not counted twice |
| P03_BAG_INTEGRITY | I1,I2,A3 | Two bags plus flagged jacket, duplicate/cross-order/retag | Unique labels, same-order ownership, retained event chain, missing record blocks QC |
| P03_WORK_TRANSITIONS | T2,T3,T4,T8,A2,Q5 | Courier intake, processor QC, unresolved issue, processor post-start amendment | Valid flow succeeds, wrong actor/issue/amendment denied, admin amendment requires accepted scope |

- [ ] Gate requires all IDs and recorded quote/bag histories.
