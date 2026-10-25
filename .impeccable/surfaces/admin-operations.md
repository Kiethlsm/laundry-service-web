---
version: 1
slug: "admin-operations"
primary_target: "app/admin/page.tsx"
related_targets: ["app/admin/orders/[id]/page.tsx", "components/admin-orders.tsx", "components/demo-workspace.tsx", "components/workflow-panels.tsx", "components/intake-fields.tsx", "app/admin-ui.css", "app/shop-operations.css"]
---

# Two-owner shop operations

Mode: Operate. The owner and mother run the shop; no workforce management.

2026-10-25 follow-through: current settlement amounts and quantities are read via the authenticated client, scoped by order and immutable settlement ID. Quote estimates remain separately labelled. The intake form supports 1–20 bags in one atomic receive operation. Handover precedes collapsed accounting history, and the next-step action scrolls/focuses the handover form itself. Internal state/reason codes use Vietnamese presentation labels. Real payment activation remains a separate backend slice; the existing SQL supports simulated ledger entries only, so its honest labels stay visible.

Preserve the established cobalt/enamel identity and Be Vietnam Pro. Replace the report-first landing and simultaneous long forms with a task-first order list and one visible workspace panel. Four work groups: new, working, ready to return, completed; cancelled and all remain available. Counts describe the loaded search results, never global totals. Keep code/phone search and the 100-result boundary explicit.

Each order starts with customer contact and a next-step explanation derived from the existing transition/quote/payment contracts. View controls never mutate orders. Keep forms mounted across panel changes to preserve pending inputs and idempotency keys. All authorization, command payloads, immutable records and server preconditions stay in their current layers. Reports/history are secondary disclosures; real payment activation is outside this UI slice.

Public footer uses only owner-confirmed phone 0903992813 and address 104/4G Nhất Chi Mai, phường Tân Bình, Thành phố Hồ Chí Minh. A genuine Google Maps address URL opens on click; no invented coordinates, fake cartography, API key or paid map provider.

Verification: local PG17 fixture, full cumulative gate, authorization matrix and hosted-defaults test; real browser work groups, search, guided panels, unchanged revision, call/maps links and 390/1440 layouts. Inspect one batched capture, correct defects together, confirm once, then stop.

## Action clarity · 2026-10-25
Show the current order and five-stage journey, then each save consequence. Keep custody and shared processing distinct. Success survives a disappearing form and is shown only after rendered data reaches the RPC-acknowledged revision. Disable submissions during synchronization; retain SQL revision/idempotency checks. Use the shop term bọc with physical intake examples. The next-step control reveals, scrolls to and focuses its region.
