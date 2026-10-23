# Phase 06 — customer self-service · v1.1

Read: [Q6–Q8/T](contracts.md), [access matrix](schema-and-access.md), [SMTP](infrastructure.md), [runner](acceptance.md). Effort: portfolio **2–3 days**, shop **4–6 days**. Drop first: reorder/saved-address UI. Entry: P05; shop customer Auth sender/redirect-domain verified.

## Work

- Shop: verified-email signup/login/reset through custom SMTP; guest booking remains phone-based and email optional. Portfolio: seeded confirmed synthetic customer A/B; no real email delivery.
- Implement verified order linking, own-order lists/details, exact quote approval, change/cancellation requests and complaints. An authorized request is not a direct arbitrary state mutation.
- Add saved addresses/reorder only if phase budget permits; reorder resolves current active services/prices/slots into a fresh v0.
- Recheck capabilities through the single source of truth on every mutation, including requests from an old tab/session.

## Gate P06_CUSTOMER

Command: `npm run test:gate -- P06`; artifacts `tests/acceptance/phase-06.test.ts`, `tests/e2e/phase-06.spec.ts`.

| Required ID | Setup/action | Expected result |
|---|---|---|
| `P06_CUSTOMER_ISOLATION` | Customer A changes URL/body IDs to B's order, quote, evidence and request | Direct DB and API reads/writes denied; no metadata leak |
| `P06_LINK_PROOF` | Guest order shares typed phone with A; try claim without challenge, then with valid purpose-bound proof | First denied; second links once; replay/other-purpose proof denied |
| `P06_CONTACT_CHANGE` | A edits profile phone/email after owning an order | No ownership changes on unrelated guest orders; past linkage remains explicit |
| `P06_APPROVE_STALE` | A opens v1, shop issues v2, A submits old acceptance | 409 and latest quote shown; no incorrect processing unlock |
| `P06_CHANGE_REQUEST` | Customer requests cancellation while processing | Request/incident created, no direct rollback to cancelled; admin decision audited |
| `P06_AUTH_MAIL` shop only | Non-team customer signup/reset from actual staging domain | Verified sender delivery ≤5 min, correct allowed redirect; generic response for unknown email; no default-SMTP reliance |

- [ ] Required IDs pass; self-service flow works with guest flow unchanged.

Handoff: R2 account capability; automated operational messages are gated separately in phase 07. SMS recipient control and account email verification are separate evidence types.
