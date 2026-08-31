# Naming audit

This audit applies a Laravel-style developer-experience lens to every production
module. It is an interpretation of Taylor Otwell's public framework conventions,
not a claim of personal approval. The deciding test is the call site: a method
should read as domain language, expose one obvious path, and avoid ceremony.

## Rules

1. Public authoring reads as a short sentence:
   `LineChart.make(parent).dataset(values).gradient().render()`. Mounted
   lifecycle remains `chart.point(0)`, `chart.update(data)`, `chart.toSvg()`,
   and `chart.download(name)`.
2. Application methods never use Java-style `getThing()` or `setThing()` names.
   Native Web API calls such as `getAttribute()` and `setAttribute()` retain the
   browser vocabulary. Property accessors remain nouns, for example
   `chart.element` and `model.datasets`.
3. A noun names a value or policy (`extent`, `legendLayout`, `valueScale`); a
   verb names an effect or transformation (`render`, `normalize`, `download`).
   Prefixes such as `create` and `calculate` are not added mechanically.
4. Domain terms win over generic technical terms. Short mathematical coordinates
   such as `x`, `y`, `cx`, and `cy` stay short because expansion reduces clarity.
5. A class name must describe owned state or cohesive behavior. A file containing
   one class uses the same words in PascalCase.
6. Every JavaScript module and test uses PascalCase, including functional and
   policy modules such as `Options.js`, `Math.js`, and `Render.js`. `index.js`
   and tool-mandated `*.config.js` names are conventional exceptions.
7. Classes, types, and interfaces use PascalCase; functions and variables use
   camelCase; constants use SCREAMING_SNAKE_CASE; CSS classes and URLs use
   kebab-case.

The architecture fitness suite rejects new application methods beginning with
`get` or `set`. ESLint separately enforces filename case, abbreviation policy,
JSDoc completeness, dependency cycles, and complexity budgets.

## Complete module review

