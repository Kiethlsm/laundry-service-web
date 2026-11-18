# Sạch Sạch - portfolio pipeline v1.2

**Current direction:** [website for a two-owner family shop](docs/SMALL_SHOP_SCOPE.md), selected by the owner on 23 October 2026. The v1.2 portfolio plan below is historical and remains unchanged for its committed test evidence.

**Historical decision: portfolio only - Vercel Hobby + Supabase Free - 23 October 2026.**

Phase 00 is accepted, Phase 01 is authorized locally on a fresh branch from master. Later domain slices remain planned and hosted changes need separate approval. The parked booking-validation branch is excluded. See the [execution route](docs/pipeline-v1.2/minimal-demo-route.md). This index supersedes v1.1's parallel tracks, the [real-shop appendix](docs/pipeline-v1.2/appendix-real-shop.md) is inactive reference, outside every phase checklist.

## Minimal demo: 8-12 focused person-days

Show one synthetic order end to end: guest books v0 - assigned staff records a bag and weight - out-of-tolerance v1 gets explicit simulated approval - processing/QC - atomic deliver-and-collect - immutable receipt/refund history. Demonstrate customer A/B isolation, stale-role denial and CI checks. Existing pages are reused, no redesign, provider accounts or new infrastructure product is required.

Required phases: **00 - 01 - 02(core) - 03 - 05 - 09 - 10**. Phase 05 depends on 03, not optional 04. Customers A/B and staff are seeded test identities in 01, testing ownership does not require building the customer portal in 06. One processor/courier identity can have both assignments. Bag-level handover is part of 03/05, so it does not depend on the optional scheduling screen.

| Phase | Active portfolio purpose | Person-days | First overrun cut |
|---|---|---:|---|
| [00](docs/pipeline-v1.2/phase-00.md) | Reproduce/fix lint, lint, types, build | 0.5-1 | Extra screenshots |
| [01](docs/pipeline-v1.2/phase-01.md) | Core schema/roles/RLS fixtures, test runner and CI | 2-3 | CI cache/convenience scripts |
| [02](docs/pipeline-v1.2/phase-02.md) | Reuse booking, add v0 + retry safety | 0.5-1 | Catalogue editor/slot capacity extension |
| [03](docs/pipeline-v1.2/phase-03.md) | Bag intake, versioned quotes, settlement and processing | 2-3 | Photo upload UI, retain text condition evidence |
| [05](docs/pipeline-v1.2/phase-05.md) | Ledger and atomic handover, simple receipt | 1.5-2.5 | Charts/CSV |
| [09](docs/pipeline-v1.2/phase-09.md) | Functional/security regression | 0.5-1 | Optional-UI polish |
| [10](docs/pipeline-v1.2/phase-10.md) | Demo packaging and release evidence | 0.5 | Marketing video |

Sum **7.5-12**, rounded to **8-12 person-days (roughly 2-3 weeks)** for one developer familiar with the repo, including tests/review, excluding waiting for decisions/accounts. This is a narrower deliverable, not the former 20-34-day plan compressed by optimism. If mandatory work overruns, revise the estimate rather than dropping money/access tests.

## Optional portfolio extensions: separately authorized

| Phase | Extension | Person-days | First cut |
|---|---|---:|---|
| [04](docs/pipeline-v1.2/phase-04.md) | Staff task board + unclaimed-order simulation | 1-2 | Calendar view |
| [06](docs/pipeline-v1.2/phase-06.md) | Seeded customer portal/link-proof simulation | 1-2 | Reorder/address book |
| [07](docs/pipeline-v1.2/phase-07.md) | In-app notifications and simulated delivery | 0.5-1 | Simulated-channel cosmetics |
| [08](docs/pipeline-v1.2/phase-08.md) | Signed SePay-like webhook/API fixture demonstration | 1-2 | External Test Mode connection |

A catalogue/slot editor in 02 would add 1-2 days. Completing every extension would total approximately 12-21 days. Optional phases are **deferred**, not failed or passed, they are not dependencies of minimal-demo acceptance.

## Plan limits - conclusions for the actual subscriptions

- **Jobs:** Hobby allows **100 cron definitions/project**, each at most daily, with up to 59-minute timing variation. Cron invokes finite Functions, current Hobby Node/Python/Bun duration default/max is **300 seconds**. No core phase needs a scheduler. Optional 04/07/08 use explicit demo actions/injected clocks, not timed dispatch. [Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) - [Function limits](https://vercel.com/docs/functions/limitations)
- **Supabase Free:** **500 MB database, 1 GB Storage, 5 GB uncached + 5 GB cached egress**, at most two active Free projects, and pausing after a week of inactivity. Seed data/reset instructions and a visible paused/unavailable state are necessary. Staging can be local or the second available project, no paid branch assumed. [Pricing](https://supabase.com/pricing)
- **Backups:** no managed automatic backup entitlement on Free. A manual logical export/restore into a disposable local/Free target is possible, but Storage objects require a separate copy. Restore drills are excluded from this portfolio, not technically impossible. [Backup documentation](https://supabase.com/docs/guides/platform/backups)
- **Commercial use:** Hobby is personal/non-commercial. If this becomes a real shop, reassess hosting and activate a separately reviewed plan, a demo release does not authorize commercial operation. [Hobby terms](https://vercel.com/docs/plans/hobby)

Live SMS/SMTP invites, continuously reliable dispatch, unattended reconciliation, guaranteed uptime/recovery and live payments are outside the active plan. Some require providers/budget, rather than being prohibited by Free itself. Phase files label provider-dependent behaviors **MOCK ONLY**, no outbox, load tests, restore scripts or runbooks enter their checklists.

## Read only the context needed

[Contracts/transitions](docs/pipeline-v1.2/contracts.md) - [core/extension schema + permissions](docs/pipeline-v1.2/schema-and-access.md) - [plan/provider findings](docs/pipeline-v1.2/infrastructure.md) - [acceptance](docs/pipeline-v1.2/acceptance.md) - [cross-file audit + rule/test mapping](docs/pipeline-v1.2/consistency-audit.md) - [review disposition](docs/pipeline-v1.2/review-disposition.md).

Phase 01's local test paths are implemented, later phase paths remain planned. Only checks with actual output may be ticked, [Phase 00 evidence](docs/verification/phase-00/report.md) and [Phase 01 evidence](docs/verification/phase-01/REPORT.md) distinguish local results from unrun GitHub CI/browser checks. No hosted change, deployment or push is authorized by this local slice.
