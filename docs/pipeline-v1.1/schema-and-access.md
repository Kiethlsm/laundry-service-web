# v1.1 — R1 schema and access artifact

Design, not executable SQL. All tables below have RLS; UUID primary keys unless otherwise stated, timestamps UTC, FK deletes restricted for business history. Names/columns are the agreed starting contract, not deferred to a later design phase. Existing IDs, order codes and history are preserved.

## R1 table list

`NN` = NOT NULL, `UQ` = UNIQUE; money bigint with nonnegative checks unless explicitly signed; common `created_at` omitted from rows for brevity but required. Actor FKs point to profiles. JSON is for bounded evidence/config payloads, not financial totals or permissions.

| Table | Required columns and relations | Constraints / behavior |
|---|---|---|
| `profiles` existing | preserve id; add auth_user_id nullable → auth.users, full_name, role, is_active, disabled_at | UQ auth_user_id; role `admin/staff/customer`; restrict role writes; preserve pseudonymous actor on Auth erasure |
| `customers` | id, auth_user_id nullable → auth.users, name, phone_e164, email nullable, contact_verified_at nullable | UQ auth_user_id when present; phone deliberately nonunique; Auth delete sets link null |
| `customer_addresses` | id, customer_id, label, address, area_id | Optional saved addresses; phase 06 UI |
| `service_categories` existing | existing id/name/slug/order + is_active | UQ slug |
| `services` existing | existing id/category/name/unit/price/est_hours/is_active | Nonnegative price, discrete allowed units; archive referenced rows |
| `shop_settings` | singleton id, name/contact, timezone, working_hours, holidays, policy_version, storage_fee/day/cap | Typed validated config, version/revision |
| `service_areas` | id, name, address_rule, delivery_fee, is_active | R1 enumerated areas, not geospatial routing |
| `pickup_slots` | id, starts_at, ends_at, capacity, reserved_count | UQ interval; 0 ≤ reserved_count ≤ capacity; lock during reservation |
| `orders` existing | existing fields + customer_record_id → customers, slot_id, revision, active_quote_id, active_settlement_id, ready_at, ready_notice_at, parent_order_id, legacy_review_required | Keep old customer_id as compatibility bridge; add status `closed_unclaimed`; active pointers must belong to this order |
| `order_items` existing | existing fields + snapshot_name/unit, estimated_quantity | Preserve original quote-facing service lines; physical tags separate |
| `order_quotes` | id, order_id, version, state, content_hash, delivery_fee, surcharge, discount, base_total, max_weight_total, policy_version, tolerance_consent, issued_at/expires_at | UQ order/version, v0 initial; issued financial contents immutable |
| `order_quote_items` | id, quote_id, order_item_id, snapshot_name/unit/rate, quoted_quantity, tolerance_kg | UQ quote/order_item; positive decimal qty, whole discrete qty |
| `quote_approvals` | id, quote_id, content_hash, method, verification_state, evidence_id, actor_id nullable, approved_at | `declared/verified/unverified/simulated`; declared checkout consent eligible for v0 only; Q6 for v1+ |
| `verification_challenges` | id, order_id, quote_id nullable, purpose, destination_hmac, secret_hash, expires_at, attempts, consumed_at | Q7; secrets never returned to staff or logged |
| `order_settlements` | id, order_id, version, quote_id, quote_hash, total, reason, actor_id | UQ order/version; immutable materialization |
| `settlement_items` | id, settlement_id, order_item_id, actual_qty, snapshot_rate, line_total | DB rounds each line; quote-scoped quantities |
| `order_charges` | id, order_id, type, amount_signed, business_day nullable, policy_version, evidence_id, actor_id | Append-only storage/waiver/fee/refund-due basis; storage UQ order/day/type |
| `garment_items` | id, order_id, order_item_id, tag_id, parent_item_id nullable, description, intake_condition, current_custody | UQ tag_id globally; parent belongs to same order; object or child piece |
| `item_events` | id, garment_item_id, type, actor_id, evidence_id nullable, replaces_tag_id nullable, occurred_at | Append-only; all custody transitions evidenced |
| `order_assignments` | id, order_id, staff_id, kind, assigned_by, ended_at | kind `processor/courier`; UQ active order/staff/kind; records resource scope |
| `delivery_tasks` | id, order_id, kind, assignee_id, scheduled_at, state, revision | kind `pickup/delivery/return`; UQ active order/kind; task and active courier assignment agree |
| `delivery_attempts` | id, task_id, outcome, reason, recipient_evidence_id, actor_id, occurred_at | Append-only success/failure; successful delivery committed only by P3 |
| `payment_transactions` | id, order_id, kind, amount, currency, method, original_id nullable, provider nullable, external_id nullable, environment, actor_id, effective_at, operation_key | Immutable; UQ environment/provider/external_id; UQ order/operation_key; one reversal per original |
| `cash_remittances` | id, courier_id, amount, received_by, evidence_id, remitted_at | Immutable; remittance allocations prevent double settlement of courier-held cash |
| `cash_remittance_entries` | remittance_id, payment_transaction_id, amount | Composite PK; allocation sum ≤ cash receipt held |
| `credit_authorizations` | id, order_id, max_debt, approved_by, reason, expires_at, revoked_at | Admin only; P3 checks live authorization |
| `order_custody` | order_id PK, state, paused_seconds, hold_started_at, next_action_at, disposition_evidence_id | U1–U4; state independent from payment status |
| `order_requests` | id, order_id, type, requester_id nullable, state, requested_payload, decision_by/reason | Customer request separate from executing mutation |
| `order_issues` | id, order_id, tag_id nullable, type, blocking, state, remedy, resolution_evidence_id | Includes missing/swapped/disputed/giặt lại; child orders link to parent |
| `item_waivers` | id, issue_id, garment_item_id, customer_evidence_id, approved_by | UQ resolved issue/item; marks exactly which tags remedy covers |
| `order_status_history` existing | preserve existing + reason, operation_key | Append-only actor/time/state records |
| `evidence` | id, order_id nullable, kind, object_path nullable, sha256, external_reference nullable, verification_state, recorded_by | Private immutable objects; signed URLs after access check |
| `audit_events` | id, actor_id nullable, action, resource_type/id, operation_key, redacted_change, occurred_at | Append-only, no raw secret/credential payload |
| `idempotency_keys` | scope, key, request_hash, resource_id, result_ref, expires_at | Composite PK scope/key; retain financial external dedupe independently |
| `staff_tasks` | id, order_id, kind, due_at, state, evidence_id | UQ logical task/order/due event; R1 manual reminders |