| Module                                    | Decision                                                                                | Reason                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.js`                                | Export frozen named chart definitions                                                   | One obvious definition per visual grammar; autocomplete narrows the valid fluent vocabulary                 |
| `core/ChartDefinition.js`                 | Add `ChartDefinition`                                                                   | Owns one immutable `make(parent)` entry and creates a fresh type-specific builder                           |
| `core/Builder.js`                         | Add builder foundation                                                                  | Owns copied authoring state, single-use lifecycle, precedence, and detached scene compilation               |
| `index.d.ts`                              | Rename `getDataPoint` to `point`; infer its result from chart data                      | `chart.point(0)` is terse domain language and needs no consumer cast                                        |
| `core/Chart.js`                           | Keep `Chart`; rename `getDataPoint` → `point`, `setupInteractions` → `bindInteractions` | The façade owns one lifecycle; commands and query read naturally                                            |
| `core/ChartData.js`                       | Keep `ChartData`; rename `getPoint` → `pointAt`                                         | The class owns atomic normalized state; indexed lookup is explicit without `get`                            |
| `core/ChartSelection.js`                  | Keep `ChartSelection`; rename `resolveMark` → `from`                                    | The snapshot-bound presenter reads as `selection.from(mark)`                                                |
| `core/ChartTooltip.js`                    | Keep                                                                                    | `show`, `hide`, `destroy`, `renderContent`, and `positionWithinViewport` state intent and effect            |
| `core/Options.js`                         | Keep                                                                                    | Validation, dimensions, presentation defaults, and normalization are one option pipeline                    |
| `core/NextChartId.js`                     | Keep                                                                                    | A direct function is clearer than a sequence class or service                                               |
| `support/Normalize.js`                    | Keep                                                                                    | `normalize…`, `validate…`, and `requireFiniteNumber` use established boundary vocabulary                    |
| `support/Math.js`                         | Keep as a compatibility facade                                                          | Existing imports remain stable while focused geometry modules own the implementations                       |
| `support/Scale.js`                        | Extract                                                                                 | Numeric scale vocabulary is cohesive and independent from SVG path construction                             |
| `support/CartesianGeometry.js`            | Extract                                                                                 | Line and bar path names form one Cartesian geometry vocabulary                                              |
| `support/SectorGeometry.js`               | Extract                                                                                 | Polar point, ring, sector, and padding names form one radial geometry vocabulary                            |
| `support/Presentation.js`                 | Rename `formattedCategoryLabel` → `formatCategoryLabel`; keep remaining names           | Formatting is an action; layout/padding functions return policies named as nouns                            |
| `core/InteractionController.js`           | Rename `getLabel` → `labelFor`, `setBooleanAttribute` → `reflectBoolean`                | It lives beside its lifecycle owner; callback and private effect describe purpose without accessor prefixes |
| `renderers/Render.js`                     | Keep `renderChart`; name collaborators `chart` and `surface`                            | Closed dispatch is a direct effect; names state what each boundary owns                                     |
| `renderers/SvgSurface.js`                 | Add narrow behavioral class                                                             | `append`, `mark`, and `text` read as drawing commands and avoid a generic context bag                       |
| `renderers/CartesianRenderer.js`          | Keep as concise coordinator                                                             | It creates a layout once and passes explicit `chart`, `layout`, and `surface` collaborators                 |
| `renderers/CartesianLayout.js`            | Add behavioral layout                                                                   | `pointAt`, `barFor`, and `inspectorAt` answer domain geometry questions at readable call sites              |
| `renderers/CartesianAxesRenderer.js`      | Narrow responsibility                                                                   | It now owns only grid, axes, annotations, and labels                                                        |
| `renderers/CartesianInspectorRenderer.js` | Add                                                                                     | Category hit targets and tooltip rows change independently from axis presentation                           |
| `renderers/CartesianSeriesRenderer.js`    | Keep                                                                                    | Owns line, area, point, scatter, and bar data-mark layers                                                   |
| `renderers/AggregationRenderer.js`        | Keep as DOM presenter                                                                   | It asks `Composition` for normalized parts and shapes instead of calculating sectors while drawing          |
| `renderers/Composition.js`                | Add behavioral composition                                                              | `parts`, `shareOf`, and `sectors` express part-to-whole vocabulary without SVG nodes                        |
| `renderers/LegendRenderer.js`             | Keep                                                                                    | Shared legend state and item rendering form one cohesive collaborator                                       |
| `renderers/HeatmapRenderer.js`            | Rename `createLayout` → `layout`; keep class                                            | Layout is a per-render query, while the class owns calendar rendering behavior                              |
| `renderers/TimesheetRenderer.js`          | Keep as DOM presenter                                                                   | It draws the time-range grammar without owning scale or row calculations                                    |
| `renderers/TimesheetLayout.js`            | Add behavioral layout                                                                   | `tickAt` and `taskAt` replace a large renderer argument bag with domain questions                           |
| `renderers/RadarRenderer.js`              | Keep                                                                                    | Dataset-comparison radial grammar has an unambiguous domain name                                            |
| `renderers/PolarAreaRenderer.js`          | Keep                                                                                    | Radius-encoded sectors differ from radar and composition charts                                             |
| `support/Constants.js`                    | Keep                                                                                    | Frozen enums and immutable arrays form the closed runtime vocabulary                                        |
| `support/Dom.js`                          | Keep                                                                                    | Small names such as `svg` and `titled` make renderer call sites compact and readable                        |
| `support/Time.js`                         | Keep                                                                                    | Tick and formatting names match the time domain without wrapper classes                                     |
| `styles.css`                              | Keep                                                                                    | Public `charts2-…` names form the stable visual/interaction namespace                                       |

## Rejected mechanical renames

The audit explicitly rejects expanding every pure function into names such as
`createSvgElement`, `calculateExtent`, or `createLinePath`. Those prefixes repeat
the return type, make renderer code noisy, and do not improve domain meaning.
Likewise, `ChartOptions`, `RendererContext`, `ChartRenderer`, and
`ChartIdSequence` remain deleted: names cannot rescue classes that own no useful
state or behavior.
