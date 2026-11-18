# Readable service pricing · 2026-10-25

Branch: `feat/readable-pricing`. Product changes are confined to `/bang-gia`.

## Research and decision

- [EU Data Visualisation Guide: scannable tables](https://data.europa.eu/apps/data-visualisation-guide/table-design-scannability): consistent numeric formatting, right-aligned comparable values and tabular numerals. Apply one price axis across all six categories instead of two independent desktop columns.
- [W3C WAI tables tutorial](https://www.w3.org/WAI/tutorials/tables/): meaningful captions and explicit column/row headers. Rates remain associated with their service and unit. Estimates move underneath service names at narrow container widths.
- A layout review found category headings stronger than prices, uneven row counts leaving dead space, small units and conflicting legacy pricing overrides. No calculator, arbitrary recommendation badges, invented fee or new operational promise was warranted.

## Result

Six linear category sections retain every catalog name, amount, unit and hour estimate. Cobalt tabular prices use 26px desktop, 24px narrow and 22px very narrow. Units sit underneath without wrapping. Pale blue emphasizes only the price column. Category shortcuts are sticky on desktop and wrap in normal flow on mobile; each booking link retains its category query. Empty groups display a call-to-ask fallback rather than a misleading booking link.

No database, dependency, environment, infrastructure or payment changes. All fixtures and catalog mutations in tests are disposable local data. Existing production prices are not edited.

## Test evidence

`red.txt`: before the implementation, the two new tests fail (0 passed, 2 failed): no associated semantic price tables and no dedicated category-navigation contract.

`green.txt`: `node --test --test-concurrency=1 tests/browser/pricing.test.mjs`, 2 passed, 0 failed. Re-run using `npm run test:pricing`.

- `PRICING_DATA`: compares all 15 rendered rates, names, units and hour estimates to the local SQL catalog; checks captions, column headers, row headers and estimate caveat.
- `PRICING_READABILITY`: 320/390/768/1440 px, price size/alignment, text and units fitting their own cell, no sideways scrolling, anchor landing below the site header, actual category booking navigation, 200% root text size, long names and large prices, empty-category fallback. Long text must fit its own cell, not merely avoid whole-page overflow.

The cumulative gate and CI include these named tests. `npm run check:phase -- S01` passed lint, typecheck, 63/63 tests (0 skipped), the production build and the client-asset scan. Authorization coverage remains 170/170 matrix cells plus 20 invalid-role checks, with the hosted-defaults simulation and local rollback checks included. Full cumulative command output is in `../continuous/S01/`.

The first CI run exposed a race in the existing homepage reduced-motion test (`ci-motion-red.txt`): CDP reported the new media preference while the captured transform was still the normal -9/-18/4-degree pose; after scrolling it was the correct static -5/-10-degree pose. The test now waits for the specified reduced-motion matrix before capturing its baseline, then retains the exact unchanged-transform assertion after scrolling. This strengthens the precondition; no homepage behavior or motion assertion was removed. `npm run test:clarity` passed 5/5 with this correction (`ci-motion-green.txt`); the complete CI gate must pass again before merge. The product code is unchanged from the successful 63-test local gate.

One intermediate local browser run (`local-browser-red.txt`) timed out waiting for intake acknowledgement, with no order-command request recorded and the fixture still pending at revision 0. Its cause was not established. An unchanged rerun of the admin test passed as part of the 5/5 clarity suite; pricing tests and the corrected motion test passed in the intermediate run. The failure log is retained, and a fresh complete CI run is required. No admin-product or intake-test changes were made to force a pass; hydration readiness in that older harness remains a follow-up if it recurs.

## Findings during verification

The existing Turbopack rule transforms `pricing.module.css` into `pricing.module.css.css`, producing ordinary selectors and undefined module exports. The local browser exposed this; configuration was left unchanged, and the route uses explicitly prefixed CSS instead. Legacy global table `white-space: nowrap` and row-header backgrounds are reset only within the pricing table.

Narrow-screen verification also exposed a native table colgroup mismatch when hiding the duration cell. Column widths are now assigned to visible cells directly, and tests assert actual amount/unit containment. This defect was fixed before shipping. No test was weakened to conceal it.

Desktop/mobile screenshots show real seeded service data, with no customer rows. Full-page captures document all categories; first-viewport captures preserve readable detail. A targeted correction confirmation checked the resolved mobile column defect; no further visual embellishment followed.

A static design check ran once: 11 advisory findings (10 type-ramp, 1 color), no blocking findings. The pricing type sizes are intentional and recorded in DESIGN.md; the pale price-column color is the existing surface-blue value. No detector-driven configuration or dependency changes were made.

## Live check boundary

Preview and production smoke checks are read-only: public pricing data, browser layout/navigation and anonymous admin guards. No hosted order is created and no hosted catalog is mutated. Authenticated admin writes and a fresh Google sign-in are not claimed as live checks for this pricing-only change.
