# Navigation latency — 25 October 2026

## Evidence and cause

Before changes, 12 desktop transitions through pricing, booking, lookup and home on production had median content readiness **1,213ms**, minimum306ms and maximum5,660ms. The existing loading boundary appeared in11–73ms; the destination content was waiting for server work/network, rather than the click being ignored. These are observations from one browser/network, not a global benchmark.

Home, pricing and booking forced request-time rendering. Their catalog reads used React `cache`, which deduplicates inside a render but does not persist the database result across requests. Dynamic navigation normally prefetched only the loading shell. The controlled production fixture reproduced the issue with1,500ms upstream catalog latency: repeat home/pricing reads made4 more catalog requests, and booking navigation waited1,868ms.

## Narrow fix

- Home/pricing support public ISR with60-second revalidation. Only catalog GETs opt into Next's persistent fetch cache with the same revalidation interval. Booking remains dynamic through its search parameters and uses the public catalog cache.
- Header navigation explicitly prefetches complete public home/pricing/booking/lookup routes. Account/admin links keep the default policy. This moves destination preparation before the click where possible, rather than blocking on it afterward.
- The loading boundary now visibly says “Đang mở trang…”. Skeletons remain decorative; their CSS selects the second div independently of the inserted paragraph.
- The optional fetch override is used only by `getCatalog`. Auth, orders, ledger, quotes and customer data do not use it. A production HTTP test changes a local service price after caching the display and proves the order RPC uses the changed database price and returns `Cache-Control: no-store`.

Revalidation is demand-driven and can serve stale public data while refreshing. It is not a guarantee that a manual database edit appears instantly or within a strict60-second ceiling. Submitted order pricing remains database-owned. Cold navigation and slow networks still incur latency; warm prefetch timing is not a promise for every visit.

## Regression proof

The first two new production cases failed before the fix. The final production test passes3 functional subtests plus its parent, **4/4**, with zero additional catalog requests on repeat public reads and **25ms** prefetched booking navigation despite1,500ms artificial upstream latency. A synthetic local order returns145,000 after the local price change, rather than the stale142,500 estimate. No hosted order is created by this test.

The existing pricing test initially timed out because it mutated its disposable catalog then expected immediate freshness. Its extreme-name/amount/empty-category assertions are preserved. Only that mutation reload uses Next dev's documented `Cache-Control: no-cache` behavior to inspect the new fixture; the production cache tests use normal requests. The adjusted pricing test passes2/2, and the full affected subset subsequently passes14/14 without skips.

Commands and outputs:

- `node --test tests/browser/navigation.test.mjs`: [before](production-red.txt), [after](production-green.txt), [measurements](local-measurements.json).
- `node --test --test-concurrency=1 tests/browser/booking.test.mjs tests/browser/clarity-home.test.mjs tests/browser/pricing.test.mjs tests/browser/home-readability.test.mjs tests/customer/google.test.mjs tests/customer/browser.test.mjs tests/domain/http02.test.mjs`: [14/14](regression-green.txt).
- `npm run test:pricing`: [2/2 after fixture refresh adjustment](pricing-green.txt).
- `npm run lint`: [output](lint.txt).
- `npm run typecheck`: [output](typecheck.txt).
- `npm run build`: [output](build.txt).

Framework references read from the installed Next16.4.2 package: `01-app/01-getting-started/04-linking-and-navigating.md` and `01-app/03-api-reference/04-functions/fetch.md`. The latter documents explicit revalidation, request memoization versus persistent cache, and the dev-only hard-refresh cache bypass. No experimental caching flags, dependencies, SQL migrations or hosted changes are introduced.

## Cold-link confirmation and feedback

The first deployed cache fix passed CI and58 production checks. Its next12 production transitions had a14ms median, with warmed samples12–16ms. However, the first pricing click took2,965ms and its loading shell did not appear until2,644ms: a static route's full prefetch can still be unfinished on the very first click. See [first production follow-up](production-after-cache.json). The median improvement does not remove cold-network latency.

A new cold-link test failed before the feedback fix. `NavigationHint` now uses Next's `useLinkStatus` inside header links and renders a passive, accessible “Đang mở trang…” status through a body portal. It stays visible when selecting a mobile-menu link closes that menu, avoids layout changes and clears with the actual pending state. There are no timeout-based completion guesses or fake percentages.

Final local production fixture: **5/5** Node results (four functional subtests and their parent). With1,500ms browser-network latency, visible cold feedback appeared in16ms at390px and17ms at1440px; warmed booking took26ms. These are controlled local observations. [Red](cold-feedback-red.txt), [green](cold-feedback-green.txt), [mobile pending](pending-390.png), [desktop pending](pending-1440.png). The nearest homepage/customer regression rerun passed2/2 after this addition; the earlier cache regression set passed14/14. Final lint, typecheck and build outputs are [here](feedback-lint.txt), [here](feedback-typecheck.txt) and [here](feedback-build.txt).
