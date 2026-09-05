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
5. Every JavaScript module and test uses PascalCase. `index.js` and
   tool-mandated `*.config.js` names are conventional exceptions.
6. Renderer roles are explicit: `*Renderer.js` exports one matching stateful
   class, while `*Rendering.js` exports named rendering functions and has no
   default export. A rendering module may keep private implementation classes.
7. Directories group cohesive reasons to change: authoring DSL, chart-family
   rendering, geometry, or presentation. Generic `helpers`, `utils`, `concerns`,
   `classes`, and `functions` directories are prohibited.
8. Classes, types, interfaces, and filenames use PascalCase; functions and variables use
   camelCase; constants use SCREAMING_SNAKE_CASE; CSS classes and URLs use
   kebab-case.

The architecture fitness suite rejects new application methods beginning with
`get` or `set`. ESLint separately enforces filename case, abbreviation policy,
JSDoc completeness, dependency cycles, and complexity budgets.

## Complete module review

| Module                                              | Decision                                                                                | Reason                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.js`                                          | Export frozen named chart definitions                                                   | One obvious definition per visual grammar; autocomplete narrows the valid fluent vocabulary                 |
| `core/ChartDefinition.js`                           | Add `ChartDefinition`                                                                   | Owns one immutable `make(parent)` entry and creates a fresh type-specific builder                           |
| `core/builders/Builder.js`                          | Add builder foundation                                                                  | Owns copied authoring state, single-use lifecycle, precedence, and detached scene compilation               |
| `index.d.ts`                                        | Rename `getDataPoint` to `point`; infer its result from chart data                      | `chart.point(0)` is terse domain language and needs no consumer cast                                        |
| `core/Chart.js`                                     | Keep `Chart`; rename `getDataPoint` → `point`, `setupInteractions` → `bindInteractions` | The façade owns one lifecycle; commands and query read naturally                                            |
| `core/ChartData.js`                                 | Keep `ChartData`; rename `getPoint` → `pointAt`                                         | The class owns atomic normalized state; indexed lookup is explicit without `get`                            |
| `core/ChartSelection.js`                            | Keep `ChartSelection`; rename `resolveMark` → `from`                                    | The snapshot-bound presenter reads as `selection.from(mark)`                                                |
| `core/ChartTooltip.js`                              | Keep                                                                                    | `show`, `hide`, `destroy`, `renderContent`, and `positionWithinViewport` state intent and effect            |
| `core/Options.js`                                   | Keep                                                                                    | Validation, dimensions, presentation defaults, and normalization are one option pipeline                    |
| `support/Normalize.js`                              | Keep                                                                                    | `normalize…`, `validate…`, and `requireFiniteNumber` use established boundary vocabulary                    |
| `support/geometry/Math.js`                          | Keep as a geometry facade                                                               | Focused geometry modules own the implementations while consumers use one vocabulary                         |
| `support/geometry/Scale.js`                         | Extract                                                                                 | Numeric scale vocabulary is cohesive and independent from SVG path construction                             |
| `support/geometry/CartesianGeometry.js`             | Extract                                                                                 | Line and bar path names form one Cartesian geometry vocabulary                                              |
| `support/geometry/SectorGeometry.js`                | Extract                                                                                 | Polar point, ring, sector, and padding names form one radial geometry vocabulary                            |
| `support/presentation/Presentation.js`              | Rename `formattedCategoryLabel` → `formatCategoryLabel`; keep remaining names           | Formatting is an action; layout/padding functions return policies named as nouns                            |
| `core/InteractionController.js`                     | Rename `getLabel` → `labelFor`, `setBooleanAttribute` → `reflectBoolean`                | It lives beside its lifecycle owner; callback and private effect describe purpose without accessor prefixes |
| `renderers/ChartRendering.js`                       | Keep `renderChart`                                                                      | `Rendering` identifies the named functional boundary                                                        |
| `renderers/SvgSurface.js`                           | Add narrow behavioral class                                                             | `append`, `mark`, and `text` read as drawing commands and avoid a generic context bag                       |
| `renderers/cartesian/CartesianRendering.js`         | Export family strategies; keep its coordinator private                                  | It creates a layout once and passes explicit `chart`, `layout`, and `surface` collaborators                 |
| `renderers/cartesian/CartesianLayout.js`            | Add behavioral layout                                                                   | `pointAt`, `barFor`, and `inspectorAt` answer domain geometry questions at readable call sites              |
| `renderers/cartesian/CartesianAxesRenderer.js`      | Narrow responsibility                                                                   | It now owns only grid, axes, annotations, and labels                                                        |
| `renderers/cartesian/CartesianInspectorRenderer.js` | Add                                                                                     | Category hit targets and tooltip rows change independently from axis presentation                           |
| `renderers/cartesian/CartesianSeriesRendering.js`   | Keep as named rendering functions                                                       | Series strategies are stateless effects and do not pretend to export a renderer class                       |
| `renderers/composition/AggregationRendering.js`     | Export the family strategy; keep its renderer private                                   | It asks `Composition` for normalized parts and shapes instead of calculating sectors while drawing          |
| `renderers/composition/Composition.js`              | Add behavioral composition                                                              | `parts`, `shareOf`, and `sectors` express part-to-whole vocabulary without SVG nodes                        |
| `renderers/LegendRendering.js`                      | Export the shared rendering function                                                    | Stateless color-key rendering uses one shared measured layout                                               |
| `renderers/temporal/HeatmapRendering.js`            | Export the family strategy; keep its renderer private                                   | Layout is a per-render query, while the private class owns calendar rendering behavior                      |
| `renderers/temporal/TimesheetRendering.js`          | Export the family strategy; keep its renderer private                                   | It draws the time-range grammar without owning scale or row calculations                                    |
| `renderers/temporal/TimesheetLayout.js`             | Add behavioral layout                                                                   | `tickAt` and `taskAt` replace a large renderer argument bag with domain questions                           |
| `renderers/composition/RadarRendering.js`           | Export the family strategy; keep its renderer private                                   | Dataset-comparison radial grammar has an unambiguous domain name                                            |
| `renderers/composition/PolarAreaRendering.js`       | Export the family strategy; keep its renderer private                                   | Radius-encoded sectors differ from radar and composition charts                                             |
| `support/Constants.js`                              | Keep                                                                                    | Frozen enums and immutable arrays form the closed runtime vocabulary                                        |
| `support/Dom.js`                                    | Keep                                                                                    | Small names such as `svg` and `titled` make renderer call sites compact and readable                        |
| `support/presentation/Time.js`                      | Keep                                                                                    | Tick and formatting names match the time domain without wrapper classes                                     |
| `styles.css`                                        | Keep                                                                                    | Public `charts2-…` names form the stable visual/interaction namespace                                       |

## Rejected mechanical renames

The audit explicitly rejects expanding every pure function into names such as
`createSvgElement`, `calculateExtent`, or `createLinePath`. Those prefixes repeat
the return type, make renderer code noisy, and do not improve domain meaning.
Likewise, `ChartOptions`, `RendererContext`, `ChartRenderer`, and
`ChartIdSequence` remain deleted: names cannot rescue classes that own no useful
state or behavior.
