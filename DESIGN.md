---
name: "Sạch Sạch"
description: "A neighborhood laundry through blue enamel wash controls."
colors:
  blue: "#164bc4"
  blue-hover: "#103993"
  enamel: "#dce9f6"
  orange: "#e27644"
  paper: "#faf9f4"
  white: "#fffefa"
  ink: "#183b69"
  muted: "#53647a"
  pale: "#edf2f6"
  line: "#d6dddf"
  danger: "#a3322d"
  green: "#236448"
  surface-blue: "#edf4fb"
  hero-surface: "#f1f5f5"
  card-sand: "#f1eee5"
  card-sage: "#eaf0e9"
  card-hover: "#e0eaf6"
  process-surface: "#e7eef3"
  nav-surface: "#edf1f3"
  machine-face-start: "#fdfefe"
  machine-face-end: "#e7eff4"
  machine-rim: "#adc3d5"
  machine-glass: "#e5eff7"
  machine-control: "#dae6ef"
typography:
  display:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "clamp(46px, 4.6vw, 68px)"
    fontWeight: 600
    lineHeight: 1.32
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.7
  home-headline:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  hero-body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.9
rounded:
  panel: "14px"
  button: "12px"
  field: "7px"
  selector: "6px"
  status: "5px"
  card: "16px"
  hero-section: "48px"
  process-band: "36px"
spacing:
  control-gap: "8px"
  field-gap: "22px"
  panel-padding: "24px"
  section-gap: "34px"
  container-gutter: "40px"
  mobile-gutter: "22px"
  service-gap: "20px"
  service-mobile-gap: "12px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-text:
    textColor: "{colors.ink}"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 13px"
  selector:
    textColor: "{colors.ink}"
    rounded: "{rounded.selector}"
    padding: "8px 16px"
  selector-selected:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
  enamel-panel:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
  service-card:
    backgroundColor: "{colors.surface-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "28px"
  navigation-surface:
    backgroundColor: "{colors.nav-surface}"
    rounded: "{rounded.button}"
    padding: "5px"
  machine-face:
    rounded: "{rounded.panel}"
    padding: "22px 25px 0"
---

# Design System: Sạch Sạch

## Overview

Blue Enamel Wash Controls. The user requested reverting the WebGL replacement to the prior CSS washer panel. Warm paper, cobalt actions, pale enamel and Be Vietnam Pro remain the visual identity. The live service selector sits inside the circular dial, and native scroll changes the panel's perspective. Rounded staggered service cards remain below. The source of truth is app/globals.css followed by app/home.css.

## Colors

Frontmatter records the base and home palette. Cobalt marks primary actions; ink marks selected service controls; orange marks the dial and brand punctuation. Pale blue, sand and sage distinguish service cards. Enamel gradients represent the panel faces. No WebGL material palette is in use.

## Typography

Be Vietnam Pro is locally served. The home headline uses clamp(46px, 4.6vw, 68px), weight 600 with the cobalt name at 800, line-height 1.25 and tracking -0.04em. Mobile uses clamp(36px, 8.8vw, 56px), then 33px below 359px. Hero copy is 16px desktop and 15px mobile. Operational fields are 15px desktop and 16px mobile. Compact metadata does not establish a minimum size for new body copy.

## Layout

The container caps at 1248px. The hero is a 1.1fr/1fr composition with a 48px gap. Its native sticky runway is calc(100svh + 260px); the hero minimum height is min(820px, 100svh). Mobile stacks in normal flow with no additional runway. The service inventory uses three columns, staggered middle cards, then two columns on mobile with staggered even cards. Pricing, booking and tracking retain ordinary lists and forms; desktop booking keeps its sticky summary. Breakpoints remain 1050px, 760px and 359px, with a 1100px washer adjustment.

## Elevation & Depth

The restored panel uses CSS perspective 1400px and preserved 3D transforms. Side faces are 64px deep on desktop and 42px on mobile; the drum sits forward along Z. Panel shadow is 14px 32px 45px -28px #355d7855, drum shadow 5px 14px 22px -12px #42627d70, knob shadow 2px 4px 7px #597b932d, and selected desktop navigation shadow 0 3px 8px #183b690c. The ground ellipse has blur 22px and opacity .28. This is the restored CSS presentation, with no canvas or autoplaying drum.

