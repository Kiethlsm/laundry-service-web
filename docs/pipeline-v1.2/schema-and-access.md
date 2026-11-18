# v1.2 - portfolio schema and permission artifact

Design only. No SQL/migration is executed by this review. Preserve existing IDs/types: existing serial integer service/item/history IDs stay integers, new business records may use UUIDs. Common created_at and actor FKs are required. Existing profiles.id remains the Auth UUID, there is no second profile-ID mapping in the active demo.

## Core tables: phases 01-05

| Table | Columns added/retained | Constraints/source |
|---|---|---|
| profiles | existing id-auth.users, role admin/staff/customer, full_name, is_active | A1/A2, privileged fields server/admin-only |
| service_categories/services | existing integer IDs, names/unit/price/is_active | Q1/Q2, snapshot quoted data, archive instead of deleting references |
| orders | existing code/id/status/customer_id-profiles, revision, active_quote_id, active_settlement_id, legacy_review_required, is_synthetic, ready_at, delivered_at | Q4/Q5/T, active pointers refer to same order, synthetic creation mandatory for new demo feature flows |
| order_items | existing integer ID/service/quantity/unit_price + snapshot_name/unit | Q1, existing quantity becomes booking estimate |
| order_quotes | id, order_id, version, state, content_hash, fee/surcharge/discount, base_total, max_weight_total, policy_version, tolerance_consent | Q1-Q4, UQ order/version, issued contents immutable, state separate |
| order_quote_items | id, quote_id, order_item_id, snapshot_name/unit/rate, quantity, tolerance_kg | Q2/Q3, positive decimal, discrete whole |
| quote_approvals | id, quote_id/hash, method, verification_state, evidence_id, actor_id nullable, approved_at | Q6, declared v0 only, authenticated or simulated verified v1+, unverified note not eligible |
| order_settlements | id, order_id, version, quote_id/hash, total, actor_id, reason | Q5, UQ order/version, immutable |
| settlement_items | settlement_id, order_item_id, actual_qty, rate, line_total | Q5, same order, per-line integer rounding |
| settlement_charges | settlement_id, charge_id | Q5, PK pair, each charge applied once per settlement |
| order_charges | id, order_id, type, signed_amount, evidence_id, actor_id, optional business_day/policy_version | Q5, append-only adjustments, optional U2 adds unique order/day/type |
| order_assignments | id, order_id, staff_id, kind processor/courier, assigned_by, ended_at | A1/A2, one active order/staff/kind |
| laundry_bags | id, order_id, tag_id, service_group, item_count, intake_condition, custody_state | I1/I2, unique tag, immutable order ownership |
| flagged_items | id, bag_id/order_id, tag_id, description, condition, evidence_id nullable | I1/I2, unique tag, same-order bag |
| custody_events | id, order_id, bag_id or flagged_item_id, kind, actor_id, evidence_id, replaced_tag_id nullable | I2, exactly one target, append-only |
| custody_waivers | id, order_id, target bag/item, issue_id, evidence_id, approved_by | I2, explicit record, admin only |
| payment_transactions | id, order_id, kind, amount, currency VND, method, original_id nullable, environment demo/mock, provider/external_id nullable, actor_id, effective_at, operation_key, correction_reason nullable | P1/P2/A4, immutable, UQ order/key and environment/provider/external_id, refund/reversal balance constraints |
| order_issues | id, order_id, target nullable, type, blocking, state, remedy/evidence_id | I2/T8, resolved remedy before waived handover |
| order_requests | id, order_id, type, requester_id, payload, decision_by/reason | T8, requester ownership, no direct transition |
| order_status_history | existing integer ID/status/actor/time + reason/operation_key | T, append-only |
| evidence | id, order_id, kind, text/or private_object_path, sha256, verification_state, recorded_by | A3/Q6, field-level projection hides internal material |
| audit_events | id, actor_id, action, resource_type/id, operation_key, redacted_change, occurred_at | A3/A4, append-only ordinary operations |
| idempotency_keys | scope/key, request_hash, order_revision, result_ref, expires_at | A4, PK scope/key, expiration does not erase permanent receipt dedupe |
| demo_rate_windows | namespace, key_hmac, window_start, count, expires_at | A3/A4, PK namespace/key/window, service-only atomic increment, bounded request-time pruning |

Bag/flagged evidence may be text only in the minimal demo. Image handling is optional, capped 2 MB, MIME/content-validated and private, no 5 MB upload through a Vercel Function.

## Optional extension tables (not minimal dependencies)

| Phase | Tables/columns | Rule |
|---|---|---|
| 02 extension | shop_settings, service_areas, pickup_slots(id/start/end/capacity/reserved_count), orders.slot_id | A4/T1/T6, separate scoped slot-race tests |
| 04 | delivery_tasks(id/order/assignee/state/revision), delivery_attempts, order_custody(order/state/notice_at/paused_duration), staff_tasks(order/kind/due/state), storage-policy fields/index on order_charges, closed_unclaimed enum value | P3/U1-U4, task assignee and courier assignment change together |
| 05 extension after 04 | cash_remittances and receipt allocations | P3, remit cash once without second receipt |
| 06 | demo_challenges(id/order/purpose/hash/expiry/attempts/consumed_at/destination_hmac), saved_addresses if kept | Q7/Q8, no sending provider |
| 07 | demo_notifications(id/order/owner/channel/payload_ref/state/due_at) | Q7/U1, on-demand in-app/simulated only, no outbox/leases |
| 08 | payment_attempts(order/settlement/ref/expected_VND/expiry/environment/state), webhook_events(environment/provider/external_id/payload_hash/verified/result) | P4, mock only, durable key aliases if API IDs differ |

## Single access matrix

Source: A1/A2, fixed DB helper can_order_action(auth_user_id, order_id, action). RLS derives auth.uid(), service-only RPC actor comes from verified server session and is checked against the same mapping. An anon client cannot execute the service-only path. Role/status is read from DB each mutation, not JWT metadata.

| Action | Guest | Customer | Staff | Admin |
|---|---|---|---|---|
| book/minimal lookup | valid public request | valid public request | valid public request | valid public request |
| read full order | no | orders.customer_id=self | active assignment, least fields | yes |
| intake | no | no | courier assignment | yes |
| measure/issue before processing/start_work/qc | no | no | processor assignment | yes |
| issue amendment after processing | no | no | no | yes |
| accept v1+ | no direct anonymous write | owned order, current hash | no self-approval, record unverified note only | verify authorized simulated customer evidence |
| deliver_collect | no | no | courier assignment | yes |
| create incident while open | no | owned request | assigned incident | yes |
| request complaint after delivery | no | owned request | no ended operational scope | yes |
| cancel/return plan/refund/reverse/waive/simulate_disposition | no | request only | no | yes |
| manage services/staff/export | no | no | no | yes, last-admin invariant |
| demo simulator action | no | own customer-panel code/acceptance only | no spoofed evidence | synthetic order + explicit simulator capability |

Customers receive a customer-safe evidence projection, not every internal note/photo a staff member can read. Disabling accounts and ending assignments immediately changes capability checks. Demo accounts never bypass authentication just because all data are synthetic.

## Migration design for later authorization

Use additive versioned migrations on local/disposable data before hosted demo. Existing estimates become legacy v0 requiring review, never invented consent/payment. Keep original totals/history for comparison. No profile identity decoupling/erasure workflow is needed for synthetic data, commercial erasure/retention is inactive appendix scope. Never rerun original schema.sql on the connected populated project as an upgrade.
