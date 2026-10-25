# Shop workflow clarity · 2026-10-25

Branch: `feat/shop-workflow-clarity`, from master184003d. This is the UI/read-projection follow-through to the full-site audit. Existing SQL, financial environments, stored prices, authorization, quote tolerances, revisions and idempotency contracts are preserved.

## Audit disposition

| Finding | Result in this slice |
|---|---|
| F01 current vs estimated cost/weight | Read current immutable settlement items with the authenticated client, scoped by both order and settlement ID; reject missing/incomplete rows. Render current total separately from quote estimate. Saving unchanged2.7kg keeps147500 rather than resetting to2.5kg/142500. |
| F02 simulated ledger | Remains explicitly simulated. The existing dispatcher requires synthetic orders and the payment table accepts demo/mock environments only. Real manual cash/bank receipt accounting needs a separate backend migration and evidence/rollout slice. No cosmetic relabel or bank-verification claim is made here. |
| F03 customer account | Ruled responsive order records with visible amounts and detail actions; authenticated own-order detail at /tai-khoan/don/[id], current quantities/cost, progress and shop contact. |
| F04 booking |14px rates/category labels,44px category controls, mobile review shortcut with footer/focus clearance, QR disclosure before booking, clearer consent wording with unchanged meaning. |
| F05 handover priority | Handover before accounting history, collapsed history by default; next-step shortcut scrolls/focuses the actual handover region. |
| F06 internal language | Vietnamese presentation labels for quote/issue/settlement codes; visible bag terminology made consistent. Existing form action names remain compatible. |
| F07 one-bag intake |1–20 distinct indexed bags in one atomic receive; per-bag removal before saving and optional flagged-item fields. Existing DB command already accepts arrays. |
| F08 Escape focus | Closing the mobile menu with Escape restores focus to its toggle. |
| F09 tracking | Distinct invalid/not-found/rate-limit/connection recovery, no raw parser/provider message; five-stage progress and real shop contact. |
| F10 typography consistency | Scoped shared shop-operations.css raises consequential reading text without changing decorative washer controls or replacing the accepted brand. |

## Security and data ownership

No service-role query is introduced for customer detail. requireCustomer establishes a live customer session. The loader first reads the order using authenticated RLS and verifies customer_id against that trusted user ID; only then does it call existing detail RPCs. The return value is an explicit customer-facing projection, excluding damage/intake notes, custody events, staff identities, internal reasons, hashes and ledger records. Current status/amount come from the same detail snapshot as the immutable settlement reference, not an earlier owner-check row. No auto-linking guest orders by phone.

Admin settlement reads filter order_id and settlement_id and verify expected item coverage. Missing rows produce a recoverable error rather than falling back to an old estimate. No existing immutable quote/settlement is edited by these reads. The round-trip test creates a new valid settlement through the normal local command, confirming that the visible default does not reset actual quantities.

## Test-first evidence

- `red.txt`: four new browser tests failed before product changes (0/4).
- `projection-red.txt`: both new read/projection unit tests failed before those modules existed (0/2).
- `snapshot-red.txt`: the stale owner-check amount test failed before using the authoritative detail snapshot.
- `footer-red.txt`: a new fixed-bar regression was reproduced: footer link bottom981.8px, bar top922.8px. Scoped footer clearance/scroll spacing fixes it.
- `green.txt`: `npm run test:shop`,6/6 pass,0 skipped.
- `gate-red.txt`: first cumulative run68/69; the old intake test selected the newly added secondary button instead of submit. Its selector now explicitly names button[type=submit], retaining the same consequence/button-text assertion.

Harness readiness is explicit: visible rendered controls after streamed content and resize, then computed metrics; the mobile menu is opened and observed visible before focusing its link. Initial mid-build checks exposed a hidden control/zero geometry, an uppercase message match and an attempt to focus an unopened menu; those were harness assumptions, not relaxed product checks. No arbitrary delays replace the server-revision barrier.

The cumulative S01 manifest and GitHub CI now include all6 new named tests in addition to the previous63. Full lint/typecheck/test/build/client-scan outputs are under ../continuous/S01/. The authorization matrix and hosted-defaults tests remain mandatory.

Final local command: `npm run check:phase -- S01` passed lint, typecheck,69/69 tests (0 skipped), production build and client-asset scan, all exit0. Authorization coverage remains170/170 matrix cells plus20 null/unknown-role denials. No migrations were added or applied; the existing hosted-defaults and six-prefix rollback checks pass unchanged.

## Bounded review

One initial desktop/mobile batch covered measured amount, bag receipt, customer records/detail, booking and handover. The correction batch fixed nested amount hierarchy and confirmed the independently identified footer-bar obstruction with a failing test, then fixed its clearance. Final visual confirmation checked desktop amount/detail and mobile bags/booking. A read-only independent final review accepted the ownership/projection and workflow changes. No further decorative iteration is planned.

The mechanical detector ran once over changed surfaces:10 advisory font-ramp findings, no blocking findings. These are the intentional operational reading sizes documented in DESIGN.md. No generated illustration or dependency was needed. All screenshots contain local synthetic rows only.

## Release boundary and manual checks

No SQL or migrations, hosted writes, environment/config changes, dependencies or paid services in this slice. The original parked booking branch remains untouched. Live Preview/production smoke checks are read-only and cannot claim a fresh Google sign-in or authenticated hosted order mutation.

After deployment, the owner can manually check:

1. Open a measured order: actual quantity and current amount agree; original estimate is separate.
2. Receive a new order with two bags in one confirmation; check both physical labels.
3. Open a ready order and use the next-step button: focus lands on handover; history stays collapsed.
4. On a phone, choose services, open the cart shortcut and inspect the final footer link above the bar.
5. Sign in with Google, open an owned order from the account list and compare quantities/cost to admin. Confirm an unrelated order is not displayed.
6. Try a wrong lookup pair and a keyboard Escape from the mobile menu.

F02 is a material remaining product limitation, not a passing test claim: do not call the ledger live accounting or enable real-money workflows by removing labels. A later backend slice must preserve immutable entries, ownership/evidence checks, real-vs-synthetic separation, transactional migration/rollback and the hosted preflight/approval safeguards.
