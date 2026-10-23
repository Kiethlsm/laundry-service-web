# Phase 06 - optional seeded customer portal - v1.2

Deferred extension, 1-2 days. Entry P05; seeded ownership fixtures already exist in P01. Drop first: saved addresses/reorder. Read [Q4/Q7/Q8/A1/A3/T8](contracts.md).

**MOCK ONLY:** invitations/reset/contact proof. Existing confirmed demo accounts log in normally; no email sender, arbitrary public signup or real SMS required. Own-order approval and change requests remain authenticated. Demo customer-panel challenge is distinct from staff view.

Command planned if selected: npm run test:gate -- P06; acceptance and E2E phase-06 files.

| Test ID | Rules | Setup/action | Expected |
|---|---|---|---|
| P06_CUSTOMER_ISOLATION | A1,A3,Q8 | A changes IDs to B's orders/quotes/evidence | API/DB deny and no internal-note projection |
| P06_LINK_PROOF | Q7,Q8 | Typed-phone claim; valid/wrong-purpose/replayed simulated proof | No auto link; purpose-bound proof single-use under authorized demo action |
| P06_CONTACT_CHANGE | Q8 | A edits profile contact | Past and unrelated order ownership unchanged |
| P06_APPROVE_STALE | Q4 | UI v1 open, newer v2 issued | Stale acceptance409, new content shown |
| P06_CHANGE_REQUEST | T8 | Owned processing/delivered order complaint | Request only, no direct cancel/refund/status mutation |

- [ ] Gate remains deferred until all IDs pass; Auth delivery is not simulated into a real verified email claim.