## Shapes

Service cards use 16px corners, shared buttons 12px, the panel 14px, fields 7px and category controls 6px. The hero has 48px bottom corners; the process band uses 36px, reduced on mobile. Circular dial rings, step markers and timeline points retain their specific roles.

## Components

The CSS washer contains a console drawer, knob, circular service readout, six category buttons and booking link. Selection updates real starting price, duration and destination; the orange marker rotates over 420ms with cubic-bezier(.16,1,.3,1). ScrollScene coalesces passive scroll events into animation frames and updates a clamped progress value. Body rotation and drum separation follow that progress; no perpetual animation runs. Reduced motion fixes a static perspective pose and removes sticky runway. Mobile uses a gentler turn. The navigation, forms and status components preserve their established behavior and visible keyboard focus. Service emoji and card inventory remain explicit PIPELINE requirements.

## Do's and Don'ts

- Preserve Vietnamese diacritics, service values and price alignment.
- Keep native scroll, the reduced-motion fallback and accessible service buttons.
- Preserve the user-selected CSS panel presentation; do not restore the rejected WebGL model without a new request.
- Keep operational forms still and readable.

## Readability refinement · 2026-10-24

Retain Be Vietnam Pro and the existing cobalt/enamel identity. Shared reading text is 16px with 1.7–1.75 line height; supporting text and labels are 14px; actions are 15px. Headings use -0.02em tracking (-0.025em for the hero) and the hero emphasis inherits its weight. Financial values use tabular numerals. Decorative washer controls retain their separate compact scale. Public pages omit project/version branding and invented contact details. Recipient display is Nguyễn Thị Mai, account 38606688, explicitly reconfirmed by the owner; QR bytes are unchanged and bank-app verification remains required.

## Owner operations
The admin landing prioritizes a search and four work-group selectors over reports. Order rows use code/status, contact, pickup appointment/address, current cost and a named open action. The result limit and the scope of group counts are explicit. On mobile each row becomes a two-column record; no sideways page navigation is needed.
Order detail starts with contact and a next-step explanation, followed by four mounted, selectively visible task panels. Report, quote history and original order details remain native disclosures. Selected views preserve input values; visibility controls never write orders. Existing authorization, revisions, quote acceptance, QC and ledger safeguards remain server-owned.
The public footer uses an outlined location pin with the supplied address as a real Google Maps link, plus a separate call action. No decorative fake map or invented opening hours.

## Clear actions and compact home · 2026-10-25

The homepage inherits cobalt/enamel and Be Vietnam Pro, replacing the sticky runway and staggered service cards with a compact hero, six-service ruled price index, two-column process narrative, and direct booking/contact actions. The accepted CSS washer and reduced-motion pose remain; progress follows normal scrolling.

Admin shows the five-stage journey and save consequences. Acknowledgement uses the RPC-returned revision; success waits for rendered data at least that fresh. Cross-action writes stay disabled until synchronized. Custody badges use server-provided received/returned/QC state separately from whole-order progress. Feedback persists across disappearing forms; errors never become success. No live financial activation or SQL change.

## Readable pricing · 2026-10-25

The pricing page is a single service-rate sheet with desktop category navigation. Cobalt tabular amounts use 26px/24px/22px at weight 700, aligned right on a pale blue price column; 14px units sit immediately underneath. Services use 16px medium-weight ink and wrap independently. Estimates use 14px muted text. Column headings use 13px. The heading scales 32–48px. The enamel explanation uses the established 14px panel radius. These deliberate pricing sizes extend the shared type ramp.

At narrow containers the estimate moves beneath the service. Very narrow containers and enlarged text stack the row to preserve legibility. Standard mobile still pairs service and price. Semantic captions/headers and native anchor navigation remain. The page explains actual-quantity pricing and estimated turnaround without changing real prices, adding fees, calculators or guarantees. Route-prefixed CSS resets legacy global table whitespace/backgrounds locally, with no configuration change.
