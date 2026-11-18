# Appendix - inactive real-shop path (not portfolio scope)

**Reference only. No phase checkbox, dependency, purchase or implementation authorization.**
The former full R1-R3 estimate was **46-72 person-days** (9-15 focused engineering weeks), excluding contracts/legal/provider waiting. It is not an alternative active track.

A separate scope review would be required to activate:

- Commercial hosting: Vercel Pro, Supabase Pro plus separate staging compute, verified bill/quota and operational owner. Hobby is non-commercial ([terms](https://vercel.com/docs/plans/hobby)), paid plan rates must be refreshed before a budget decision.
- R1: custom SMTP/verified sender for real staff invites and customer Auth, real contact evidence, per-item tagging if the counter can maintain it, scoped roles and AAL2 admin.
- R2: SMS/approved sender or Zalo business templates, transactional outbox, bounded retries/leases, delivery-evidence semantics and manual fallback.
- Background design: pg_cron schedules SQL tasks and pg_net invokes finite Edge batches. No persistent Vercel worker. Verify actual quota/extensions and classify at-least-once/unknown external sends. [Cron](https://supabase.com/docs/guides/cron), [Edge limits](https://supabase.com/docs/guides/functions/limits).
- R3: authorized live bank-transfer provider, dedicated account/denomination evidence, signed webhook plus matching API confirmation, reconciliation, refunds and operator controls, cards require their own merchant contract.
- Shared Redis rate limiting if DB-based demo controls are insufficient, with named cost/budget, no unlimited-free assumption.
- Encrypted DB + Storage-object backup manifests to independent storage, recovery environment, scheduled runner budget and deletion-journal replay. Pro DB backups alone do not contain object bytes ([backup limits](https://supabase.com/docs/guides/platform/backups)).
- Restore targets RPO <=24h/RTO <=4h on an agreed baseline, measured drill, not a guarantee. Load baseline formerly 50 orders/day, 10 staff, 10,000 historical orders, 10 requests/s for 15 minutes, validate capacity on actual purchased compute.
- Runbooks, alert recipient and operator handover for money discrepancies, missing items, failed jobs, backups, restore and rollback.
- Reviewed unclaimed-goods policy: evidenced notice, seven free days, proposed 5,000 VND/day capped 100,000 only under accepted terms, day 90 is admin review, never automatic forfeiture.

## Retention proposal requiring independent review

Proposed durations, not statutory conclusions: contact snapshots 12 months after closure, inactive accounts 24 months with 30-day notice, images/messages 90 days after closure or 180 days after dispute resolution, redacted operational logs 14 days where plan supports it, audit/approval/item metadata 12 months, minimum financial ledger/settlement records 10 years subject to accountant/legal confirmation, raw webhook payloads 30 days, response idempotency cache 7 days with permanent transaction dedupe, code metadata 24h with code expiry 10 min, encrypted backups rolling 30 days.

Legal holds suspend expiry with a review every 90 days. Operational append-only records need a distinct privileged privacy/retention process: erase identifying links without rewriting money and replay erasure tombstones before restored data are accessible. This needs explicit schema/permission additions beyond the active synthetic demo.

Vietnamese applicability review must consider current amendments to [Law 91/2025/QH15](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=) and [Decree 356/2025/ND-CP](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf), notices/legal bases, customer rights, cross-border hosting/backups and accounting categories. No compliance claim is made.

This appendix records deferred considerations, it contains no executable release checklist and cannot be marked complete by passing a portfolio test.
