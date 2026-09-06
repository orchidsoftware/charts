# Visual risk matrix

The cases in `test/VisualRegression.test.js` and the named tables in
`test/support/VisualFixtures.js` are the executable inventory. Every entry in a
table inherits the risk below; its name identifies the chart family or example.
Baselines remain platform-specific. The visual suite sizes both the browser
and its test iframe so captures retain their natural pixel dimensions: 1280px
for desktop pages and 390px for mobile pages. Whole-page captures must never be
scaled thumbnails. Their ordered viewport/scroll capture tour
is explicit (`shuffle: false`); independent selection-equivalence tests are in a
separate suite. A screenshot of a container and one of its
children are not automatically equivalent coverage.

| Inventory / baseline prefix                                                   | Distinct risk                                                                                                                         | Decision                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `demo-body-desktop-light`, `demo-body-desktop-dark`, `demo-body-mobile-light` | Whole-page hierarchy, section spacing, grid breakpoints and page-wide theme integration                                               | Retain all three page views                                                                                           |
| `demoCards` / `demo-desktop-light-*`                                          | Detailed per-family geometry, labels, legends, gradients, signed/stacked axes and frameless sparklines                                | Retain each named family/variant; a page-wide mismatch ratio can conceal a small local regression                     |
| `demoSections` / `demo-section-light-*`                                       | Neighbor alignment, section height and wrapping across supported families, trends, comparison, composition and activity               | Retain each of the four sections; isolated cards cannot show their relationships                                      |
| `responsiveCards` / `demo-mobile-light-*`, `demo-desktop-dark-*`              | Seven representative families at narrow width and with dark tokens: Cartesian, horizontal, radial, composition, calendar and timeline | Retain both modes for each named case; these exercise different layout and contrast risks                             |
| `radar-comparison-{theme}-{width}`                                            | Multi-series radar tooltip, shared-axis labels and focus feedback in both themes at 390 and 1280 px                                   | Retain all four intersections; this combined interaction risk is absent from static radar cards                       |
| `sharedMixedCards` / `mixed-*-hover`                                          | Shared tooltip rows, series colors and single/dual-axis formatting                                                                    | Retain both mixed variants                                                                                            |
| `demoXYCards` / `scatter-real-hover`, `bubble-real-hover`                     | Real example labels, coordinate formatting and tooltip row counts                                                                     | Retain both examples                                                                                                  |
| `demoCompositionCards` / `*-real-hover`                                       | Outward pie/donut anchors versus on-segment percentage anchors with actual example content                                            | Retain all three layouts                                                                                              |
| `stateFixtures × stateVariants` / `interaction-*`                             | Hover, pressed, pointer selection, keyboard focus and keyboard selection across 12 chart families                                     | Retain every distinct appearance                                                                                      |
| `equivalentStates` (11 keyboard-active cases)                                 | Keyboard selection must render the same bounds, text, paint and visibility as pointer selection                                       | Keep DOM/computed-style equivalence instead of 11 duplicate screenshots; donut keeps its own keyboard-active baseline |

The review found overlap but did not establish an expendable risk. No screenshot
is removed merely to reduce suite duration. The full set runs in its own project;
the fast feedback loop omits this project while the coverage/release gate
continues to execute it. Real browser input and hit testing also remain separate
contracts; synthetic events in visual fixtures are not a substitute for those.

When changing this inventory, identify the risk that moves to another test and
review reference, actual and diff images. Preserve pixel thresholds unless a
specific rendering reason warrants changing them. Never update references solely
because a test failed.

## Other visual contracts and platform references

`test/Lab.test.js` captures four annotation views as one explicit sequential tour:
labels colliding with marks, vertical bars, horizontal bars and partitioned
regions. Its other cases check fixture completeness, extreme inputs and mobile
containment independently. `test/RadarInspection.test.js` combines real measure
hit testing, touch and keyboard navigation with `phone-comparison-*` screenshots
for narrow layouts and tooltip placement. These contracts run through the site
and input projects and through the complete coverage gate.

References live in `test/__screenshots__` and include browser and operating system
names. Chromium references support macOS and Linux; radar compatibility cases
also have Firefox and WebKit references. Failure screenshots and Vitest
attachments are diagnostics and must not be committed.

Run `npm run test:visual` for the primary visual suite. The **Update Linux
Screenshots** workflow generates references on Ubuntu 24.04 using `npm ci` and the
locked Playwright browsers. Download its artifact, review changes, commit the
references, and run CI against that commit. The workflow includes radar cases in
all three supported browsers.
