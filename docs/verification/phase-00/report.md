# Phase 00 - actual verification, 23 October 2026

Branch: docs/portfolio-plan-phase0. Baseline documentation commit: e33b736. Scope: narrow booking validation lint fix plus requested Markdown revision. No SQL/migrations, dependency/config/deployment change or push. Code changed only components/booking-form.tsx.

## Results

- [x] P00_REPRO_PURITY / B1: npm run lint before edit exited1 and reproduced react-hooks/purity at49:67.
- [x] P00_BUILD_CHECKS / B2: lint, typecheck and production build all exited0.
- [x] P00_PICKUP_VALIDATION / B3: dependency-free controlled-clock/source-wiring check exited0.

The original Date.now call was already in onSubmit, not observed during render. The installed linter nevertheless emitted the render-purity diagnostic. Module-level isFuturePickup owns clock/validity comparison and is invoked from submit, no clock is captured at module initialization or mount, and no lint rule is suppressed. Server validation is unchanged.

The focused check's first attempt failed only its server-file equality assertion because the check normalized one side to CRLF and the actual file used LF. Corrected both-side newline normalization, all behavior assertions and unchanged-server comparison now pass. No application change was needed for that test-check error.

These checks are not browser/Auth integration proof. No order was created to test this change, no credentials were used, and no future phase/CI/test harness was implemented.

## Reproduction output - exit1

```text
> laundry-service-web@0.1.0 lint
> eslint


C:\Users\Kieth\Documents\Juinior\components\booking-form.tsx
  49:67  error  Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

C:\Users\Kieth\Documents\Juinior\components\booking-form.tsx:49:67
  47 |     const form = new FormData(e.currentTarget);
  48 |     const pickup = new Date(String(form.get("pickup")));
> 49 |     if (!Number.isFinite(pickup.getTime()) || pickup.getTime() <= Date.now()) {
     |                                                                   ^^^^^^^^^^ Cannot call impure function
  50 |       setError("Chọn thời gian lấy đồ trong tương lai.");
  51 |       requestAnimationFrame(() => errorRef.current?.focus());
  52 |       return;  react-hooks/purity

✖ 1 problem (1 error, 0 warnings)
```

## After fix: npm run lint - exit0

```text
> laundry-service-web@0.1.0 lint
> eslint
```

## npx tsc --noEmit - exit0

No stdout/stderr. Successful exit recorded by the command tool.

## npm run build - exit0

```text
> laundry-service-web@0.1.0 build
> next build

▲ Next.js 16.4.2 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 1395ms

  Creating an optimized production build ...
✓ Compiled successfully in 4.0s
  Running TypeScript ...
  Finished TypeScript in 1391ms ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/5) ...
  Generating static pages using 11 workers (1/5)

  Generating static pages using 11 workers (2/5)

  Generating static pages using 11 workers (3/5)

✓ Generating static pages using 11 workers (5/5) in 197ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /admin/orders/[id]
├ ƒ /api/orders
├ ƒ /api/track
├ ƒ /bang-gia
├ ƒ /dat-lich
├ ○ /icon.svg
└ ƒ /tra-cuu


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## Focused validation output - exit0

```text
PASS invalid timestamp rejected
PASS past timestamp rejected
PASS equal timestamp rejected
PASS future timestamp accepted
PASS fresh submit-time clock rejects subsequently expired pickup
PASS validation called only from onSubmit handler; clock outside component
PASS independent server future-time check unchanged
```

## Reproduce focused check with existing dependencies

Run from repo root, no package install, framework harness or database access.

```powershell
@'
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const cp = require("node:child_process");
const ts = require("typescript");
const source = fs.readFileSync("components/booking-form.tsx", "utf8");
const ast = ts.createSourceFile("booking-form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const helper = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "isFuturePickup");
const component = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "BookingForm");
assert.ok(helper && component);
const clockOwners = [];
function visit(node, owner = "") {
  if (ts.isFunctionDeclaration(node)) owner = node.name?.text || owner;
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "Date.now") clockOwners.push(owner);
  ts.forEachChild(node, child => visit(child, owner));
}
visit(ast);
assert.deepEqual(clockOwners, ["isFuturePickup"]);
const submit = component.body.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "submit");
assert.ok(submit.getText(ast).includes("if (!isFuturePickup(pickup))"));
assert.ok(source.includes("onSubmit={submit}"));
let now = Date.UTC(2026, 9, 23, 10);
const context = vm.createContext({Date: {now: () => now}, Number});
const js = ts.transpileModule(helper.getText(ast), {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
vm.runInContext(js, context);
const validate = context.isFuturePickup;
assert.equal(validate(new Date("invalid")), false);
assert.equal(validate(new Date(now - 1)), false);
assert.equal(validate(new Date(now)), false);
const future = new Date(now + 60000);
assert.equal(validate(future), true);
now += 120000;
assert.equal(validate(future), false);
const server = fs.readFileSync("app/api/orders/route.ts", "utf8");
assert.ok(/Date\.parse\(pickup\)\s*<=\s*Date\.now\(\)/.test(server));
assert.equal(server.replace(/\r\n/g, "\n"), cp.execFileSync("git", ["show", "HEAD:app/api/orders/route.ts"], {encoding: "utf8"}).replace(/\r\n/g, "\n"));
console.log("PASS invalid timestamp rejected");
console.log("PASS past timestamp rejected");
console.log("PASS equal timestamp rejected");
console.log("PASS future timestamp accepted");
console.log("PASS fresh submit-time clock rejects subsequently expired pickup");
console.log("PASS validation called only from onSubmit handler; clock outside component");
console.log("PASS independent server future-time check unchanged");
'@ | node
```

Readable command outputs (line endings/trailing spaces normalized, exact captured output preserved in [command-results.json](command-results.json)): [before-lint.txt](before-lint.txt), [after-lint.txt](after-lint.txt), [typecheck.txt](typecheck.txt), [build.txt](build.txt), [validation.txt](validation.txt). Empty typecheck.txt is intentional: command produced no output.