Real-shop R1 also installs job leases/health metadata and retention tombstones. Portfolio implements deterministic callable custody evaluation; it does not create a notification outbox. Later schema: R2 `notification_outbox/attempts` (event key, channel, destination ref, payload ref, state, lease, due time, provider ref); R3 `payment_attempts/webhook_events` (environment, external ID, settlement revision, signature outcome, amount/currency, reconciliation state). Their contracts are phases 07–08.

## One permission model

**Identity role/active state:** the profile resolved by unique `profiles.auth_user_id`, then its `role/is_active` only. **Order scope:** active `order_assignments.kind` only. **Customer ownership:** `customers.auth_user_id` linked via Q8 only. **Special financial exception:** live `credit_authorizations` only. There is **no `staff_permissions` table** and no JWT/user-metadata copy of authorization state.

| Action | Guest | Customer | Active staff | Admin | Source of truth for check |
|---|---|---|---|---|---|
| Public price/booking | Yes | Yes | Yes | Yes | Public service/config policy + server validation |
| Minimal lookup | Code + phone, rate-limited | Same public path | Same | Same | Exact lookup + restricted projection, not identity grant |
| Full order/evidence | No | Owned order | Assigned processor/courier only, minimum relevant fields | Shop-wide | role + customer link/assignment |
| Intake and pickup | No | No | Courier assignment | Yes | role + courier assignment + task |
| Measure, issue quote, process, QC | No | No | Processor assignment | Yes | role + processor assignment |
| Reconfirm v1+ quote | Via Q6 contact-bound proof only | Owned order | Record evidence per Q6, not self-approve | Verify Q6 evidence | ownership or quote-bound evidence; booking v0 consent is Q1 |
| Deliver/collect cash | No | No | Courier assignment + task | Yes | P3 + role/scope |
| Request change/complaint | Contact-verified request | Owned order | Assigned scope | Yes | Q8 evidence or ownership/assignment |
| Refund, reverse, waive, credit, dispose | No | No | No | Yes, evidence required | admin + relevant contract |
| Prices/staff/settings/export | No | No | No | Yes | active admin; last-admin invariant |
| Scheduler actions | No | No | No | Admin can inspect/retry | dedicated service identity + allowlisted job operation |

Implement one DB authorization helper `can_order_action(auth_user, order, action)` with fixed action mapping from this matrix. RLS wrappers call it with `auth.uid()`; client-callable functions derive that ID from JWT. Service-role-only RPCs receive the Auth ID from a server-verified session and independently read the same helper; public/authenticated callers have no execute grant on that path. Resolve the profile ID inside the transaction for actor FKs. UI consumes capabilities for rendering, never as proof.

Service-role bypasses RLS, so each privileged entry point checks identity, active state, action and resource scope. Security-definer helpers set a fixed search path and constrained grants. Deactivating staff makes the next mutation fail even with an old cookie. Admin roles require AAL2 on the real-shop track. Last-active-admin removal is rejected under a lock. Auth signup/profile editing cannot write privileged fields.

## Migration contract

Capture baseline; use additive versioned migrations, dry-run/backfill in disposable local/staging, preserve all IDs and totals for comparison. Backfill `profiles.auth_user_id = profiles.id`, switch identity resolution, then replace the old primary-ID Auth cascade FK with the nullable unique link (ON DELETE SET NULL). Keep disabled/redacted actor profiles for historical financial FKs; Auth erasure never cascades into business history. Old estimates become legacy v0 with `legacy_review_required`, not invented consent, payment or item-tag evidence. Synthetic intake fixtures may be rebuilt; real existing garments need physical retagging/reconciliation before delivery. Code switches to new pointers only after checks; remove compatibility columns in a later release. Rollback means compatible prior code or forward repair, not dropping newly populated tables.
