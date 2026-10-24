# Shop contact and owner admin overhaul — 2026-10-24

Public contact is owner-confirmed: 0903992813; 104/4G Nhất Chi Mai, phường Tân Bình, Thành phố Hồ Chí Minh. Footer call link and outlined location-pin link open the supplied address using Google's documented Maps URL search format. No API key, iframe, geolocation collection, invented coordinates or opening hours. Google resolves the address; an independently verified business Place ID is not supplied.

Admin now prioritizes four work groups, code/phone search, a phone action and pickup appointment over financial reports. Counts describe only the loaded (maximum 100) matching orders. Historical status query URLs still work. Reports can fail without replacing the order list with an error screen.

Order detail starts with customer contact and a next-step explanation. Four task views keep forms mounted and their operation keys/inputs intact. Quote history and original order/QR information are disclosures. Primary payment balance/actions precede settlement history. Terminal orders do not offer weight/requote editing. All existing server authorization, revision checks, quote acceptance, QC and immutable ledger commands remain unchanged. Real payment/evidence activation is outside this UI change.

Tests: red.txt records three named failures before the new components/helpers existed. npm run check:phase -- S01 passed lint, typecheck, 56/56 tests (0 skipped), production build and client scan. Following final CSS/panel-order corrections, node --test --test-concurrency=1 tests/admin/usability.test.mjs tests/admin/browser.test.mjs tests/browser/workflow.test.mjs passed 5/5 (green.txt), including the complete receive/quote/accept/weigh/process/QC/collect-and-deliver workflow. The admin unit tests include every work group, blocking issues, additional work, outdated QC, refund due, terminal and retained-custody guidance. The cumulative authorization matrix remains 170/170 +20 unknown/null cells, with hosted-defaults checks.

Visual review: one batched mobile/desktop inspection found a pre-existing footer selector overriding the new contact layout and a wrapping logout label. One correction batch and one resolved capture confirmed readable pin/address/phone spacing, mobile actions, and no page overflow at 390/1440. All admin screenshots use local ZZ TEST fixtures; no hosted customer rows are captured. No further visual iteration planned.

Environment: Docker Desktop and the existing labelled PG17.11 container were initially stopped. The existing container was started and allowed to finish crash-recovery/fsync; no containers, databases or rows were deleted or recreated to bypass the failure. Hosted Supabase is untouched.

No migrations, new dependencies, secret/env/config changes, live notification service or payment integration. Publish the branch, verify CI + anonymous Preview/contact checks, then fast-forward master and verify production. Revert code if rollback is required; no database rollback is needed for this change.

