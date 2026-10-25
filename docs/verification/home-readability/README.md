# Homepage readability — 25 October 2026

Scope: local homepage refinement, preserving the cobalt/enamel identity, Be Vietnam Pro and CSS washer. No dependencies, schema, hosted writes, push or deployment.

## Result

Final independent design assessment: **27/28** across the same seven applicable Nielsen heuristics. H1/H2/H3/H4/H5/H6 each score 4; H8 scores 3. H7/H9/H10 remain not applicable in this landing-page scope. This is a design judgment, not a completion percentage, user-study result, WCAG certification or assessment of the entire application.

The remaining minor tradeoff is the mobile washer's height before the full price comparison. Its explicit price jump, six functional service choices and retained visual identity justify preserving it.

## Changes and evidence

- Machine choices, duration and booking labels use 14px text. Two-column choices wrap long names; CSS minimum height is 44px. Perspective means this is not a certified 44px projected target.
- Real map and phone links precede the machine and fit inside the tested 667px-high phone viewports.
- Instructions and the price-estimate qualification precede the controls. The adjacent repeated contact strip is removed; full contact remains in the footer.
- Service-price rows retain arrows at all tested widths. Homepage footer navigation uses 14px text and 44px CSS minimum height.
- All six selections update the heading, exactly one pressed state and the category booking link at 320/390/768/1440px. No horizontal overflow or clipped controls was detected. Real Tab gives a visible focus outline; Space activates the focused choice.

Screenshots: [mobile](home-390.png), [desktop](home-1440.png). Measurements: [JSON](measurements.json).

## Commands

| Command | Result | Output |
| --- | --- | --- |
| `npm run lint` | Exit 0 | [lint.txt](lint.txt) |
| `npm run typecheck` | Exit 0 | [typecheck.txt](typecheck.txt) |
| `npm test` | 69 passed, 0 failed, 0 skipped | [tests.txt](tests.txt) |
| `node --test tests/browser/home-readability.test.mjs` | 1 passed, 0 failed, 0 skipped, final source | [homepage-test.txt](homepage-test.txt) |
| `npm run build` | Exit 0 | [build.txt](build.txt) |

The full suite started before the new test was registered in the manifest. The final homepage test ran separately after the last changes. Combined output satisfies the current S01 required-test manifest; future `npm test` invocations include HOME_READABILITY automatically. The full suite includes the authorization matrix and hosted-defaults simulation on local Docker PostgreSQL.

Build used empty process-only Supabase overrides so it could not use hosted credentials; no environment file was modified. Existing test-generated fixtures were restored; only this directory contains new captures.

The first keyboard assertion failed because it expected `:focus-visible` immediately after programmatic focus following pointer interactions. [Failure output](keyboard-harness-red.txt) is retained. The test now enters keyboard modality with an actual Tab event and asserts the next focused button's outline before activating it with Space. No product focus styling was changed to bypass the test.

## Review and limitations

Two isolated Impeccable reviewers assessed design and technical evidence. Final design confirmation reviewed refreshed screenshots/source/measurements; keyboard behavior is supported by the parent's browser test. The technical reviewer found no blocking regression. One detector pass over the changed homepage sources produced 21 advisory token findings and no primary finding; [raw output](detector.json). Advisory counts are not a count of usability defects.

No screen-reader session, zoom audit, all-browser matrix or Core Web Vitals benchmark was performed. Link destinations are checked as URLs, not external map/call application completion. Existing homepage tests cover reduced-motion behavior. The score applies to the homepage only.
