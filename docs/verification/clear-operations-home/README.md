# Clear actions and compact home

2026-10-25. Branch: `feat/clear-operations-home`.

## Scope and result

Admin actions explain what will change before saving. The current order, whole-order stage and bag custody remain distinct. An acknowledged action persists across conditional form removal and focuses its confirmation. The next-step button opens, scrolls and focuses the relevant panel. The homepage now has a compact hero, a six-service price index, four practical steps and direct contact links. The existing CSS washer remains interactive; reduced motion is respected.

No SQL, dependency, hosted-data or configuration changes were required. Financial and evidence operations retain their existing simulated limitations.

## Regression evidence

`red.txt` records the two initial missing-contract failures. `action-race-red.json` records the later browser-discovered stale-revision failure: immediately starting work after weighing sent revision 1 although the database was at revision 2. The order stayed picked_up.

The action now returns the actual validated RPC revision. All action controls remain disabled until server-rendered data reaches that revision. `action-debug.json` records the same sequence sending revision 2 and reaching processing at revision 3. The regression test deliberately performs the immediate next action rather than adding an artificial revision wait.

`green.txt` is the focused five-test run. The subsequent response-contract unit test also passed. The canonical final gate is `npm run check:phase -- S01`: lint, typecheck, 61/61 tests, production build and client-asset scan all exit 0. Full output is in `../continuous/S01/`. This includes the authorization matrix (170/170 cells plus 20 invalid/unknown-role cases), hosted-defaults simulation and local rollback checks. All fixtures are local and synthetic.

A reduced-motion assertion initially assumed an inline custom property existed on first render. It was corrected to check computed progress and invariant transforms across scrolling, including an already-active OS preference; no product behavior was relaxed.

## Visual review

One initial batch covered home, intake and received states at 390 and 1440 px. One final confirmation reviewed the updated mobile receipt and desktop homepage after the action synchronization fix and copy changes. No horizontal overflow at 390, 768 or 1440 px. No WebGL canvas was introduced. Screenshots are synthetic and included here.

An automated stylesheet check ran once. Its radius/token suggestions are advisory: the hero uses the existing rounded enamel visual language, while administrative callouts use restrained smaller corners. No further visual iteration is planned for this slice.

Live deployment checks are read-only and kept outside the repository. They cannot prove authenticated hosted admin writes or a fresh Google sign-in; those workflows are covered locally and remain manual production checks.
