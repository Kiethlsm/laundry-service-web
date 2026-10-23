# v1.2 - actual plan limits and provider findings

Checked primary documentation 23 October 2026. Owner confirmed Hobby + Free and selected portfolio. Findings do not create accounts, install extensions or change config.

## Plan limits and selected mechanism

| Topic | Published fact | Active plan conclusion |
|---|---|---|
| Hobby cron | 100 jobs/project; each at most once/day, +/-59-minute scheduling precision | No phase depends on it. Optional 04/07/08 use explicit demo evaluation, not timed work. [Cron docs](https://vercel.com/docs/cron-jobs/usage-and-pricing) |
| Cron duration | Cron calls ordinary Functions. Current Node/Bun/Python Hobby default and maximum 300 seconds | Finite requests, not a persistent worker; no configured maxDuration change now. Legacy non-Fluid configurations require their own duration check. [Function limits](https://vercel.com/docs/functions/limitations) |
| Function uploads | Request/response payload limit 4.5 MB | Optional evidence capped at 2 MB; larger future uploads need signed direct-Storage flow, not a 5 MB server upload. Same function source |
| Free DB/Storage/egress | 500 MB DB, 1 GB objects, 5 GB uncached + 5 GB cached egress; up to 2 active Free projects | Keep synthetic dataset small. Local staging/test stack preferred; second project only if slot available. [Supabase pricing](https://supabase.com/pricing) |
| Free pausing | Project pauses after one week inactive | Demo may need manual resume; show unavailable state. No ping-to-evade-pausing job. Same pricing source |
| Free backups | No automatic managed backup entitlement; logical CLI exports possible | Manual restore drill is technically possible to local/disposable project with copied objects, but omitted from portfolio. [Backups](https://supabase.com/docs/guides/platform/backups) |
| Hobby terms | Personal/non-commercial only | Demo portfolio permitted by the stated use category; future real-shop service needs a fresh commercial-hosting review. [Hobby](https://vercel.com/docs/plans/hobby) |

No core phase needs jobs. Optional 04 derives due actions/fees with an injected clock and authenticated evaluate action; 07 simulates notification on demand; 08 reconciles mock events on explicit retry. There is no scheduler, outbox or lease dependency in the active architecture.

pg_cron/pg_net were available but uninstalled at previous read-only inspection. They are not enabled or relied upon. The old minute-dispatch design is moved into the inactive appendix. Scheduled automation is possible in principle on Free with finite Edge invocations, but pausing/quota/delivery semantics still prevent a continuous-service guarantee.

## Infeasible versus deliberately simulated

| Feature | Disposition in active phase |
|---|---|
| Minute-interval Vercel Hobby cron | Infeasible on Hobby; no phase needs it |
| Always-on reliable dispatch/reconciliation on an inactive Free project | Not a supportable guarantee; 04/07/08 MOCK ONLY on-demand simulation |
| Managed automatic backups/managed restore entitlement | Not included; no restore phase |
| Real SMS and SMTP invitations without approved sender/provider | No configured provider; 01/06 seeded accounts, 07 MOCK ONLY |
| Live payments | Deliberately excluded, not a claim that all Free-hosted webhook endpoints are technically impossible; 08 MOCK ONLY |
| Per-garment scanner/child-piece system | Cut for effort, not plan limitation; 03 bag + flagged-item records |
| Real shop on Hobby | Outside permitted non-commercial use; appendix only |

## Shared request limiting: no third product required

Portfolio reduces the former Redis requirement: phase 02 may add a service-only Postgres fixed-window RPC/table on the existing Supabase database, using atomic increment, HMAC identifiers and UTC window start. Proposed budgets: booking 5/IP/10 min and 3/demo-phone/30 min; lookup 20/IP/10 min and 5/code+phone/10 min. Expired rows are pruned in bounded batches during requests/admin maintenance, not cron. This costs existing DB compute/storage/egress, no separate store subscription. It is a small-demo control, not DDoS protection. DB unavailability returns 503. Future commercial Redis options are appendix material, not an account blocker for the demo.

## SePay: exact compatibility contract for fixtures

This is a verified provider research artifact. Phase 08 uses local fixtures and a fake transaction-lookup adapter; no live credentials or transfers. Optional SePay Test Mode is separately selectable, never a minimal-release dependency.

- API-key mode sends **Authorization: Apikey <key>**. Signed mode sends **X-SePay-Signature: sha256=<hex>** and **X-SePay-Timestamp**. HMAC-SHA256 input is **timestamp + "." + original raw body bytes**; constant-time comparison, reject timestamp skew over 300 seconds. Choose signed mode; an optional current source-IP allowlist is defense in depth, not identity proof or a replacement for the signature. [Authentication](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc), [payload/IP list](https://docs.sepay.vn/tich-hop-webhooks.html)
- Shown bank payload has numeric id, transferAmount, transferType, accountNumber, referenceCode and code/content, **no currency field**. API v2's shown transaction detail also lacks currency; querying it does not magically establish denomination. [Webhook fields](https://docs.sepay.vn/tich-hop-webhooks.html), [v2 detail](https://developer.sepay.vn/vi/sepay-api/v2/giao-dich/chi-tiet)

| Required check | How the real mechanism meets it / compensating control |
|---|---|
| Authenticity | Timestamp-bound raw-body HMAC above; never No_Auth. API key is alternative shared-secret mode, not payload signing. |
| Amount/direction | Re-query transaction with separate Bearer API credential; compare incoming amount exactly to expected integer VND; positive/incoming only. Partial/excess goes to review, not automatic paid. |
| Currency | Cannot directly verify from the shown webhook/API fields. Accept only a pinned, independently bank-confirmed VND receiving account, retained as server config/evidence. If denomination cannot be established, block automatic posting; never default missing currency to VND. |
| Transaction ID | Numeric bank webhook and v2 UUID are different ID schemes. Numeric payload uses matching documented v1 detail lookup /userapi/transactions/details/{id}; UUID adapter uses /v2/transactions/{uuid}. Do not guess-cast IDs. If using both, retain a verified alias joined by account + bank reference and confirmed API evidence. |
| Order/reference | Require configured receiving account and unique current order-attempt reference in code/content; wrong/unknown references remain unmatched. |
| Dedupe | DB uniqueness on environment/provider/canonical transaction ID; retain webhook-event ID and verified ID aliases. Retries/aliases cannot create another receipt; same ID with altered payload is quarantined. |

The v1-v2 ID/endpoint distinction is explicit in [SePay migration docs](https://developer.sepay.vn/vi/sepay-api/v2/nang-cap-tu-v1). Use that detail or matching authenticated lookup; unknown mapping means review, not money posting. Raw numeric amounts require strict decimal parsing (no fractional VND or float rounding). Queueing/API retry is replaced with a manual mock retry in the portfolio.

[SePay Test Mode](https://docs.sepay.vn/test-mode.html) isolates fake transactions. It does not prove a real receiving account's currency or bank connectivity. Separate sandbox/production account config and key namespaces would be mandatory for an actual integration.

## SMS: actual Vietnamese sender dependency

Brandname sending is a provider/carrier onboarding process: route classification (transactional vs advertising), business/brand evidence, sender declaration and carrier approval; requirements vary by route/provider. eSMS's e-commerce customer-care dossier lists business registration, representative ID, carrier Brandname declaration and brand/website evidence. This is evidence of a real onboarding dependency, not proof that every personal fixed-number route has identical requirements. [Provider dossier](https://helpcenter.esms.vn/thong-tin-dich-vu/tra-cuu-thong-tin-ho-so/tin-nhan-thuong-hieu-sms-brandname/quy-dinh-nhom-dang-ky-sms/cham-soc-khach-hang/thuong-mai-dien-t)

Published indicative advertising prices are 520 VND/Brandname SMS and 450 VND/fixed-number SMS; these are not an approved transactional tariff. Get route, carrier, Unicode/segment billing, tax, minimum spend and sender approval in a real contract. [Prices](https://esms.vn/chinh-sach-gia)

Portfolio therefore uses **in-app + simulated adapter**, not SMS-first delivery. Customer-panel challenge receipt is separate from staff view; simulated approval does not become phone verification. Supabase default SMTP is limited to authorized team addresses and currently two messages/hour; seeded confirmed demo accounts avoid inviting strangers or depending on mail delivery. [Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
