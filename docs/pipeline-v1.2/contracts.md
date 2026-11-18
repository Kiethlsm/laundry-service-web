# v1.2 - active portfolio contracts

Synthetic data only. Core rules are B, A, Q1-Q6, Q8, P1-P3, I1-I2 and T. Q7, P4 and U are optional simulation rules. Each named rule maps to tests in [consistency-audit.md](consistency-audit.md), no shop-only rule is an active acceptance requirement.

## B - approved baseline

**B1.** Reproduce the current react-hooks/purity diagnostic before changing its call site, keep the rule enabled. The existing clock call is inside an onSubmit handler, so do not misreport it as observed render-time execution.
**B2.** After the narrow fix, lint, TypeScript no-emit and production build must exit zero, using existing dependencies/config.
**B3.** Future-pickup validation reads current time at submission, rejects invalid/equal/past timestamps, accepts future timestamps, and preserves the independent server check.

## A - access and operational integrity

**A1.** Active identity/role comes from profiles.id = authenticated Auth user ID, role is admin/staff/customer. Active processor/courier assignments scope staff resources. Customer ownership is orders.customer_id. Client-submitted role/actor/phone is not authorization. RLS and service-role entry points use the same fixed capability mapping.
**A2.** Admin manages all synthetic orders/roles/prices, verifies evidence and owns refunds/reversals. Courier scope permits intake and handover, processor scope permits measurement/quote/QC. Only admin issues post-processing amendments. Disablement/reassignment takes effect on next mutation, prevent removing the last active admin.
**A3.** Public lookup exposes minimal progress/amount only, private evidence/contact details require ownership/scope. Log no secrets/raw customer contact. Evidence images, if implemented, are <=2 MB and private, signed URLs expire after 5 minutes.
**A4.** Ordinary mutation keys bind request hash and order revision, identical retry returns its prior result, different payload returns 409, stale revision cannot overwrite. Persistent receipt/provider references retain dedupe beyond a 7-day response-cache TTL. Confirmed history is append-only, controlled synthetic reset is allowed only on an explicit demo/test allowlist.

## Q - quotes and actual settlement

**Q1.** Booking creates immutable issued-and-accepted v0, snapshotting service name/unit/rate, quantities, delivery fee, surcharge/discount, policy version and checkout consent. Checkout displays estimate and maximum weight-authorized amount. Approval method checkout_consent/state declared is valid for v0 scope only, it does not establish contact ownership. Legacy data lacking consent stays review-required.
**Q2.** For each original kg line, tolerance = max(10% * estimated kg, 0.30 kg), inclusive, compare with original v0, never cumulative adjustments or net order weight. Positive decimal quantities have <=2 decimals, discrete units are whole.
**Q3.** Within consented tolerance, settle actual weight at snapshot rates without reconfirmation. Outside it, or if count/service/rate/fee/discount changes, require v1+. Without tolerance consent, every actual-weight change requires an exact new quote. v1+ has exact quantities and no rolling tolerance.
**Q4.** Versions are unique per order, draft can edit, issued content is immutable. Issue supersedes previous processing eligibility, accept binds current ID/hash. Reject stale acceptance with 409 QUOTE_SUPERSEDED. A rejected/expired newer quote does not silently restore old approval, admin must issue an explicit replacement.
**Q5.** Database computes integer VND: sum(round(qty * rate)) + fee + surcharge - discount + signed charge adjustments. Base cannot be negative. Immutable settlements include the set of applied adjustment IDs, a new adjustment atomically creates a new settlement/pointer and increments order revision. Never mutate an old amount or count one charge twice. Extra work after processing needs admin-issued, accepted amendment before that extra work.
**Q6.** v1+ approval needs the linked authenticated customer or simulated customer-originated quote/hash/amount evidence verified by admin. Staff phone notes are unverified, shown in report and cannot unlock work. Simulated evidence is visibly labeled, simulator requires an authorized demo identity and synthetic-order flag. It is not proof of real-world consent.
**Q7. MOCK ONLY, optional 06/07.** Demo challenge: 6 digits, hash at rest, 10-minute expiry, five guesses, three issues/contact/hour, purpose/order/quote-bound, invalidate old codes, single-use. A separate authenticated demo-customer panel receives the simulated code, staff cannot retrieve plaintext. No SMS or login-code delivery claim.
**Q8.** Seeded ownership is explicit, matching a typed phone/email never links orders. Optional linking uses purpose-bound simulated proof plus authorized review. Contact edits do not transfer past ownership.

## P - ledger and atomic handover

