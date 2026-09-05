# Design audit and roadmap

Audit date: 2026-08-26. Target context: responsive web SVG embedded in
macOS, iPadOS, and iOS interfaces, with pointer, touch, keyboard, Full Keyboard
Access, screen-reader semantics, light/dark appearance, increased contrast, and
reduced motion considered.

## Current result

All chart types use one `core/Chart` lifecycle, legend renderer, tooltip, and
interaction state machine. The release gallery now includes multi-line,
multi-column, scatter + line, long-label, small-fraction, and multi-million
fixtures in addition to every chart family.

- 26 chart instances and 538 inspectable categories/marks render without
  console errors; the built-in-browser sweep found no interaction failures.
- Each chart exposes `role="group"`, `aria-roledescription="chart"`, an
  accessible name, an SVG description, and exactly one roving tab stop.
- Every interactive category or mark has an accessible value label.
- Pointer hover, focus, pressed, persistent selected, arrow navigation,
  Enter/Space, and Escape use one behavior and visual language.
- Cartesian charts highlight the full x-category band and show one structured
  tooltip containing all series at that x value, matching the useful
  index-based inspection behavior in upstream Frappe Charts.
- When `onSelect` is provided, click/tap or Enter/Space pins the tooltip,
  updates `aria-pressed`, emits `data-select`, and calls the callback. Without
  a callback, charts remain hover/focus-readable and don’t imply an action.
- Clicking any free area inside or outside a chart dismisses a pinned tooltip
  and clears its selection; Escape provides the same recovery path for
  keyboard users.
- Small line/scatter/compact-chart targets use a 44 px inspection region or a full
  category band. Dense lines use an aggregate path instead of overlapping
  pseudo-targets.
- Axes use locale-aware compact/significant-digit formatting. Long axis and
  legend labels ellipsize with their complete value in a native SVG title.
- Cartesian value axes use human-readable `1 · 2 · 5` nice steps. Integer-only
  datasets never imply fractional precision; genuine fractions keep the
  necessary decimals, and grid lines always align with the generated ticks.
- Dataset and aggregation legends use the same swatch, typography, spacing,
  wrapping, and truncation renderer.
- Shared legends are content-sized instead of dividing the plot into invisible
  fixed-width columns: 14 px swatches, 6 px swatch-to-label spacing, 16 px
  between items, and 20 px between wrapped rows. Demo chart cards follow the
  same 8 px grid with 16 px gaps and 24 px internal padding.
- Radar reserves plot space from the legend's actual wrapped row count, so the
  top axis label and polygon cannot collide with one- or multi-row legends.
- Radar uses the shared structured tooltip (series heading plus one row per
  dimension). Its width stays stable between series, and interactive marks no
  longer retain native SVG titles that could open a second browser tooltip.
- Desktop and 390 px compact-window passes have no document overflow.
- At 390 px, crowded monthly axes reduce labels to a balanced
  `Jan · Mar · May · Jul · Sep · Dec` sequence. Long horizontal categories
  balance across at most two lines before ellipsizing, keeping more width for
  the plot without collisions; tooltips remain fully inside the viewport.
- A year heatmap retains a readable minimum square cell size and scrolls inside
  its host instead of clipping or widening the page.
- Heatmap intensity legends sit 12 px below the final cell row and render the
  complete configured palette. Seven, ten, or larger palettes compress their
  swatches to the available width without changing the first/lowest color.
- The release gate passes 100% statement, branch, function, and line coverage,
  browser performance budgets, types, lint, and production builds.

## Demo narrative

- The page opens with a product promise—charts that belong in the surrounding
  interface—before SVG, dependencies, accessibility, or implementation details.
- The exact positioning line, `Charts that belong in your product`, is repeated
  in the document title and hero instead of being diluted into a neighboring
  claim. The page doesn't restate it in a second manifesto section; the live
  product preview supplies the proof.
- The hero follows an editorial rather than generic SaaS composition: concise
  product copy forms one rail, while a complete live analytics workspace
  occupies the larger canvas. The product is evidence, not decoration.
- The direct language and asymmetric product-first composition borrow
  Basecamp's character; system typography, adaptive color, clear hierarchy,
  legible controls, and restrained depth follow Apple platform norms.
- Library facts live inside the product preview as a compact technical footer:
  proof for the curious, not another marketing section competing for attention.
- Navigation stays visually quiet and product surfaces remain opaque. Blur and
  translucency don't compete with labels, axes, or chart marks.
- Product examples are grouped by the question they answer: trends,
  comparisons, composition, activity, and explicitly frameless presentation.
  Their chapter headings are written as real product questions rather than
  chart taxonomy. Numbers and explanatory subtitles are omitted so the user's
  job stays ahead of the implementation type without creating extra hierarchy.
