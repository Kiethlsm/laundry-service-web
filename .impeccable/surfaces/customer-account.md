---
version: 1
slug: "customer-account"
primary_target: "app/dang-nhap/page.tsx"
related_targets: ["app/tai-khoan/page.tsx", "app/tai-khoan/don/[id]/page.tsx", "components/customer-orders.tsx", "components/order-progress.tsx", "components/header.tsx", "app/shop-operations.css"]
---

# Customer account — Google entry

Mode: Operate. Precisely scoped extension of the incumbent wash-control visual world, not a redesign. Reuse the current login panel, cobalt actions, warm paper, Be Vietnam Pro and ruled table styles.

Purpose: let a customer choose Google without creating a separate password, find orders tied to that session, and reach booking. Guest booking and code/phone lookup remain available. Two owners manage the shop; no employee surface is introduced.

2026-10-25: the account list uses ruled records with an always-visible amount and explicit View order links. Protected detail verifies the authenticated customer's ownership before reading existing workflow RPC data, then projects only service names/rates, current quantities, cost and progress. Internal damage/custody/staff/ledger notes are never passed to the customer page. Estimates are separate from the current settled amount; a displayed amount is not a receipt. Customer next steps are clear and include the real shop contact. Escape restores focus to the mobile menu toggle.

One primary Google action, secondary guest and lookup links, explicit Vietnamese cancellation/unavailable messages, and a protected account list with an honest empty state. Advanced controls and SMS options are not shown as nonfunctional buttons. Google basic identity scopes do not grant Gmail inbox access.

Verification: local Auth transport and real local PostgreSQL test the application contract only. Google consent, hosted PKCE cookie exchange and refresh require external configuration and a real-provider smoke test before rollout. Initial screenshot pass exposed a premature Suspense/loading capture; the browser assertion now requires visible content and loaded fonts, then captures 1440/390 in the confirmation pass. No visual changes to the home page or washer effects.