**P1.** Immutable positive-VND receipts/refunds/reversals with actor/time/method/operation key and original-entry reference. Receipt contributes +amount, refund -amount, reversal contributes the negative of the referenced entry's signed effect. Admin correction reversals require a reason and reference only receipts/refunds, once each. Refund availability is recomputed from net unreversed receipts/refunds under the order lock, a legitimately reversed refund restores that amount's availability, while a reversed receipt does not fund another refund.
**P2.** Net received is the sum of signed entries, balance = active settlement total - net received. Positive is debt, negative refund due. No editable paid flag. Basic report distinguishes cash flow by transaction time, delivered value by handover time and unverified approvals. All amounts in this demo are simulated.
**P3.** deliver_and_collect locks ready order/active settlement/assignments, checks expected revision, bag/flagged-item reconciliation and recipient evidence, then appends simulated cash retained, sets bag custody returned and appends flagged-item return events, completes any enabled order_custody/delivery_task record, updates delivered/history/audit and commits together. Require resulting balance zero, minimal demo has no credit override. Refund-due blocks delivery until admin resolves it. Failure commits nothing, retry is A4. Optional 04/05 extension adds courier remittance, which never creates another customer receipt. Offline completion is not supported: show failure/pending retry, never delivered before server commit.
**P4. MOCK ONLY, optional 08.** Incoming-transfer fixture requires authenticated envelope, verified transaction lookup, exact incoming amount, approved VND account context, matching reference and stable transaction ID, dedupe receipt across repeated events. No currency field means no claim of direct webhook currency verification. Unknown/mismatched/partial/excess/late events remain reviewable. Browser redirect does not post money. Pin API ID version per [provider contract](infrastructure.md), no implicit numeric-to-UUID conversion.

## I - lighter portfolio intake

**I1.** One unique tag per bag. Record bag service group/count and intake condition, separately label high-value/flagged items with description/photo when supplied. Example: ordinary shirts stay a counted group, a damaged jacket gets its own record/tag. No automatic child labels for every shoe or garment.
**I2.** Append custody/condition/retag events, replacement points to prior label. Bag IDs and flagged-item IDs belong to one order permanently. Handover requires every expected bag and flagged item, minus explicitly admin-waived records backed by simulated customer remedy. Cannot prove which unflagged shirt was missing/swapped, the UI and README state that loss of evidence.

## U - optional unclaimed-order simulation

**U1. MOCK ONLY.** Admin demo action records simulated customer acknowledgment, ready clock uses that timestamp, not a staff-only call note. Show due reminders at +0/+3/+7/+14 days, 08:00-18:00 Vietnam time, no sends/jobs.
**U2. MOCK ONLY.** With v0 storage-policy consent: seven free effective days, then 5,000 simulated VND per completed 24h, capped 100,000/order, no consent means zero. Injected clock + explicit evaluate action adds unique day charges/settlement atomically. Fee-free dispute durations excluded.
**U3. MOCK ONLY.** awaiting_collection -> overdue at effective day 8 -> review_required at day 30 -> disposition_review at day 90, dispute_hold pauses age. Open disputes block ordinary delivery. Actual collection sets returned under P3.
**U4. MOCK ONLY.** Day 90 remains held, authorized admin can demonstrate a disposition only after simulated itemized release evidence, closing as closed_unclaimed with debt explicit. No real disposal advice or ownership-transfer claim.

## T - order transitions (fixed action names)

All transitions use A1/A2/A4, request creation is separate from execution.

| Rule | From -> to | Actor/action | Preconditions | Atomic side effects |
|---|---|---|---|---|
| T1 | new -> pending | guest/customer: book | valid inputs, Q1 | v0/consent/order/history/key |
| T2 | pending -> picked_up | admin or courier: intake | I1 bag record/condition evidence | custody receipt/history/revision |
| T3 | picked_up -> processing | admin or processor: start_work | current eligible quote/settlement, no blocking issue | history/revision |
| T4 | processing -> ready | admin or processor: qc | expected bags/flagged records QC or approved waiver | ready_at/custody/history |
| T5 | ready -> delivered | admin or courier: deliver_collect | P3 | ledger+returned custody+optional task+history |
| T6 | pending -> cancelled | admin: cancel | reason | zero-service settlement, refund-due if prepaid, history |
| T7 | picked_up -> cancelled | admin: cancel_after_intake | reason + return plan | blocked return case/refund-due/history, no fake refund |
| T8 | processing/ready/delivered -> same | admin, customer submits own request, assigned staff records incident while open | incident/amendment valid for actor | incident/request only, no backwards status change |
| U4 | ready -> closed_unclaimed | admin: simulate_disposition, optional 04 | simulated evidence | disposition/custody/history, balance explicit |

Anonymous guests can book/lookup only, later approval/link/cancellation is an authenticated or explicitly authorized simulator action. Optional slot cancellation releases capacity transactionally. Dates store UTC, display Asia/Ho_Chi_Minh. These are testable demo contracts, not functionality implemented by this revision.
