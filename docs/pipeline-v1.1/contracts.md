# v1.1 — domain contracts

Proposal, 23 October 2026. These rules are canonical; phases reference IDs. Money is integer VND; quantities decimal(8,2); timestamps UTC with Vietnam business-date calculations.

## Q — quote and settlement contract

**Q1.** Booking creates immutable **quote v0**, snapshotting service names/units/rates, estimated quantities, delivery fee, discount, policy version and consent timestamp. Checkout shows estimate and maximum weight-authorized amount. Its original submission creates a `checkout_consent` approval with verification state `declared`: sufficient for v0's disclosed scope, not proof of contact ownership. Without tolerance consent, any price increase needs a new quote. Missing legacy checkout evidence requires review.

**Q2.** Per original kg-priced line, `tolerance = max(estimated_kg × 0.10, 0.30 kg)`; boundary inclusive. Compare actual against original v0, not successive weighings or total order weight. Example: 2 kg allows 1.70–2.30; 5 kg allows 4.50–5.50. Quantities stay positive; discrete units stay whole.

**Q3.** Within tolerance, recalculate at snapshot rates without a new quote/reconfirmation. An immutable settlement records actual weight and references v0. Reductions and increases both apply. Counts, services, rates, fees and discounts stay unchanged; changing any of them or exceeding tolerance requires v1+ and explicit approval of its exact contents. Every kg line must pass separately. v0's weight maximum excludes storage, separately capped under U2.

**Q4.** Unique `(order_id, version)`; states `draft → issued → accepted/rejected/expired`; issued contents immutable. Issuing v1+ suspends processing eligibility under the previous quote. Acceptance binds ID + SHA-256 content hash. Accepting an obsolete version returns `409 QUOTE_SUPERSEDED`. After accepting v1+, different measured quantities require another version; there is no rolling tolerance.

**Q5.** Immutable versioned settlements materialize `Σ round(qty × rate) + delivery_fee + surcharge − discount + signed_charge_adjustments`; base quote amount cannot be negative. `orders.active_settlement_id` switches atomically with revision. Changes after work starts require a newly accepted quote before extra work; existing work retains its scope. Storage uses its original policy, not fabricated approval. Adjustment credits have admin reasons/evidence.

**Q6.** Reconfirmation for v1+ requires either: authenticated customer controlling the linked order; quote-bound SMS code; or customer-sent message matching the recorded contact, stating quote code + total, retained privately with original reference and admin verification. Store method, evidence hash/reference, actor, timestamp and verification state. Staff-only phone notes are `unverified`, visible in exception reports, and cannot authorize a new quote or unlock processing against it. Q1's original declared checkout consent is the distinct v0-only eligibility path. Mock evidence is `simulated`, valid only in synthetic demo/tests.

**Q7.** Codes: 6 digits, server-generated, hashed at rest, single-use, 10-minute expiry, maximum 5 guesses; at most 3 issues/phone/hour, replacing older challenges. Bind purpose/order/quote hash/destination. Staff cannot read plaintext. SMS labels it a **quote approval code**, distinct from account-login OTP. Digital approval demonstrates account/contact control, not legal non-repudiation.

**Q8.** Guest-to-account linking requires verified control of the recorded contact through a purpose-bound challenge or documented admin-reviewed customer request. A matching name, email string or phone string alone never establishes ownership. Profile contact edits do not reassign past orders.

## P — payments and handover

**P1.** Confirmed ledger entries are immutable: positive amount, `receipt/refund/reversal`, original-entry reference, order, VND, method, actor, effective time, external reference, idempotency key. Pending attempts are separate. Reversal cancels a referenced entry's effect once; refund means money actually returned. Check permission and remaining refundable balance under the order lock.

**P2.** `net_received = receipts − refunds + signed reversal effects`; `balance = active_settlement.total − net_received`. Positive is debt, negative is money to return. Derived payment states cannot be edited freely. Report cash flow by transaction time and fulfilled-order value by delivery time separately.

**P3. Atomic `deliver_and_collect`.** Inputs: order ID, expected revision, task ID, complete tag set, recipient evidence, cash actually retained, operation key; actor from session. One DB transaction locks order/task, checks permission/ready status, eligible quote/settlement, reconciled tags and no blocking issue; recomputes balance; appends positive cash receipt; requires zero resulting balance or pre-existing admin credit authorization covering the remaining positive debt; completes task/tags/order, timestamp/revision/history/audit; commits together. Refund-due orders require admin resolution first. Customer change is excluded from retained cash.

