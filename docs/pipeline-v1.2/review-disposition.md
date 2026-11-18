# v1.2 — review disposition

Portfolio is the only active plan. Approval covers Phase00 only. v1.1 baseline is preserved at e33b736 on the local review branch. [Real-shop appendix](appendix-real-shop.md) is inactive, outside every phase gate.

| Request | Resolution |
|---|---|
| Portfolio only | Root/contracts/schema/eleven phases have no shop-only tests or parallel track |
| Semantic audit | [Findings and winners](consistency-audit.md), original baseline, explicit request/mutation and core/extension boundaries |
| Bidirectional test coverage | Generated mapping, missing/unknown IDs fail document audit, planned tests not claimed run |
| Actual plan limits | [Verified table](infrastructure.md): 100 daily Hobby cron jobs, finite300s execution, no active scheduler, Free pause/quota/no managed backup entitlement |
| Restore feasibility | Manual logical restore possible, objects separate, excluded from demo |
| SePay | Timestamp/raw-body HMAC, API-key alternative, optional IP defense, versioned ID lookup, verified amount/account/reference, no direct currency field |
| SMS | Registration/carrier/cost findings, in-app/simulated adapter instead |
| Tags | Bag tag plus flagged/high-value records, loss of individual-garment proof stated |
| Minimal scope |00/01/02(core)/03/05/09/10, 8-12 days, optional phases not core dependencies |
| Phase00 | Actual reproduce/fix/lint/types/build + focused validation, branch commit, no push/SQL/config/dependencies |
| Checkboxes | Only real passing Phase00 evidence may be ticked, all future gates unchecked |

## Qualifications supported by evidence

1. A Free restore drill is technically possible via logical export/restore, automatic managed backup entitlement is different. Excluded for scope ([Supabase](https://supabase.com/docs/guides/platform/backups)).
2. Webhook/SMS hosting is not intrinsically forbidden by Free. Commercial terms and provider registration/cost are separate. Portfolio deliberately mocks them.
3. Existing Date.now is in an onSubmit handler, not observed render execution. React distinguishes events from render ([React purity](https://react.dev/reference/rules/components-and-hooks-must-be-pure)). Fix the event-validation boundary without claiming a reproduced hydration bug.
4. SePay signature includes timestamp and raw body, and currency cannot be directly verified from absent fields ([authentication](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc), [transaction fields](https://developer.sepay.vn/vi/sepay-api/v2/giao-dich/chi-tiet)).

No disagreement with the requested scope/audit/mock/tagging/minimal-demo/no-push boundaries. Actual command evidence is separate from future test plans.
