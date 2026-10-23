---
version: 1
slug: "customer-account"
primary_target: "app/dang-nhap/page.tsx"
related_targets: ["app/tai-khoan/page.tsx", "components/customer-orders.tsx", "components/header.tsx"]
---

# Customer account — Google entry

Mode: Operate. Precisely scoped extension of the incumbent wash-control visual world, not a redesign. Reuse the current login panel, cobalt actions, warm paper, Be Vietnam Pro and ruled table styles.

Purpose: let a customer choose Google without creating a separate password, find orders tied to that session, and reach booking. Guest booking and code/phone lookup remain available. Two owners manage the shop; no employee surface is introduced.

One primary Google action, secondary guest and lookup links, explicit Vietnamese cancellation/unavailable messages, and a protected account list with an honest empty state. Advanced controls and SMS options are not shown as nonfunctional buttons. Google basic identity scopes do not grant Gmail inbox access.

Verification: local Auth transport and real local PostgreSQL test the application contract only. Google consent, hosted PKCE cookie exchange and refresh require external configuration and a real-provider smoke test before rollout. Initial screenshot pass exposed a premature Suspense/loading capture; the browser assertion now requires visible content and loaded fonts, then captures 1440/390 in the confirmation pass. No visual changes to the home page or washer effects.
