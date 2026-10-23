# Portfolio minimal demo — local review guide

Historical local P10 snapshot. The later owner-authorized hosted rollout and Preview results are recorded in [rollout evidence](../verification/rollout/README.md); the local-only statements below describe the original phase completion.

No hosted changes, push, merge or deployment were performed. This branch requires its new migrations; current production and hosted must continue using their old code/schema. Last reported hosted baseline was 27 rows; that is historical evidence, not a fresh count from this run.

## Run safely

Use Node 24, existing npm dependencies (`npm ci`), Docker Desktop, and the existing labelled PostgreSQL 17.11 container `sachsach-hosted-defaults-tests` (label `purpose=sachsach-hosted-defaults-test`). The test roles `anon`, `authenticated`, `service_role` must already exist. Test fixtures reject other container identities. Browser tests require an installed Brave on Windows or Chrome/Chromium on Linux; they do not install a browser. The local demo itself opens in your normal browser.

```powershell
npm run demo:local
```

Open the loopback URL printed by the command. It starts Next with a local HTTP adapter and a uniquely named `ss_p01_*` database. No `.env.local` changes are needed; all Supabase connection variables are overridden for this child process. Do not run another Next dev/build concurrently in the same directory. Ctrl+C closes its own Next/adapter processes. Fixture databases are retained for evidence, not silently dropped; repeated runs consume local disk. Cleanup requires an explicitly reviewed exact database list.

This is **simulated Auth**, not an integration test of real Supabase Auth/PostgREST. Only the test adapter maps a fixed fixture session to the synthetic SQL admin. Application authorization still uses the server-verified session and database role checks. Never deploy the adapter, expose it outside loopback, or enter real customer data. No hosted credentials are used. The intentionally public local fixture login is `demo.admin@example.invalid` / `portfolio-demo-only`; it cannot sign into hosted.

## Manual browser checklist

Use name `ZZ TEST`, phone `0000000000`, and a synthetic address. Select tomorrow's pickup. Each run starts a fresh fixture database; use at most three bookings for the same phone/hour.

1. At `/dat-lich`, select 2.5 kg of giặt sấy and one pair of giặt giày. Check demo quote consent and weight-tolerance consent. Estimate is 142,500 VND; tolerated maximum is 150,000. Submit and retain the code. Simulate a lost response/retry without remounting: only one order/code should exist. A fresh mount intentionally starts a new booking key.
2. Visit `/admin` without a session: login is required. Incorrect fixture credentials stay denied. Log in with the local account above, select the new order. Existing legacy fixtures show review-required/read-only, not invented consent or payment.
3. Receive one bag with a unique readable tag/count/condition; optionally flag a jacket with a separate unique tag and its pre-existing condition. The current booking's normal garments remain grouped. No image upload is included.
4. Measure 2.7 kg: within the original ±max(10%, 0.3 kg) window, settlement becomes 147,500 without another approval. Measuring beyond the window must require a new quote. Issue v1 with 3 kg + one pair (155,000 VND); old quote remains visible. A phone note marked unverified must not unlock processing. Use the explicitly simulated customer-originated message action to approve v1, then save its exact measurements.
5. Start processing, check all bags/flagged items at QC, advance ready. Create a later amendment if desired: old approval/work/QC cannot authorize it; explicitly approve, process and QC the additional scope without reversing status.
6. Inspect **simulated payments**. There is no writable “paid” flag. A receipt changes derived net/balance. A refund/reversal needs a reason and valid original reference where applicable; previous rows remain immutable. A repeated operation key cannot duplicate money. If doing a simple cash-on-delivery demo, skip preliminary receipts.
7. Try delivery with missing items or wrong retained cash: no partial receipt/status change. Select every expected bag/flagged item and enter exact outstanding cash plus simulated recipient acknowledgment: one atomic action sets delivered and records cash/custody/history. A verified waiver has its own evidence and remains waived, never falsely returned.
8. On separate fresh orders, cancel pending with a reason; cancel after intake with a return plan. No fake refund is posted. After processing begins, a cancellation request records a case rather than moving status backwards. Report compares transaction-date cashflow with delivered-value dates.
9. At 390px and desktop width, inspect readable section headings, scrollable quote/ledger tables, keyboard labels/focus, validation errors, pending submission and retry. Reload after committed actions; inspect history and preserved quote/ledger versions.

Automated equivalents: `P02_BOOKING_UI` tests the real booking browser/retry; `P09_BROWSER_WORKFLOW` tests cookie/login/denied session and the complete admin action chain; `P10_DEMO_SMOKE` checks real local HTTP 201/200/409 and denied admin. Authorization covers **170/170** capability cells plus 20 null/unknown-action denials. State and financial invariants have separate SQL tests. The local adapter does not establish actual hosted gateway/Auth behavior.

## Included and excluded

Included: RLS/live-role/assignment checks, scoped projections, immutable v0 and versioned approvals, original per-line kg tolerance, bag intake + flagged items, issue/waiver/settlement evidence, immutable simulated receipt/refund/reversal ledger, derived payment status, atomic deliver-and-collect, optimistic revisions/idempotency, red/green tests and CI definition. GitHub CI was not run remotely.

Money, customer-message approval evidence and recipient acknowledgments are simulated. No SMS/Zalo/email sending, bank webhook, card checkout, provider verification, storage uploads, slot/editor extension, dispatch/remittance, unclaimed-goods simulation, cron implementation, load test or restore drill is included. Optional phases 04/06/07/08 remain unselected. No scheduled keep-alive was implemented; its existing plan item remains deferred.

One tag per bag and separate records for high-value/flagged items cannot establish which **unflagged** garment was lost or swapped. Ledger immutability protects normal application operations, not a database owner's deliberate schema changes. Booking dedupe rows expire after seven days but no automatic cleanup job is claimed; committed financial command retries also consult permanent audit/ledger uniqueness. The synthetic cap is 100 orders; this is a functional portfolio, not a real-shop operating system or compliance claim.

Vercel Hobby is **non-commercial**. Supabase Free can **pause** after inactivity and lacks the paid backup/restore features. Those limits are documented with primary sources in the [v1.2 infrastructure plan](../pipeline-v1.2/infrastructure.md). Do not present this local work as an always-available public demo. Hosted/production integration and a final human browser review remain pending.

## Verification

```powershell
npm run check:phase -- P10
npm test
```

The phase gate records complete lint, typecheck, cumulative test and production-build output under `docs/verification/continuous/P10`. Each required named ID must actually pass; absent/skipped IDs fail the gate. Node's native runner, existing TypeScript/React and installed browser are used without new dependencies. See [release manifest](release.json), [hosted apply plan](HOSTED-APPLY.md) and [deployment dependency](../DEPLOYMENT-DEPENDENCIES.md). No URL for this branch is publicly deployed.
