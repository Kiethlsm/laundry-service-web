# Minimal demo — execution route after Phase 01

Local-only plan, production and hosted database remain on the old code/schema. The parked fix/booking-tests-and-validation branch is not a dependency. No hosted rollout, paid account or new package is authorized here.

| Slice | Estimate | Observable end point | Tables / application files |
| --- | --- | --- | --- |
| 01 foundation (this slice) | 2–3 days | Tested roles, assignment scope, active identity, guarded membership changes, CI definition | profiles/orders additions, order_assignments/audit_events/idempotency_keys, lib/admin.ts, admin/actions.ts, local tests, migration and workflow |
| 02 core booking | 0.5–1 day | Synthetic booking creates accepted v0 with actual checkout consent and repeat-safe result, old rows remain review-required | order_quotes/order_quote_items/quote_approvals, item snapshots, API orders, booking form, versioned migration |
| 03 quote workflow | 2–3 days | Admin detail shows bag intake, measured quantities, issued versions and clearly simulated approval, stale approval cannot start work | laundry_bags/flagged_items/custody_events/evidence, order_settlements/settlement_items/order_charges/settlement_charges, admin detail/actions and migration |
| 05 simulated ledger + handover | 1.5–2.5 days | Detail shows append-only receipts/refunds/reversals, derived balance and atomic deliver-and-collect | payment_transactions and active settlement pointers, admin detail/actions, migration |
| 09/10 verification + packaging | 1–1.5 days | Named money/isolation/transition tests and reproducible synthetic walkthrough | Tests, CI, README/demo instructions, no hosted deployment implied |

Phase 01 does not create empty speculative quote/payment tables. Each later table arrives with its owning invariants and failing tests. Active pointers must reference records on the same order when those tables arrive. Baseline status buttons are legacy compatibility, not proof that T2–T5/P3 are implemented: later phases must gate them through intake, settlement, QC and atomic handover before declaring the minimal demo complete.

## Fixed requirements for those slices

- Q1–Q4: v0 snapshots and tolerance consent, for each original kg line inclusive tolerance max(10% of original kg, 0.30 kg). No netting across lines. Within consented bounds settle at snapshot rates, count/service/rate/fee/discount changes or out-of-bound weight need v1+. Issued contents immutable, stale quote/hash acceptance fails. No consent is inferred for existing rows.
- Q5/Q6: integer VND with per-line rounding, immutable settlement versions and adjustment membership, v1+ exact quantities, linked-customer or authorized visibly simulated approval. Unverified phone notes never unlock processing.
- P1/P2: positive entry amounts, signed receipt/refund/reversal effects, original references and once-only reversals. Derive net received/balance/status, never edit a paid flag. Refund availability is checked under the same order lock.
- P3/T5: reconcile all bags/flagged items and recipient evidence, ready + expected revision + zero resulting balance, collecting simulated retained cash in the same transaction. Retry returns the prior committed result. Failure leaves ledger/custody/order/history unchanged.
- I1/I2: one bag tag, separate records for flagged/high-value pieces only, text condition evidence is sufficient. UI must explain the limits for unflagged garments.

First overrun cuts remain photo upload, charts/CSV and cosmetic convenience. Money invariants, access tests, concurrency and retry tests stay. SMTP/SMS, webhooks/live payments, jobs, scheduling, portals and the real-shop appendix stay outside these slices. Their separate authorization has not been inferred.