Failure rolls back everything. Same key/payload returns prior result; changed payload with same key returns 409. Cash is held by the courier until a separate remittance record reconciles it; remittance does not create another customer receipt. Offline UI shows pending sync, retries with the same key and only claims completion after server commit.

**P4.** Bank receipts require bank/provider evidence, not customer screenshots. Verify provider authentication, account/currency/reference/amount and deduplicate external IDs. Payment attempts have random references tied to settlement revision, one active per order. Preserve actual unmatched, partial, excess, late or cancelled-order transfers in reconciliation. Browser return URLs only read server state. Bank refunds may be performed by admin with bank evidence; automated refund API is not assumed.

## I — tagged items

**I1.** Each garment/object receives an immutable unique washable `tag_id`, order ID, service-line association, description, intake condition and optional photo. Shoe pairs have two child-piece labels; bedding sets have named child pieces. Kg billing groups garments, while custody tracks each object. Containers group tags but never replace them.

**I2.** Append-only events record intake, processing, QC, custody transfer, missing/found, retag and return with actor/time/evidence. Replacement tags reference old tags; tags never move across orders. Delivery compares expected active tags, including child pieces, to handed-over tags. Missing/swapped tags block delivery until admin records an incident remedy agreed with the customer and explicit waived-tag evidence.

## U — unclaimed orders: proposed commercial policy

**U1.** Record `ready_at` after QC. Clock starts at `ready_notice_at`: evidenced provider delivery or customer-originated acknowledgment retained by admin, not dispatch acceptance or a staff-only phone note. Reminders: initial, +3, +7 and +14 calendar days, sent during 08:00–18:00 Vietnam time. Unreached attempts create staff tasks; entering ready alone does not start fees.

**U2.** Seven days free after notice; **5,000 VND/order per completed 24 hours after day 7**, capped at **100,000 VND/order**. Exactly day 8 → 5,000; day 27 → 100,000. Only if policy/cap accepted at v0; otherwise zero. An open dispute pauses accrual; admin waiver adds a credit/reason. Unique `(order_id, business_day, charge_type)` prevents repeats. Real-shop daily DB job applies charges; demo computes against a frozen clock on admin action.

**U3.** Custody states: `awaiting_collection → overdue` at day 8, `review_required` at day 30, `disposition_review` at day 90. `dispute_hold` suspends fees/escalation until admin resolution. Record paused duration and exclude it from effective age; accrued amounts remain. Status stays ready while held. Contact/retry attempts are events.

**U4.** Day 90 creates an admin review, not forfeiture. Default: **hold and contact**. Disposal/donation needs itemized customer release or a locally reviewed lawful procedure, final-notice evidence and admin inventory. Without it, hold continues. Authorized disposal sets custody `disposed` and order `closed_unclaimed`, recording item events/method/date/evidence. Debt stays explicit until settled or credited/written off. Collection uses P3 and custody `returned`. This policy needs local review; 90 days is not asserted to transfer ownership.

## T — state-transition table

All mutations use expected revision, current DB authorization, operation key and atomic side effects. Staff/P and Staff/C mean active staff with a current processor/courier assignment defined in the permission matrix.

| From | To | Actor | Preconditions | Atomic side effects |
|---|---|---|---|---|
| New | pending | Guest/customer | Valid slot/services, Q1 consent | Order, v0/approval, reservation, history/key |
| pending | picked_up | Admin or Staff/C | Complete intake tags/evidence | Handover, item receipt events, history |
| picked_up | processing | Admin or Staff/P | Eligible quote/settlement; issues resolved | Work event, history |
| processing | ready | Admin or Staff/P | Every tag passes QC or approved remedy | QC events, ready time, notice task/history |
| ready | delivered | Admin or Staff/C | P3 and recipient/tag evidence | Receipt + task/tags + status/audit |
| pending | cancelled | Admin; customer via validated request | Reason | Slot release, zero-service settlement adjustment, refund task |
| picked_up | cancelled | Admin | Reason, return plan | Return task, settlement review, refund task/history |
| processing/ready | Same | Admin | Cancellation/rework request | Incident/request, work hold if needed |
| delivered | Same | Admin/customer request | Complaint/tag evidence | Incident, rework child order or refund process |
| ready | closed_unclaimed | Admin | U4 evidence | Disposal events, custody/history/debt reference |
| Any open | Same | Authorized actor | Valid quote/issue/custody action | Related versioned records and audit |

Cancellation before processing normally charges zero service work; delivery/return fees require disclosed policy or verified new agreement. Cancellation and refund completion are separate records. Customers submit requests; admin decisions execute transitions.
