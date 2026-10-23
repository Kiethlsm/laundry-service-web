# Sạch Sạch — full-scope pipeline v1.1

**23 October 2026 · Proposal for review only. No implementation authorized.**

## Decision #1: portfolio piece or real shop?

- [ ] **Portfolio:** synthetic data, demonstrable domain correctness, non-commercial deployment.
- [ ] **Real shop:** real customers/money, operational ownership, paid hosting and provider dependencies.

This decision is still open. Confirmed current plans: **Vercel Hobby + Supabase Free** (owner confirmation, 23 October 2026). Configuration and successful MCP reads do not establish a production deployment or successful admin login.

## Two cut lines

| Deliverable | Portfolio cut | Real-shop cut |
|---|---|---|
| Core R1 | Versioned quotes including v0, tagged items, atomic handover/payment, immutable ledger, roles/RLS tests, CI | Same, plus real staff onboarding and operational prerequisites |
| R2 | Seeded customer accounts, ownership checks, quote approval and account demo; messages simulated | Customer accounts, SMS-first notifications and durable outbox |
| R3 | Local signed-webhook mock required; SePay Test Mode optional. Stop before live payments | SePay bank-transfer integration, reconciliation and controlled live verification |
| Operations | Functional/security tests and deployment smoke tests | Also load test, backups including objects, restore drill, alerts and runbooks |
| Explicitly omitted | Load tests, restore drills, runbooks, outbox, live notifications and live online payments | Real-shop gates require evidence |
| Hosting | Existing Hobby + Free; second Free project only if a slot is available, otherwise local test stack | Vercel Pro; Supabase Pro production + separate staging compute, external backup target, providers |

Portfolio completion means a portfolio release. Real-shop R1/R2 milestones are staging/internal acceptance; taking real orders waits for phases 09–10. One shop, Vietnamese UI, VND and UTC storage/`Asia/Ho_Chi_Minh` display apply to both tracks. Multi-branch SaaS, native apps, payroll, inventory, loyalty and electronic tax invoices are outside both cuts.

## Phase index and effort

Estimates are **person-days of focused engineering**, including tests/review, for one developer familiar with this repo; 5 days/week. Exclude provider approval, owner decisions and data cleanup waiting time. Allow another 20–30% calendar contingency. Each phase names its first overrun cut; correctness/security gates stay mandatory.

| Phase | Dependency | Portfolio days | Real-shop days | First overrun cut |
|---|---|---:|---:|---|
| [00 Baseline](docs/pipeline-v1.1/phase-00.md) | Decision #1 | 1–2 | 2–3 | Extra screenshots |
| [01 Foundation](docs/pipeline-v1.1/phase-01.md) | 00 | 3–5 | 5–8 | CI caching/convenience scripts |
| [02 Booking](docs/pipeline-v1.1/phase-02.md) | 01 | 2–4 | 4–6 | Address autocomplete |
| [03 Intake and quotes](docs/pipeline-v1.1/phase-03.md) | 02 | 4–6 | 6–9 | Camera scanning; keep printable/manual tags |
| [04 Staff and custody](docs/pipeline-v1.1/phase-04.md) | 03 | 2–3 | 4–6 | Route/calendar visualization |
| [05 Ledger and R1](docs/pipeline-v1.1/phase-05.md) | 04 | 3–5 | 5–8 | Charts and CSV, keep reconciliation |
| [06 Customer and R2](docs/pipeline-v1.1/phase-06.md) | 05 | 2–3 | 4–6 | Reorder and saved addresses |
| [07 Notifications](docs/pipeline-v1.1/phase-07.md) | 06; SMTP is earlier in 01 | Skipped | 4–6 | Zalo adapter and optional email receipts |
| [08 Payment integration](docs/pipeline-v1.1/phase-08.md) | 05; real launch also 07 | 1–2 | 5–8 | Card gateway |
| [09 Assurance](docs/pipeline-v1.1/phase-09.md) | Applicable 01–08 | 1–2 | 5–8 | Larger-than-baseline load experiment |
| [10 Release](docs/pipeline-v1.1/phase-10.md) | 09 | 1–2 | 2–4 | Marketing video |
| **Total** | | **20–34 (4–7 weeks)** | **46–72 (9–15 weeks)** | Rebaseline if mandatory work exceeds budget |

An overrun records the removed convenience feature or revises the estimate; it never silently deletes a mandatory deliverable.

## Shared artifacts

Each agent receives one phase file plus only its linked contract sections, not the entire plan.

- [Domain contracts](docs/pipeline-v1.1/contracts.md): quotes, tolerance, approval evidence, payments, atomic delivery, custody and transitions.
- [R1 schema and permission matrix](docs/pipeline-v1.1/schema-and-access.md): columns, constraints and one authorization model.
- [Infrastructure feasibility](docs/pipeline-v1.1/infrastructure.md): verified limits/costs, job mechanism, rate store, providers and release blockers.
- [Acceptance and retention](docs/pipeline-v1.1/acceptance.md): runner contract, severity, quantified targets and retention proposal.
- [Review disposition](docs/pipeline-v1.1/review-disposition.md): item-by-item response and qualified disagreements.

## Remaining owner decisions, in execution order

1. Choose the track above. No phase starts on an inferred answer.
2. For a shop, approve the hosting/backup budget, appoint an operator, and confirm separate staging, billing and provider access per the infrastructure dependency register.
3. Approve tolerance disclosure, storage policy and evidence rules in the domain contract; obtain the specified local legal/accounting review before real use.
4. Supply shop contacts, areas, hours, prices, SMS/SMTP sender access and a dedicated receiving bank account for the shop track.
5. Classify existing data as synthetic or real before migration. Preserve order IDs/history through a tested additive baseline rather than rerunning `schema.sql`.

Phase checkboxes become tickable only after the named gate passes and a report contains commit, track, environment, command, results and evidence. Skipped portfolio phases are **N/A**, not passed. Proposed runner/test paths do not exist yet; building them is phase work, not a claim of passing tests today.

`PIPELINE.md` remains the historical demo spec. After implementation is authorized, v1.1 governs the selected track and corresponding `PRODUCT.md`/README updates. Application code and database remain unchanged during this revision.
