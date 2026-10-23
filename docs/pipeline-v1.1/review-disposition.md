# v1.1 — review disposition

23 October 2026. Documentation revision only. Every request in the review is mapped below; no application/SQL/CI implementation has started.

## Scope, effort and structure

| Review request | v1.1 response |
|---|---|
| Portfolio or shop first | Decision #1 at the top of the index, still awaiting owner's choice |
| Two cut lines | Separate required/omitted deliverables; portfolio retains correctness/CI, drops outbox/load/restore/runbooks/live money; shop keeps R1–R3 |
| Per-phase effort/drop order | Index and each phase give person-day range, dependency and first removable convenience feature; mandatory safety/domain checks remain |
| Smaller agent context | 11 phase files, short index and four focused shared design/feasibility/acceptance artifacts |
| Repeated prohibitions | Canonical numbered contracts; phase files refer to them. Ownership rule Q8 appears once as the policy, tests cite/verify it |
| Missing artifacts | Full transition matrix, quote/settlement/payment contracts, R1 column/constraint list and single permission matrix supplied now |
| Named executable acceptance | Each phase has setup/command/test IDs/expected result; missing/empty/skipped required tests fail runner. Future paths explicitly labeled planned |
| Phase-00 lint fix | Reproduce known diagnostic, apply narrow fix and run lint/typecheck/build in phase 00; no fix performed during this documentation-only task |

## Eight logic gaps

1. **Quote v0/tolerance — accepted with explicit authorization.** Initial estimate is immutable v0. Per-line ±max(10%, 0.3 kg), inclusive, tied to original weight; within range creates an actual settlement using snapshot rates, outside creates v1+. Checkout discloses a maximum. This prevents tolerance from becoming permission for undisclosed increases or accumulated drift. Discrete/service/fee changes always need a new exact quote.
2. **Deliver + collect — accepted.** P3 is one locked transaction: validate tags/evidence/balance, record actual cash, complete task/items/order/history. Courier remittance is separate and never double-counted as customer payment. Retry is idempotent; failure rolls back all writes.
3. **Unclaimed orders — accepted with lawful-disposition qualification.** Notice/contact starts the clock; reminders at 0/3/7/14 days; 7 free days, then 5,000/day capped 100,000 if originally agreed; dispute pauses age. Day 30 review, day 90 disposition review. Default hold; customer release or reviewed lawful process required for disposal, with `closed_unclaimed` rather than delivered/paid.
4. **Per-item custody — accepted.** Every garment/piece gets a tag, intake condition and chain of custody. Pairs/sets have child-piece IDs. Delivery checks the complete expected set; loss/swap incidents retain evidence and require a customer-agreed remedy.
5. **Auth email dependency — accepted.** Custom SMTP/verified Resend sender moves to real-shop R1/phase 01, tested with a non-team address. Portfolio provisions synthetic demo accounts and avoids actual invitation sending. Default Supabase SMTP's two/hour limit cannot support operations ([official SMTP docs](https://supabase.com/docs/guides/auth/auth-smtp)).
6. **Notification channel — changed to SMS first.** Booking requires a phone but not email, so SMS reaches this product's guest input population without requiring email/Zalo. R1 manual evidence/tasks; R2 eSMS and outbox. Email remains for Auth/optional receipts. Zalo is an optional approved-template adapter; current official name is ZBS Template Message ([official notice](https://zalo.solutions/news/thong-bao-hop-nhat-dinh-nghia-tin-uid-va-zns-thanh-zbs-template-message/cp1zx4bq8mzhhszgz0br1ocd)). No nationwide preference claim is made.
7. **Phone confirmation — accepted.** Staff phone note alone is unverified, reported as such and blocks increased-price approval. A customer-originated quote/amount message with matching contact and admin verification, account-controlled acceptance, or quote-bound code is required. Mock approvals are distinct from real evidence. This is traceability, not a claim of cryptographic non-repudiation for screenshots.
8. **Role sources — simplified.** `profiles` is identity role/active state, `order_assignments` is staff order scope, verified `customers.auth_user_id` is ownership, `credit_authorizations` is debt exception. Remove `staff_permissions`. One fixed action helper drives RLS and privileged server RPC checks; client role claims are not authoritative.

## Infrastructure review items

| Item | Concrete disposition |
|---|---|
| Persistent worker assumption | None; chosen `pg_cron` + SQL/`pg_net` + finite Edge batches, leases/retries and explicit ambiguity handling |
| Limits on actual plans | Owner confirmed Hobby + Free; document daily-only Hobby cron, Free invocation/runtime/storage/project/backup limits. Staging feature/quota tests precede reliance |
| Shared limiter | Upstash Redis, named atomic counter scheme, thresholds, $0 Free allowance or $0.20/100K PAYG commands, quota/alert/outage behavior |
| Free staging/backups/restore | Second Free project possible if a slot remains; local alternative. Automatic backups absent; manual export/restore possible but not managed. Portfolio drops drills; shop pays for staging/backup workflow |
| Hobby real-shop restriction | Pro required for commercial operation; proposed base hosting from $55/month including second Supabase compute, not an assumed free production stack |
| Payment comparison | Manual VietQR, SePay transfer/API, payOS, VNPAY/cards compared before designing 08. Choose SePay with isolated Test Mode, authenticated events and API verification |
| Concrete retention/legal | Durations per data class, holds/tombstones/restore erasure behavior; current Vietnamese law/decree linked, local applicability/retention review required, no compliance assertion |

## Qualifications / disagreements with literal interpretations

- **A weight tolerance alone is not sufficient authorization to charge more.** I kept the requested numerical rule but added checkout disclosure and a bounded consent record. This is a product-contract safeguard, not an asserted legal conclusion. Without it, the previous immutable quote/explicit approval promise would contradict the tolerance exception.
- **“Disposal rule” cannot mean automatic ownership transfer on day 90.** v1.1 specifies a review/action rule and evidence, with default hold. The Vietnamese legal applicability review is unresolved; this document has no evidence supporting an automatic-forfeiture right. No such right is claimed.
- **“Sandbox” cannot be provider-agnostic.** payOS explicitly says it has no separate sandbox ([test documentation](https://payos.vn/docs/moi-truong-test/)); SePay documents isolated Test Mode ([documentation](https://docs.sepay.vn/test-mode.html)). Portfolio therefore uses local mocks/SePay Test Mode, not a falsely labeled payOS sandbox.
- **Dropping operational exercises for portfolio does not remove financial/authorization tests.** This follows the requested cut. Shop restore/load/runbooks are required only on that track and are not a requirement for accepting a non-commercial synthetic demo.
- **The Phase-00 code fix is planned, not executed now.** The review explicitly says “Do not start implementing anything.” v1.1 schedules reproduce/fix/lint/typecheck/build as phase work; changing code during this revision would violate that boundary.

There is no disagreement with the requested scope split, atomic cash delivery, tagged custody, SMTP dependency, channel correction, evidence requirement, unified permissions or runnable gates. Paid provider approvals and legal review remain named owner dependencies with fail-closed release gates; writing a plan cannot truthfully mark those accounts/contracts obtained.