- The type index presents the four real visual families in one desktop row.
  Family width follows the number of contained forms, while section height and
  per-type density remain consistent; the families share one outer surface
  with internal dividers. Frameless presentation is demonstrated
  later as configuration rather than mislabeled as a fifth family.
- Family icons use one 64×40 coordinate system, shared line weights, guide
  color, corner treatment, and primary/secondary palette. All links and icons
  have identical rendered dimensions; hover changes color and position without
  enclosing long type names in undersized cards.
- The separate chart laboratory removes QA evidence and terminology from the
  product narrative entirely. It groups
  all 26 product and edge-case fixtures by renderer, exposes stable fixture IDs,
  and serves as the canonical surface for QA and regression inspection.
- The final developer block uses the target named fluent definition, shows the
  short chart-wide happy path first, and discloses update and destruction only
  afterward. Quick-start and source links sit beside that real API example
  instead of creating a second promotional ending.

## Apple HIG alignment

| Guidance                                                                                                 | Implementation                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Charts](https://developer.apple.com/design/human-interface-guidelines/charts)                           | Familiar and combined marks, consistent axes/grid, descriptive semantics, visible main message without requiring interaction, multi-series details on demand, keyboard navigation. |
| [Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data)             | Common chart types, shared hierarchy, details on demand, continuity between related charts.                                                                                        |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)             | Named/described SVG groups, labeled marks, one tab stop per chart, keyboard parity, no required motion.                                                                            |
| [Color](https://developer.apple.com/design/human-interface-guidelines/color)                             | Contrast-aware default palette, dark/high-contrast tokens, line dash patterns so multiple line series do not depend on color alone.                                                |
| [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection) | Predictable roving focus, focus halo, persistent selected state, explicit clear action.                                                                                            |
| [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)       | Shared hover/pressed feedback, contiguous category hit bands, and 44 px targets for compact point marks.                                                                           |
| [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)                           | Brief feedback transitions only when reduced motion is not requested.                                                                                                              |

## Timesheet consistency decision

The following matrix is a heuristic review through each design approach, not a
claim of personal approval by the named designers.

| Approach                                                                                                                                   | Score after correction | Decision applied to Timesheet                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artemy Lebedev                                                                                                                             |                   9/10 | Remove exceptional decoration: interval marks use the same square bar geometry as the rest of the library, and the chart contains no redundant tooltip fields.                                             |
| [Apple HIG — Charts](https://developer.apple.com/design/human-interface-guidelines/charts)                                                 |                   9/10 | Data stays visually prominent; the time axis uses familiar ticks at the bottom, grid weight matches Cartesian charts, and the entire row is an inspectable target instead of requiring precision pointing. |
| [Microsoft Fluent — Tooltip](https://fluent2.microsoft.design/components/web/react/core/tooltip/usage)                                     |                   9/10 | Hover and focus reveal the same concise tooltip at one stable anchor. Pointer-down and click do not move it.                                                                                               |
| [Tognazzini / Nielsen Norman — Consistency and standards](https://media.nngroup.com/media/articles/attachments/Heuristic_4_compressed.pdf) |                   9/10 | The row-sized target reduces acquisition cost; bar geometry, axis placement, grid, tooltip hierarchy, and state feedback reuse learned behavior from existing charts.                                      |

The resulting contract is explicit:

1. Timesheet intervals are rectangular by default, like regular bar marks.
2. Every task row is the hit region; the narrow interval is only the visual mark.
3. Tooltip content is one shared-system row: `date range` plus bold `duration`,
   under the task heading. Group remains available in accessible and selection
   data without creating a fourth visual value.
4. Time ticks and the axis are at the bottom, matching the Cartesian x-axis.
5. Vertical and horizontal guides use the standard `charts2-grid` tokens and
   respect `showGrid`; the baseline respects `showAxes`.
6. Hover, pointer-down, click, focus, and keyboard selection reuse the interval
   midpoint as one tooltip anchor, preventing state-change jumps.

## Heatmap layout decision

This matrix records the design lenses used for the responsive calendar decision;
it does not claim endorsement by the named people or organizations.

| Lens                                                                                                                                               | Relevant principle                                                                   | Applied decision                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Apple HIG — Charts](https://developer.apple.com/design/human-interface-guidelines/charts)                                                         | Size the chart for its content and preserve a clear reading of the data.             | The plot owns the available width, keeps square days, and derives height from its responsive calendar bands.                                                                               |
| [Nielsen Norman Group — Horizontal scrolling](https://www.nngroup.com/articles/horizontal-scrolling/)                                              | Hidden horizontal content is easy to miss and costly to navigate.                    | The default calendar never requires horizontal scrolling; its continuous week sequence wraps into horizontal bands.                                                                        |
| [GitHub contribution calendar](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/viewing-contributions-on-your-profile) | A familiar calendar heatmap maps activity to real dates and weekdays.                | Cells are placed by the actual UTC calendar weekday rather than by input-array index.                                                                                                      |
| [D3 calendar](https://observablehq.com/@d3/calendar/2)                                                                                             | Calendar geometry should be derived from fixed relationships between days and weeks. | Every visible day is a square; week columns preserve seven consistent weekday rows across band wraps.                                                                                      |
| [Cal-Heatmap](https://cal-heatmap.com/docs/options/subDomain)                                                                                      | Calendar domains and subdomains should be explicit rather than incidental.           | Missing days in the requested interval become zero-valued cells rather than collapsing the continuous domain.                                                                              |
| Artemy Lebedev, [§168](https://www.artlebedev.ru/kovodstvo/sections/168/)                                                                          | Interactive targets need a practical minimum size.                                   | The layout prefers 16 px days while space allows, then wraps full week columns into another band; exceptionally narrow containers shrink further to honor the explicit no-scroll contract. |

The resulting contract is: one adaptive horizontal field without month labels
or section gaps, no internal outer padding, no horizontal scroll, continuous
dates, square cells, and intrinsic height. `HeatmapChartBuilder.height()` is
intentionally unavailable.

## Current release plan

1. Keep `core/Chart` as the only DOM/render/lifecycle owner.
2. Require new types to add geometry inside an existing strategy family or
   explicitly justify a new family.
3. Block changes that introduce a second tooltip, container, resize listener,
   interaction state machine, or serialization/download path.
4. Run `npm run check` and the 105-test Chromium visual audit
   before release.

## Future plan

1. Add increased-contrast visual baselines to the existing desktop/mobile,
   light/dark, and interaction-state matrix.
2. Add VoiceOver and Switch Control manual release checklists on macOS and iOS.
3. Add RTL gallery fixtures without reversing numeric progression.
4. Add optional textures for bar/radial series when many datasets
   make labels or direct annotations insufficient.
5. Add virtualized/nearest-point inspection guidance for scatter, bubble, and
   heatmap datasets above practical SVG-node limits.
6. Add empty/loading/error presentation strategies with the same accessible
   descriptive contract.
7. Consider optional interactive legend filtering while preserving the current
   consistent static legend as the default.
8. Keep animations opt-in, interruptible, and covered by reduced-motion tests.

The architectural flow and non-negotiable ownership rules are in
[ARCHITECTURE.md](./ARCHITECTURE.md).

## Legend and line-marker refinement — 2026-09-05

Following Apple HIG’s data-first hierarchy, categorical legends sit below the
plot with a compact symbol beside each label, an 8 px symbol-to-label gap, a 16 px
item gap, and 20 px row pitch. Items follow measured text widths without fixed
columns. Narrow containers wrap complete items and truncate labels with full text
in SVG titles. Continuous heatmap scales keep their quantitative encoding.

All categorical legends use 8 px color dots, including mixed charts. The legend
explains the mapping from color to series, with one compact visual vocabulary.
This is an explicit product choice: Microsoft's chart-shaped samples convey
additional encoding, but the library prioritizes consistent color keys. Long
strips above labels are not the default. Line patterns remain in the plot.
Cartesian, radar, and
composition renderers share `chartContentLayout`; `seriesContentLayout` supplies
common series visibility and labels. The legend renderer consumes these measured
positions instead of recalculating them.

Default line points use a 3 px radius, 2 px outline, and 3 px separator stroke.
Explicit dot sizes, scatter marks, inspection regions, keyboard navigation, and
selection behavior remain unchanged. This refines the existing defaults without
adding public methods or assigning business importance to a dataset’s position.

### Placement review

These are applications of published principles, not personal endorsements.

| Lens                                            | Decision for Orchid Charts                                                                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple HIG, Charts                               | Use one predictable bottom legend; reserve its full wrapped height and keep axis labels in the plot's own content area. HIG does not mandate bottom placement.                                     |
| Microsoft, Office data visualization guidelines | Chart-shaped samples are a documented alternative to our chosen uniform color key. Bottom placement is an intentional library-wide choice rather than Microsoft's default top-left recommendation. |
| Artemy Lebedev, §136 Theory of proximity        | Keep each symbol close to its label and separate neighboring items by a consistent gap.                                                                                                            |
| Datawrapper, line chart guidance                | Retain a compact shared key on narrow screens rather than forcing direct labels into crowded series endpoints.                                                                                     |

Sources: [Apple](https://developer.apple.com/design/human-interface-guidelines/charts),
[Microsoft](https://learn.microsoft.com/en-us/office/dev/add-ins/design/data-visualization-guidelines),
[Lebedev](https://www.artlebedev.ru/kovodstvo/sections/136/),
[Datawrapper](https://academy.datawrapper.de/article/129-what-to-consider-when-creating-line-charts).
