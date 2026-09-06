# Implementation of the source and test review

The full matrix is the acceptance scope. Lint, strict types, security, coverage
thresholds, accessibility, browser compatibility and the shipped size budget stay
mandatory. Implementation and final verification are tracked separately.

| Requirement                                                   | Implementation   | Evidence / remaining verification                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heatmap palette and update regression                         | Verified         | `Palette` is shared by model, renderer, and selection. Default/custom/update/zero/uniform regressions in `PresentationConsistency`.                                                                                                                                                                                  |
| Structured tooltip content and formatter regression           | Verified         | All families register heading/items on `ChartMark`; tooltip does not split text or parse diagnostic attributes. Punctuation and formatter-call-count regressions pass.                                                                                                                                               |
| Diagnose existing demo and visual failures                    | Verified         | The starting HEAD already contained the demo height and macOS corrections. Full pre-refactor comparisons passed without replacing references; the direct-API migration also passed all retained references.                                                                                                          |
| Automatic test cleanup                                        | Verified         | Global setup tracks public mounted charts, destroys per-test charts in `afterEach`, restores mocks/globals, and retains only explicit suite fixtures until `afterAll`. Destroyed charts leave tracking sets.                                                                                                         |
| Architectural boundaries instead of implementation shapes     | Verified         | Export contract, import resolution/cycles, family isolation, layer direction, and transitive browser-free model checks. Verified by the final complete quality gate.                                                                                                                                                 |
| Informational source metrics; enforced shipped size           | Verified         | Build reports source metrics without rejecting module extraction. Largest family: MixedChart 21.905 kB gzip, below the unchanged 22,200-byte gate.                                                                                                                                                                   |
| Explicit interactive mark records                             | Verified         | `ChartMark` records kind/indexes/visualElement. `SvgSurface` links visible marks during construction. Mutation of diagnostic attributes does not change selection or tooltips.                                                                                                                                       |
| Single interaction state owner                                | Verified         | Controller owns preview/focus/selection indexes and abortable input listeners. Chart retains stable identity across replacement. Detached-mark teardown regressions pass.                                                                                                                                            |
| Shared validation rules                                       | Verified         | Shared gradient, numeric/text predicates, heatmap point and timesheet task rules serve builder/render/update. Targeted validation and rendering suites pass.                                                                                                                                                         |
| Direct public API tests without adapter validation            | Verified         | `MountChart` and `ChartScenario.mount` removed. Scenarios and negative cases call public builders. Tests for adapter-only options/type/orientation removed; actual parent and horizontal input boundaries retained.                                                                                                  |
| Simpler builder and scope ownership                           | Verified         | Builder state has no owner back-reference. Scopes store explicit name, record and active flag, with no property-name inference.                                                                                                                                                                                      |
| Preserve builder copy, expiry and successful-commit lifecycle | Verified         | Existing public lifecycle/retained-scope tests retained; independent callback-failure expiry and validation cases pass. Verified by the final complete quality gate.                                                                                                                                                 |
| Family-specific model projections                             | Verified         | Factories bind family projections from `ChartPoints`; snapshots retain only applicable collections. Independent point lookup avoids flattening all points per call.                                                                                                                                                  |
| Domain-specific normalization modules                         | Verified         | `Normalize.js` replaced by series, heatmap, timesheet, dates, gradient, primitive validation, and copy modules.                                                                                                                                                                                                      |
| Focused, independently named tests                            | Verified         | Fluent negative cases and updates execute independently; monolithic FluentCoverage/UnifiedPipeline files replaced with authoring, validation, policies, family rendering and cross-layer contract suites.                                                                                                            |
| Model/render/selection/tooltip consistency                    | Verified         | Public regression suite compares displayed values/colors and selected data, including update and selected-versus-focused point lookup. Verified by the final complete quality gate.                                                                                                                                  |
| Real browser input scenarios                                  | Verified         | Public lifecycle scenarios use Playwright click and keyboard input; radar enters via keyboard because a two-axis polygon has no clickable area.                                                                                                                                                                      |
| Browser compatibility assertions for results                  | Verified         | Twelve families assert updated data, focus, selection, resize dimensions, preserved identity, and destruction. 48/48 cases pass across Chromium, Firefox, and WebKit.                                                                                                                                                |
| Reviewed visual matrix and reproducible environment           | Verified locally | 11 keyboard/pointer pairs identical on both platforms replaced with rendered-result equivalence; 22 duplicate references and 99 failure diagnostics removed. Remaining screenshots unchanged. Ubuntu 24.04 and lockfile pin CI environment. See `VISUAL_MATRIX.md`.                                                  |
| Meaningful repeated performance measurements                  | Verified         | Warmup plus median of five samples; separate synchronous mount/update and frame-readiness checks; no SVG-path-length budget. All four isolated performance cases pass.                                                                                                                                               |
| Reused builds and deduplicated CI/release gates               | Verified         | `check` builds once and reuses dist for CDN/SSR checks. Full browser matrix runs on one Node job; second Node checks toolchain. Release workflows pack and publish the verified archive without repeating lifecycle gates. Native import-map checks pass in all three browsers; SSR import and package dry run pass. |

## Final verification

Started from commit `9d24c57`. Earlier audit had identified a heatmap color mismatch
and punctuation-sensitive tooltip parsing. The old demo height and visual failures
were already corrected by commits included in this baseline.

`npm run check` passed in full on 6 September 2026:

- Prettier, ESLint, Stylelint, and all three strict TypeScript resolution modes.
- 431/431 tests in the coverage run, including retained visual references.
- Coverage: 100% statements (2,836), branches (1,451), functions (687), and lines (2,761).
- 4/4 isolated performance scenarios with warmup and repeated samples.
- 48/48 compatibility cases across Chromium, Firefox, and WebKit.
- Largest shipped family: MixedChart, 21,905 gzip bytes against the unchanged 22,200-byte limit.
- Native import-map checks in all three browsers and SSR import of the same build.
- `npm run pack:check` passed; `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.

Cross-browser verification also corrected the geometric assertion for zero-radius
SVG circles and made fractional-tick assertions respect browser locale. A delayed
root mouseleave exposed a selected-tooltip visibility bug; the controller now
restores persistent selection consistently, with a dedicated regression.

No linter rule, strict typing setting, coverage threshold, screenshot tolerance,
performance threshold, or shipped size budget was relaxed. Source-count limits
were replaced with informational metrics as explicitly required by the matrix.
No visual reference was regenerated.
