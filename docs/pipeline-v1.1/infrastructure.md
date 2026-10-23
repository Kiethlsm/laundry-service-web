# v1.1 — infrastructure feasibility and dependencies

Checked against primary sources on **23 October 2026**. Actual subscriptions confirmed by owner: **Vercel Hobby + Supabase Free**. No upgrades, accounts, cron schedules or external integrations are created by this proposal. Prices exclude tax/FX/overages and must be checked again before purchase.

## Hosting and staging

| Service | Current documented limit | Plan decision |
|---|---|---|
| Vercel Hobby | Personal/non-commercial use only | Portfolio only. Real-shop use requires Pro before receiving real orders. [Hobby terms](https://vercel.com/docs/plans/hobby) |
| Vercel Pro | $20/month platform fee including one deploying seat; usage/additional seats can cost more | Proposed real-shop host, not a $20 hard cap. [Pro](https://vercel.com/docs/plans/pro-plan) |
| Supabase Free | 2 active-project limit; 500 MB DB, 1 GB objects, 5 GB egress; pauses after a week inactive | Can use a second project for synthetic staging if the account has a slot; otherwise local Supabase. Preview must not point to live data. [Pricing](https://supabase.com/pricing) |
| Supabase Pro | From $25/month, additional projects from $10/month; daily DB backups retained 7 days | Proposed production + staging baseline from $35/month. No assumption that branch environments or second compute are free. Same pricing source |
| Free backups | No automatic backups; CLI exports are recommended | A manual export/restore is technically possible, not a managed restore guarantee. Portfolio omits drills; shop requires the backup design below. [Backups](https://supabase.com/docs/guides/platform/backups) |

Real-shop base hosting proposal: **from $55/month** for one Vercel deployer and two small Supabase projects, before usage, messaging, storage and domain costs. This is a planning estimate, not the current bill. Stage 00 captures billing screenshots/quota availability; stage 01 proves selected features on staging. Account limits cannot be inferred from an MCP URL.

## Background jobs: choice and limit check

| Candidate | Capability/limit | Decision |
|---|---|---|
| Vercel Cron | Invokes finite Functions; Hobby minimum once/day with up to 59-minute scheduling offset; Pro can run every minute | Reject for prompt reminders on current Hobby. Avoid a second scheduler after upgrading. [Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) |
| Supabase `pg_cron` | DB SQL/functions or HTTP triggers; docs recommend ≤8 concurrent jobs and jobs ≤10 minutes | **Chosen scheduler**, SQL for due tasks/charges, `pg_net` for Edge invocation. [Cron](https://supabase.com/docs/guides/cron) |
| Supabase Edge Functions | Finite executions, not persistent workers; 256 MB memory, 2 CPU seconds/request, wall limit Free 150s / paid 400s | **Chosen I/O executor**, controlled batch ≤25 jobs, target wall budget 20s, stop/release before timeout. [Limits](https://supabase.com/docs/guides/functions/limits) |

Schedule one dispatcher every minute. SQL tick creates due staff reminder tasks, storage adjustments and cleanup work. R1 real shop only needs SQL tasks; phase 07 adds outbox dispatch and phase 08 reconciliation. HTTP calls use a dedicated rotating job secret held in Vault/Edge secrets; client requests cannot trigger privileged jobs. Scheduler/function setup follows [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).

Read-only MCP inspection on the actual Free project confirmed `pg_cron` 1.6.4 and `pg_net` 0.20.4 are **available but not installed** (`installed_version = null`). No extension was enabled. Phase 01 must install/test them on staging after authorization; availability is not proof of a running scheduler.

Use `FOR UPDATE SKIP LOCKED`, 2-minute leases, unique logical-event keys and five retry delays of 1, 5, 30, 120 and 360 minutes. After the initial attempt plus five failed retries, expose manual action. Reclaim expired leases; a dispatcher overlap must not double-post charges. Provider sends are at-least-once: use provider idempotency where supported, otherwise record `delivery_unknown` after an ambiguous response and reconcile rather than blindly resending. Do not promise exactly-once external delivery.

One tick/minute is about **43,200 Edge invocations in 30 days** if every tick invokes it. Free includes 500,000/month; Pro includes 2 million before overage, but CPU/DB/network usage still matters ([function quota](https://supabase.com/pricing)). Portfolio has no hosted job/outbox requirement; time-sensitive behavior uses test clocks/admin views. Enable extensions and verify tick/lease tests on the actual staging project in phase 01 before relying on them. Pause/inactivity makes Free unsuitable for a shop's operational jobs.

## Shared rate limiting

Use **Upstash Redis**, environment-prefixed keys, one atomic Lua counter/window operation per protected request. Portfolio: Free ($0, 500K commands/month, 256 MB). Shop: PAYG, **$0.20/100K commands**, plus applicable storage/bandwidth; 1 million commands would be $2 in command charges, not total infrastructure. [Published pricing](https://upstash.com/pricing/redis)

Both tracks need an owner-controlled Redis account before phase 02 integration; otherwise only isolated tests run against local Redis and shared hosted rate-limiting acceptance remains pending. This is a named zero-cost portfolio dependency, not an assumption that a store already exists.

Rules: booking 5/IP/10 min and 3/phone/30 min; lookup 20/IP/10 min and 5/code+phone/10 min; app login 10/IP/10 min; codes as Q7. HMAC identifiers to avoid raw phone/IP retention; 24-hour maximum counter TTL. Use platform-trusted client IP metadata, ignoring spoofable arbitrary forwarded headers. Separate staging/production namespaces and quotas. Redis failure returns 503 on public write/lookup/code paths; authenticated staff fulfillment remains available. These are application-abuse controls, not a DDoS guarantee. Budget alerts at $2/$5 and quota warnings need a named operator; alerting is not a guaranteed spending cap.

## Auth email and customer notification channels

**R1 real-shop dependency: custom SMTP using Resend**, verified sender/domain/DNS and monitored quota, configured in Supabase Auth during phase 01. Supabase's default SMTP sends only to authorized team addresses and is currently limited to 2 messages/hour; it is not an operational invitation service. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Resend offers SMTP relay and a Free limit of 100/day; paid plan/pricing is captured from checkout if that is insufficient ([Resend pricing](https://resend.com/pricing)). Staff invite/reset volume must stay within the selected tier; Auth quota is checked too. Portfolio seeds confirmed synthetic accounts through local/admin provisioning, displays their demo purpose and never calls an email-invite flow. Customer account email in phase 06 uses the same custom SMTP on the shop track.

**Customer operational channel: SMS to the booking phone first**, not email. This follows this product's phone-required/email-optional inputs; it is not a statistical claim about all Vietnamese users. R1 uses evidenced customer-sent messages and staff phone tasks; phase 07 automates SMS with eSMS. Account email remains for Auth and optional receipts. eSMS publishes indicative prices (450 VND/fixed-number message; 520 VND/Brandname advertising message), but these are **not a quote for transactional templates**; sender approval, Unicode segmentation, transactional price, VAT and minimum purchase are phase-07 entry blockers. [Provider prices](https://esms.vn/chinh-sach-gia)

Zalo phone-number templates are a later adapter if an approved business account/template is supplied. Current terminology is **ZBS Template Message**, incorporating former ZNS since January 2026; templates require approval. [Official change](https://zalo.solutions/news/thong-bao-hop-nhat-dinh-nghia-tin-uid-va-zns-thanh-zbs-template-message/cp1zx4bq8mzhhszgz0br1ocd). Choose SMS first to avoid requiring customers to have Zalo; keep a manual contact task when delivery is not evidenced. Never infer contact verification from a provider accepting a send request.

## Payments: comparison before phase 08

| Option | Small-shop fit and trade-off | Test/cost evidence |
|---|---|---|
| Static VietQR + manual bank check | Lowest integration effort for R1; QR contains payment instructions, not proof of receipt | No webhook inference; keep admin bank-evidence workflow |
| **SePay bank-transfer webhook/API** | Recommended R3: domestic transfer into a dedicated shop account, unique references, API reconciliation | Separate Test Mode; published Free 50 transactions/month, paid/overage depends on bank and chosen tier. [Pricing](https://sepay.vn/bang-gia.html), [Test Mode](https://docs.sepay.vn/test-mode.html) |
| payOS transfer checkout | Payment links, signed webhook, verified personal/business onboarding; alternative if owner already uses it | **No separate sandbox** per current docs; therefore not the default for a sandbox-first portfolio. No unverified free-fee assumption. [Test policy](https://payos.vn/docs/moi-truong-test/), [Webhook](https://payos.vn/docs/du-lieu-tra-ve/webhook/) |
| VNPAY/card gateway | Appropriate if card demand justifies merchant onboarding, settlement, refund and chargeback work | Merchant-specific quote/contract required; do not apply QR/POS promotional fees to web card checkout. [Provider overview/fees](https://vnpay.vn/vnpay-co-mat-phi-khong-0n1c8gu53a8) |

Choose SePay bank-data webhook + API reconciliation, **not its unrelated card/POS product**. Use HMAC-SHA256 on the raw body, unique environment/provider transaction ID and configured receiving account. Current docs describe signatures, duplicate events and retries ([Webhook](https://docs.sepay.vn/tich-hop-webhooks.html), [test authentication](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/tao-webhook)). Require HTTPS even in Test Mode. Exact HMAC canonicalization/header details come from that provider version's integration fixture during phase 08. API confirmation supplies defense against a forged/mismatched event; receipt idempotency remains DB-enforced.

At 50 orders/day, 1,500 receipts/month exceeds Free 50: before real launch obtain a bank-compatible tier/overage quote, credentials and approved budget. Live bank connectivity is tested separately from sandbox. Refunds remain bank-evidenced manual operations unless a supported disbursement contract is separately approved. Portfolio uses local signed fixtures or isolated Test Mode only; test money never enters a live report.

## Backup feasibility and recovery

Shop: daily Pro DB backups plus **encrypted logical DB exports and immutable-object manifests every 6 hours** to a private Backblaze B2 bucket, executed by a scheduled GitHub Actions job/manual rerun, not a Vercel worker. Scheduler delay is possible; an independent operator checks backup age daily and the job reports failure. Set RPO target 24h, RTO target 4h at the phase-09 test scale; they are tested targets, not an SLA. Age >24h triggers a release/operational incident and a manual backup.

DB backups do not contain Storage objects ([Supabase backups](https://supabase.com/docs/guides/platform/backups)). Use immutable object paths; export a DB snapshot plus referenced-object hash manifest, copy those objects, verify hashes, then mark the backup complete. Keep source objects long enough to finish the backup. Include Auth identities, policies, grants, role config and secret-reprovision instructions; validate restore against a disposable environment. Encrypt before leaving the runner; decryption key stored separately from bucket credentials.

B2 currently lists first 10 GB free and storage from $6.95/TB/month; egress/request terms apply ([B2 pricing](https://www.backblaze.com/cloud-storage/pricing)). GitHub Actions minutes and secrets permissions require account quota verification in phase 01; reserve a budget rather than assuming unlimited private-repo runs. Shop backup target/bucket, runner budget and restore destination are entry dependencies, not “free backups included.” Portfolio omits this mechanism and drills entirely.

## Dependency register: fail closed on unresolved entries

| Deadline | Owner input / evidence | If missing |
|---|---|---|
| Phase 00 | Track choice, actual Vercel domain, data classification | Planning only |
| Phase 01 shop | Pro budgets, separate staging, SMTP/domain verification, Redis, backup bucket/runner quota | Local design/tests only; no real-shop launch |
| Phase 03 shop | Approved tolerance/storage terms; customer-message evidence process | No increased-scope processing on verbal notes |
| Phase 06 shop | Customer Auth sender and redirect-domain check | Customer login release blocked |
| Phase 07 shop | SMS sender/template approval and transactional tariff/balance | Keep manual tasks; R2 automated-notification gate blocked |
| Phase 08 shop | Test account, bank-compatible live tier, webhook/API credentials, bank ownership proof | Mock/Test Mode only |
| Phase 09 shop | Retention/legal review, operator and restore evidence | Real use blocked |

All are explicit dependencies with an owner, deadline and fallback. Provider contracts and paid subscriptions cannot be resolved by documentation alone; their unresolved status is visible rather than deferred into a coding phase as an unspecified choice.
