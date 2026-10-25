---
version: 1
slug: "pricing"
primary_target: "app/bang-gia/page.tsx"
related_targets: ["app/bang-gia/pricing.css"]
---

# Readable service rates

Mode: Read, leading to booking. Preserve the shop's cobalt/enamel identity, Vietnamese Be Vietnam Pro, service emoji and server catalog truth.

The primary path is category → service → exact unit rate → booking. Six category sections share one right-aligned numeric axis. The amount leads (26px desktop, 24px narrow, 22px at very narrow widths); unit sits directly below, without wrapping. Duration supports rather than competes with price. Category navigation remains sticky on desktop and wraps in normal flow below 900px.

Semantic tables retain captions, column and row headers. At narrower containers duration moves under the service name. At very narrow containers or enlarged text, rows stack while retaining their price association. Long names wrap in their own cells. No calculator, promotional badge or invented fee/guarantee. Preserve all catalog amounts, units and hour estimates and existing category booking routes.

Styles are prefixed with pricing- and imported by this route. The project's existing CSS loader transforms module filenames into plain CSS; keep the current configuration and avoid relying on CSS-module exports here. Whole-table whitespace and row-header backgrounds are explicitly scoped to avoid old admin-table defaults.
