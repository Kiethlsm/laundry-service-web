# Phase 03 — tagged intake and quotes · v1.1

Read: [Q and I contracts, T](contracts.md), [schema](schema-and-access.md), [runner](acceptance.md). Effort: portfolio **4–6 days**, shop **6–9 days**. Drop first: camera/barcode scanning; retain printable labels and typed tag entry. Entry: P02; real-shop tolerance/storage terms and evidence process approved.

## Work

- Register every physical garment/piece with a permanent label; parent/child pieces for pairs/sets, intake condition and private evidence. Reconcile a physical legacy inventory before allowing delivery of legacy real orders.
- Implement quote issue/approve/supersede, per-line v0 tolerance and immutable actual-weight settlements. UI separates estimate, maximum authorization and actual payable amount.
- Implement customer-message evidence for shop R1; phone notes remain explicitly unverified. Portfolio uses labeled synthetic evidence. SMS proof arrives in 07; account approval in 06.
- Processing/QC transitions use the canonical table and block unresolved issues. Capture missing/swapped-tag incidents and customer-agreed remedies.

## Gate P03_QUOTES_AND_TAGS

Command: `npm run test:gate -- P03`; artifacts `tests/acceptance/phase-03.test.ts`, `tests/e2e/phase-03.spec.ts`.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P03_TOLERANCE_BOUNDARY` | Declared checkout consent for v0: 2 kg; measure 1.70, 2.30, 2.31 kg; separately 5 kg → 5.50/5.51; repeat without tolerance consent | Inclusive consented cases settle under v0 without reconfirmation; out-of-range or unconsented increase requires v1; zero silent excess |
| `P03_TOLERANCE_SCOPE` | Two kg lines drift opposite directions; change a discrete count, fee or service; repeat small weight edits | Each line compared with original v0; totals cannot cancel violations; nonweight change needs v1; no rolling tolerance |
| `P03_QUOTE_RACE` | Issue v1, then v2; customer approves v1 concurrently | Old hash/version rejected 409; only current accepted quote can unlock processing |
| `P03_APPROVAL_EVIDENCE` | Record staff phone note, then valid customer message with quote code/total and admin verification | Note remains unverified in report and blocked; verified matching evidence unlocks exact scope; unrelated message does not |
| `P03_TAG_INTEGRITY` | Two orders, shoe pair with child tags; attempt cross-order tag, duplicate label, missing QC piece and retag | Cross-order/duplicate rejected; missing piece blocks ready/delivery; replacement chain preserves prior evidence |
| `P03_SETTLEMENT_IMMUTABLE` | Settle actual weight, then attempt direct edit of issued quote/old settlement | Contents unchanged; authorized revision creates new settlement atomically, preserving prior version |
| `P03_EVIDENCE_ACCESS` | Request private object URL as assigned processor, other customer and guest | Allowed signed URL short-lived (5 min); unauthorized users denied; raw object path not public |

- [ ] Tick after all IDs pass and price/approval/tag histories are included in the report.

Handoff: quote/settlement RPCs, label workflow, evidence capture and processing/QC gates. Selecting simulated evidence in a live environment must fail.
