# Shop typography and copy — 2026-10-24

- Preserve Be Vietnam Pro and the existing layout/washer. Shared body 16px, labels/supporting text 14px, actions 15px, form controls 16px, looser heading tracking and consistent emphasis.
- Remove visible portfolio/demo/app-version labels from public copy, API recovery messages and admin project headings. Quote history retains its immutable sequence, shown as numbered revisions rather than vN.
- Remove invented footer contact details. Keep real operational limits explicit: transfer confirmation is manual, the existing admin money/evidence workflow remains simulated and has not been converted to real payment processing.
- Owner explicitly reconfirmed Techcombank account 38606688 and requested recipient Nguyễn Thị Mai. Existing source QR bytes/provenance unchanged, the existing CSS crop shows the QR card. Original downloadable image retains its original printed account caption. This is owner-supplied display information, not independent bank verification.
- No migrations, dependencies, hosted SQL writes or payment activation in this change. Google sign-in on the previous Preview was confirmed working by the owner after correcting OAuth credentials.

Validation: npm run check:phase -- S01: lint/typecheck/build/client scan exit 0, 52/52 tests, 0 failed/skipped, including authorization matrix 170/170 (+20 unknown/null checks) and hosted-defaults checks. Logs: ../continuous/S01. SHOP_COPY is included in the npm test and npm run test:customer gates. QR_BANK_BOOKING now checks the durable manual-confirmation boundary instead of the retired public project disclaimer, ledger-zero assertions remain.

Preview follow-up: the first production-CSS computed-style check failed with input font-size actual 15px vs expected 16px at 1440px (390px passed). A pre-existing input:not(...) selector outranked the new generic input rule. Fixed the original selector, removed the redundant override, and added computed input-size assertions in QR_BANK_BOOKING at 360/390/768/1440px. The complete gate passed again: 52/52, no skips, lint/typecheck/build/client scan exit 0. A second bounded capture confirmed the corrected desktop input size and preserved mobile layout.

Rendered review: browser.json covers home, booking and login at 390/1440px, 6/6. Screenshots were inspected together, no overflow or clipped Vietnamese accents. The QR card and explicit recipient are readable, cash/transfer state and Google entry are unchanged. Mechanical scan returned advisory-only legacy token drift, it is not claimed clean.

Deployment: push the feature branch, verify Preview and CI, then fast-forward master under the owner's explicit request. No production customer orders are created by smoke checks. Real Google login was manually verified by the owner before this cosmetic update.

