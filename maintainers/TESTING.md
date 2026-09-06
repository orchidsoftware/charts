# Testing

A test describes one observable contract. Keep its meaningful input, action and
expected result together. Several assertions are appropriate when they explain
the same result. Prefer the public fluent API for product behavior; pure policy
and browser mechanism tests may import the implementation they exercise.

## Commands and environments

| Command                           | Scope                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test` / `npm run test:watch` | Node policies and compact Chromium contracts; the ordinary edit loop                                                                         |
| `npm run test:unit`               | Pure policies in `test/policies`; no DOM, browser setup or chart tracking                                                                    |
| `npm run test:policies`           | Native Node tests for documentation, browser-free models and the test lint rule                                                              |
| `npm run test:site`               | Demo, documentation and the 93-fixture laboratory                                                                                            |
| `npm run test:visual`             | Screenshot baselines and equivalent pointer/keyboard appearances                                                                             |
| `npm run test:input`              | Real pointer, keyboard, touch and hit testing in Chromium                                                                                    |
| `npm run test:performance`        | Warmed-up mount and update budgets, without coverage                                                                                         |
| `npm run test:compatibility`      | Input contracts in Chromium, Firefox and WebKit                                                                                              |
| `npm run test:all`                | Every Vitest project, including site, visuals, input and performance                                                                         |
| `npm run check`                   | Format, lint, native Node policies, types in three resolution modes, 100% coverage, performance, compatibility, bundle size and distribution |

Install with `npm ci` and `npx playwright install chromium firefox webkit`.
The fast command is an intentionally smaller feedback loop; use `check` before
release. Coverage collects every source module and keeps all four thresholds at
100%. It combines the behavioral, pure, site, visual and input projects and
excludes only timing benchmarks. No browser is replaced with a DOM mock.

`TestProjects.mjs` bounds the ordinary browser pool to two workers. Heavy groups
run afterward, with files serialized within each group. Tests sharing a DOM,
viewport or suite fixture must not use `concurrent`. Performance is last in the
full local run and has its own runner in CI. Do not run competing benchmarks on
the same machine when comparing timings.

The release gate also runs `npm run test:touch` in a touch-enabled Chromium
context: real taps, chart-originated scrolling, and an accessibility-tree check
for static data. Synthetic pointer tests remain useful cross-browser state
contracts; they do not replace native gesture testing.

`npm run test:frameworks` executes the Stimulus controller extracted from the
public guide against real Turbo morphs, including unchanged data and cache
cleanup. `npm run test:dist` compiles a clean consumer of the actual npm archive,
including the CSS import, in Bundler, Node16, and NodeNext modes.

## Readability enforced by ESLint

- Test files have at most 500 code lines; individual `it`/`test` callbacks have at
  most 60. Blank lines and comments do not count. The enclosing `describe` is not
  a test callback. Support functions have the same 60-line ceiling.
- Compact arrays use ordinary Prettier formatting in tests. Product-code array
  formatting remains unchanged.
- `vitest/no-focused-tests`, `valid-expect`, `valid-expect-in-promise`,
  `no-conditional-expect`, `no-identical-title` and `valid-title` are errors.
  Nested `describe` depth is at most two. The existing cognitive-complexity rule
  remains active.
- `no-conditional-in-test` and `prefer-each` are a pilot on pure normalization and
  boundary policies. Tick and timesheet tests also enforce `prefer-each`.
  Extend the pilot after simplifying each affected contract, rather than adding
  blanket suppressions or rejecting useful state-machine loops.
- Give parameterized cases distinct names (`{ name, input, expected }`) or include
  the distinguishing primitive value in the title. A valid title alone cannot
  prove that the report is understandable.

The local `orchid-charts/max-test-lines` rule recognizes imported Vitest and
`node:test` callbacks, aliases and chained modifiers such as `it.each` and
`it.skipIf(...).each`. Its behavior is exercised with ESLint RuleTester in the
native Node gate. Vitest-specific rules are not applied to `node:test` files.
The ESLint plugins use an isolated TypeScript 5.9 API dependency; the package's
TypeScript 7 compiler and all three declaration checks remain in place.

Do not shorten a test by hiding its assertions inside a generic assertion
framework. Extract repetitive event mechanics or expensive fixture construction;
keep the contract visible. Review both setup cost and diagnostic quality when
splitting a scenario. For example, demo cases build only the examples they need;
one integration test still mounts the complete demo and checks its wiring.

## Shared fixtures and resource ownership

The laboratory and screenshot suite retain a suite-owned fixture because
rebuilding all charts for every assertion is expensive. Hooks reset viewport,
theme where relevant, focus and pointer/selection state between cases. Selection
appearance comparisons must use the same scroll position for pointer and
keyboard captures; native focus can scroll the page.

The existing screenshot references encode an ordered viewport/scroll tour. That
suite explicitly disables test shuffling while keeping each named comparison
visible in the report. Rearranging the tour can change fractional rasterization
and clipping by a pixel even when the chart is unchanged. Selection-equivalence
tests live in a separate suite and can be shuffled. The laboratory and ordinary
contracts are also checked in shuffled order. Removing this snapshot framing
constraint would require a separately reviewed migration of both macOS and Linux
references; it is not an excuse to update images automatically.

`test/support/Cleanup.js` deliberately retains the existing tracked Chart
subclass. It delegates to the real implementation, records test-owned and
suite-owned instances separately, destroys them in `afterEach`/`afterAll`, and
restores mocks and globals after each test. This also cleans up after a failed
assertion. There is no evidence that replacing this ownership mechanism would
meaningfully improve runtime. It is configured only for browser projects.
Explicit `destroy()` remains useful when destruction itself is the contract.

See [Visual risk matrix](./VISUAL_MATRIX.md) before adding or removing snapshots
and [Performance](./PERFORMANCE.md) for measured workload and budgets. Neither
arbitrary timeouts nor fewer benchmark samples are an acceptable speed fix.

## CI and timing reports

Static/package checks, coverage, performance and three-browser compatibility run
as independent CI jobs. The existing named complete quality gate aggregates all
of them, including Node 26 toolchain compatibility, and fails if any dependency
fails or is cancelled. Local `check` remains a sequential equivalent for the
mandatory quality checks. CI additionally audits production dependencies and
inspects the package archive.

The package job installs all three browsers because `test:dist` exercises native
import maps in real browsers as well as the browser-free SSR import.

Each browser job writes a JSON timing report to `.vitest-attachments/` and uploads
it even on failure, along with browser diagnostics. Coverage also uploads its
HTML/LCOV report. Compare at least three runs on the same runner class, commit
and dependency/browser versions. Report wall time, test count and failures;
separate the fast subset from the full suite and coverage. Parallel CI jobs
reduce the critical path, not necessarily total billed execution time.

Local implementation measurements and validation are recorded in
[Test review](./TEST_REVIEW.md). GitHub Actions timings require actual remote runs
and must not be inferred from local Chromium timings.
