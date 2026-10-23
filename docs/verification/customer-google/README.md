# S01 — local Google customer-account slice

Scope: Google sign-in (basic identity scopes), protected account/order list, server-bound ownership on booking, guest booking preserved. Two-owner shop scope is in docs/SMALL_SHOP_SCOPE.md. SMS OTP stays deferred; no SMS provider or new dependency was added. No hosted SQL/Auth configuration, push, merge or deployment is performed in this slice.

## Named acceptance checks

| Test | Contract |
|---|---|
| S01_GOOGLE_START | Google only, fixed callback, basic scopes, accepted origin, no caller-controlled return URL |
| S01_GOOGLE_CALLBACK | Exchange code, verify user, provision by session identity; preserve admin role |
| S01_GOOGLE_DENIAL | Cancellation/expired code/unverified or disabled identity cannot provision; no raw provider error shown |
| S01_BOOKING_OWNER | Ignore submitted owner; bind verified customer's id; retain guest/admin booking behavior |
| S01_SESSION_BOUNDARY | Missing/corrupt Supabase session cookie returns 401 before writing; unrelated cookies do not block guests |
| S01_ORIGIN_POLICY | Production and this project's branch aliases; localhost only outside production |
| S01_PROFILE_PROVISION | Verified new identity becomes customer only; repeated login never promotes/demotes roles; ACL and fixed paths |
| S01_CUSTOMER_ISOLATION | Own orders only, no same-phone guest attachment, disabled/anon denied |
| S01_CUSTOMER_UI | Google/guest options, explicit empty state, safe errors and CI coverage |
| S01_CUSTOMER_BROWSER | Visible responsive login, protected account and canceled callback on local transport |

## Red evidence and findings

`red.txt`: first seven auth/DB tests failed before implementation. `ui-red.txt`: both UI/browser tests failed before those routes/components were implemented. `session-red.txt`: a later regression test reproduced silent guest creation for a corrupt/chunked Supabase cookie, 201 instead of required 401. `session-green.txt` records that targeted correction.

`first-green.txt` is an intermediate **5 passed / 2 failed** run, not a passing gate. It caught the redirect response construction and a test setup that rolled back profile creation before trying to disable it. The test now commits only its own local fixture profile before disabling; it keeps the denial assertion.

`browser-finding.txt`: the first browser assertion searched body.textContent, including Next's hidden serialized input query. User-facing error assertions now check body.innerText plus alert text; raw errors in actual OAuth callback URLs are separately rejected and stripped. This is not evidence that all request query strings are secret-safe: never place real secrets in a URL.

The first screenshot batch captured a hidden Suspense segment while the loading skeleton was still visible. The final browser test waits for checkVisibility, loaded fonts and paint frames before asserting/capturing 1440 and 390. One visual confirmation batch passed. The full gate started before this correction was interrupted locally and was not treated as a pass.

`regression-red.txt`: 49/50 passed; P10_SAFE_LABELS failed because the new migration was missing from the hosted-apply inventory. The inventory was updated instead of weakening the existing test. P10_ROLLBACK already passed with all six migration prefixes. The final cumulative gate additionally includes S01_SESSION_BOUNDARY.

## Commands and limits

Focused command: `npm run test:customer` (10 named checks after the session regression addition). Cumulative command: `npm run check:phase -- S01` (51 named checks including the existing 170/170 authorization matrix, hosted-defaults sensitivity control, quote/payment invariants, browser flows and six-prefix rollback preservation). Gate logs live under docs/verification/continuous/S01; only Exit 0 and passing TAP output count as acceptance evidence.

Final local result: **51 passed, 0 failed, 0 skipped**; lint, typecheck, production build and client-boundary scan each Exit 0. `green.txt` is the earlier 9/9 focused run before S01_SESSION_BOUNDARY was added; final acceptance is the 51-test cumulative log, which includes all ten customer checks. No separate ten-test focused rerun is claimed. Matrix output reports 170/170 plus 20 unknown/null denials. No real-provider/hosted acceptance is inferred from this result.

The new migration 202610232001_customer_accounts.sql creates two bounded RPCs with explicit revokes and fixed paths. It performs no existing-row backfill or reassignment. Real Google/Supabase consent, PKCE cookie exchange and refresh are **not verified** by fake Auth transport. See docs/CUSTOMER_GOOGLE_SETUP.md for the external configuration and real-provider acceptance required before rollout. No secrets or customer rows are in these logs; only synthetic local fixtures.

Signed-in booking still uses the existing demo booking contract. This slice does not turn the immutable demo ledger or simulated approvals into real payments/consent. New real-shop workflow is a later reviewed migration slice.
