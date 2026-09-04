# Charts2 fluent API specification

Status: accepted target contract for the next public release  
Implementation status: implemented and verified across runtime, declarations,
documentation, demo, tests, and the packed artifact.
Compatibility: the release version is chosen only after the coherence gate in
section 20 passes

The words “small API” mean one small grammar, not one generic options object.
The twelve named definitions narrow autocomplete to the concepts supported by
that chart while preserving the same creation, data, presentation, and
lifecycle vocabulary.

If a feature can be expressed as a convention for the whole chart, the public
API MUST express it directly on the chart builder. Users MUST NOT have to open
an options object or visit every dataset to choose a palette, height, gradient,
orientation, stacking, or a frameless presentation. The library owns those
decisions and applies them consistently.

## 1. Product contract: the 95% path

This is the canonical Charts2 experience and MUST be the first API example in
the README, package documentation, and demo source:

```js
import { LineChart } from "@orchid/charts";
import "@orchid/charts/style.css";

const chart = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar"])
  .dataset([42, 48, 57])
  .colors(["#00bdff", "#1b3bff", "#8f00ff", "#ff0011"])
  .height(300)
  .gradient()
  .render();
```

This example establishes binding product rules:

- chart-level methods configure the whole chart;
- adding another series means repeating `dataset(name, values)`; it consumes
  the next palette color and does not introduce a nested data structure;
- for categorical charts, `colors()` assigns colors to the family-specific
  ordered positions in section 7.1 and cycles when the palette is shorter than
  those positions; heatmaps use the supplied colors once as a low-to-high
  intensity scale;
- `height(300)` means exactly `300` CSS pixels;
- `gradient()` enables the fill gradient for every eligible line in a
  `LineChart`, and for every line dataset in a `MixedChart`;
- a local dataset callback is an advanced exception, never a requirement for
  applying a chart-wide setting;
- defaults MUST produce a finished chart without requiring the caller to set
  up axes, tooltip, legend, accessibility, or responsiveness.

The public documentation MUST disclose features progressively in this order:

1. `make`, data, `colors`, dimensions, chart-wide conventions, `render`;
2. local dataset customization;
3. updates, selection, export, and cleanup;
4. annotations and scoped formatting.

Advanced examples MUST NOT replace or precede the canonical example.

### 1.1 The vocabulary a user is expected to remember

For the common product charts, the complete mental model MUST fit in this
sentence:

> Choose a chart, point it at an element, give it labels and values, optionally
> choose whole-chart appearance, then render it.

The corresponding vocabulary is deliberately small:

```text
LineChart.make(parent)
  .labels(labels)
  .dataset(values)
  .colors(colors)
  .height(pixels)
  .gradient()
  .render()
```

Only `make`, one data method, and `render` are lifecycle steps. Everything
between data and `render` is optional product language. `colors()` MUST assign
the supplied colors in order according to section 7.1; callers MUST NOT loop
over datasets to apply a palette. `gradient()` MUST enable the chart-wide line
gradient; callers MUST NOT repeat it for every line. Enabling a boolean
convention MUST use the zero-argument form, such as `gradient()`, `horizontal()`,
`stacked()`, `smooth()`, or `frameless()`. The boolean argument exists for
conditional code and explicit disabling, not as the preferred documentation
form.

No documentation for an ordinary chart MAY introduce an options bag, generic
configuration method, builder `.end()`, `get*`, `set*`, `enable*`, or `add*`
vocabulary. Autocomplete on a type-specific builder MUST show only operations
that can affect that chart family.

### 1.2 Simplicity budget and no-documentation contract

The smallest useful chart MUST remain smaller than the canonical example:

```js
LineChart.make("#revenue").dataset([42, 48, 57]).render();
```

Generated labels, responsive width, accessible text, axes, value labels,
tooltip, and the default palette MUST make this a finished chart. The minimum
useful chains for the other data grammars are:

```js
BarChart.make("#regions").labels(regions).dataset(values).render();
ScatterChart.make("#results").dataset(points).render();
MixedChart.make("#plan").bar("Actual", actual).line("Target", target).render();
PieChart.make("#share").labels(labels).dataset(values).render();
HeatmapChart.make("#activity").points(activity).render();
TimesheetChart.make("#plan").task("Design", start, end).render();
```

Sibling definitions MUST require no additional setup. The first README
viewport MUST contain installation, imports, and one complete result with no
scoped callback, input object, formatter, or lifecycle explanation between the
user and `render()`.

Every built-in convention that can apply to a complete chart MUST have a
chart-level domain method. A dataset callback MAY override that convention for
one dataset, but MUST NOT be the only way to enable it. Advanced capability
MUST NOT add a step to any minimum useful chain.

Before release, a maintainer who has not worked on the fluent API MUST be able
to render a line chart, bar chart, and heatmap using only the definition name,
TypeScript autocomplete, and method signatures. The attempt MUST start from an
empty call site, MUST NOT use documentation or source code, and MUST complete
without a naming hint. A method name that fails this cold-use check blocks the
release even when its behavior is otherwise conforming.

Charts2 MUST NOT expose a plugin system, public registry, hook pipeline, custom
renderer, custom layout, DOM/SVG callback, or generic `configure`, `options`,
`use`, or `extend` escape hatch. A new public method is admissible only when it
names a recurring product-chart task, belongs to one clear scope, and cannot be
served by an existing convention. The package is a finished tool, not a
visualization framework.

### 1.3 Product-demo translation gate

The product demo is the source of common jobs, not a showcase exempt from API
simplicity. Its ordinary hand-authored scenarios MUST translate to the target
grammar without nested presentation objects:

```js
LineChart.make("#subscribers")
  .labels(months)
  .dataset("Free", free)
  .dataset("Individual", individual)
  .dataset("Family", family)
  .colors(["#2490ef", "#af52de", "#ff9500"])
  .height(300)
  .gradient()
  .render();

BarChart.make("#orders")
  .labels(channels)
  .dataset("Shipped", shipped)
  .dataset("Processing", processing)
  .dataset("Delayed", delayed)
  .horizontal()
  .stacked()
  .render();

LineChart.make("#spark").dataset(values, "#2490ef").height(90).gradient().frameless().render();
```

These examples are acceptance fixtures. Equivalent demo migrations MUST NOT
expand `.gradient()` into per-dataset calls, `.frameless()` into individual
visibility switches, or `.horizontal()` and `.stacked()` into nested option
groups. Bubble points, heatmap points, timesheet tasks, and atomic `update()`
data MAY remain plain data objects because their object shapes are domain data,
not configuration ceremony.

## 2. Conformance

The uppercase terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD
NOT**, and **MAY** are normative as defined by RFC 2119 and RFC 8174.

An implementation conforms only when its JavaScript, TypeScript declarations,
documentation, and tests implement every requirement in this document.
[FLUENT_API_REVIEW.md](./FLUENT_API_REVIEW.md) is non-normative and MUST NOT
override this specification.

## 3. Package exports

The package MUST export these immutable chart definitions:

```js
import {
  LineChart,
  BarChart,
  ScatterChart,
  MixedChart,
  BubbleChart,
  PieChart,
  DonutChart,
  PercentageChart,
  RadarChart,
  PolarAreaChart,
  HeatmapChart,
  TimesheetChart,
} from "@orchid/charts";
```

Each definition MUST be frozen and expose only this creation method:

```ts
interface ChartDefinition<TBuilder> {
  make(parent: string | Element): TBuilder;
}
```

Definitions MUST NOT be constructors. The package MUST NOT export
`createChart`, a public `Chart` constructor, `Chart.make(type, ...)`, or public
chart constructors. The stylesheet MUST remain importable from
`@orchid/charts/style.css`.

### 3.1 Public value types

The package MUST export the following types. The string values are exhaustive.

```ts
type ChartType =
  | "line"
  | "bar"
  | "scatter"
  | "mixed"
  | "bubble"
  | "pie"
  | "donut"
  | "percentage"
  | "radar"
  | "polar-area"
  | "heatmap"
  | "timesheet";

interface Point {
  x: number;
  y: number;
}

interface BubblePoint extends Point {
  r: number;
}

type TimesheetDate = Date | string | number;

interface TimesheetTaskInput {
  label: string;
  start: TimesheetDate;
  end: TimesheetDate;
  group?: string;
  color?: string;
}

interface SeriesData<TDatasetInput extends DatasetInput = AnyDatasetInput> {
  labels?: readonly string[];
  datasets: readonly TDatasetInput[];
}

interface CartesianSeriesData<
  TDatasetInput extends DatasetInput = AnyDatasetInput,
> extends SeriesData<TDatasetInput> {
  markers?: readonly MarkerInput[];
  regions?: readonly RegionInput[];
}

interface HeatmapData {
  start?: Date;
  end?: Date;
  points: Readonly<Record<string | number, number>>;
}

interface TimesheetData {
  start?: TimesheetDate;
  end?: TimesheetDate;
  tasks: readonly TimesheetTaskInput[];
}

interface SeriesPointSnapshot {
  index: number;
  label: string | number;
  values: readonly (number | undefined)[];
}

interface SeriesMarkSnapshot {
  index: number;
  datasetIndex: number;
  dataset: string;
  pointIndex: number;
  label: string | number;
  x: number;
  y: number;
  r?: number;
  chartType?: "line" | "bar" | "scatter";
}

interface HeatmapPointSnapshot {
  date: Date;
  key: string;
  value: number;
}

interface TimesheetPointSnapshot {
  label: string;
  start: Date;
  end: Date;
  group?: string;
  color: string;
}

interface TimesheetTaskSnapshot {
  label: string;
  start: Date;
  end: Date;
  group?: string;
  color: string;
}

type ChartPoint = SeriesPointSnapshot | SeriesMarkSnapshot | HeatmapPointSnapshot | TimesheetPointSnapshot;

interface SeriesSelection {
  readonly type: "line" | "bar" | "scatter" | "mixed" | "bubble" | "radar";
  readonly index: number;
  readonly label: string | number;
  readonly value: number;
  readonly values: readonly (number | undefined)[];
  readonly datasetIndex: number;
  readonly dataset: string;
  readonly x: number;
  readonly y: number;
  readonly r?: number;
}

interface CompositionSelection {
  readonly type: "pie" | "donut" | "percentage" | "polar-area";
  readonly index: number;
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

interface HeatmapSelection {
  readonly type: "heatmap";
  readonly index: number;
  readonly key: string;
  readonly date: Date;
  readonly value: number;
  readonly color: string;
}

interface TimesheetSelection {
  readonly type: "timesheet";
  readonly index: number;
  readonly label: string;
  readonly start: Date;
  readonly end: Date;
  readonly duration: number;
  readonly group?: string;
  readonly color: string;
  readonly task: Readonly<TimesheetTaskSnapshot>;
}

type ChartSelection = SeriesSelection | CompositionSelection | HeatmapSelection | TimesheetSelection;

type DateFormatter = (date: Readonly<Date>) => string;
type DurationFormatter = (milliseconds: number) => string;
type LabelFormatter = (
  label: string | number,
  context: Readonly<ChartValueFormatContext>,
) => string | readonly string[];
type AxisValueFormatter = ChartValueFormatter;
type MarkerLabelFormatter = (
  label: string,
  value: number,
  context: Readonly<ChartValueFormatContext>,
) => string;
type RegionLabelFormatter = (
  label: string,
  range: ValueRange,
  context: Readonly<ChartValueFormatContext>,
) => string;
```

Date-time strings MUST include a timezone offset or `Z`. Heatmap day keys use
the timezone-free calendar form `YYYY-MM-DD` and MUST NOT shift with the local
timezone. Numeric dates and durations MUST use milliseconds. Invalid or
timezone-ambiguous date-time strings MUST throw `TypeError`. Snapshot and selection
objects returned to user code MUST be deeply frozen except `Date` instances.
Every exposed `Date` MUST be a fresh copy whose mutation cannot affect chart
state.

## 4. Creation and builder lifecycle

Every chart MUST use this sequence:

```text
chart definition -> make(parent) -> configuration -> render()
```

```js
const chart = LineChart.make("#sales")
  .labels(["Jan", "Feb", "Mar"])
  .dataset("Sales", [1240, 1890, 1650])
  .render();
```

`make(parent)` MUST return a fresh type-specific builder. It MUST store but not
resolve the parent and MUST NOT inspect or mutate the DOM.

`render()` MUST, in order:

1. snapshot builder inputs;
2. normalize and validate parent-independent inputs;
3. resolve and validate the parent;
4. apply defaults, precedence, and parent-dependent dimensions;
5. normalize the complete scene and resolve initial formatted strings;
6. create and atomically mount the chart;
7. consume the builder;
8. return the mounted chart.

A string parent MUST be resolved with `document.querySelector()`. A missing,
syntactically invalid, or non-Element result MUST throw `TypeError`. A
successful commit MUST replace all parent children with chart-owned nodes. A
failure before DOM commit MUST leave the parent and its children unchanged.

Builders MUST be mutable, single-use authoring objects. Fluent methods MUST
return `this`. Scalar calls MUST replace earlier values. Ordered `dataset()`,
`marker()`, `region()`, and `task()` calls MUST append in call order. Other call
order MUST NOT affect output.

Array, object, and `Date` arguments MUST be copied when the fluent method is
called, not deferred until `render()`. Scoped builders passed to callbacks MUST
become invalid when the callback returns; retaining one and calling it later
MUST throw `TypeError` naming its scope.

After successful render, every builder call, including another `render()`, MUST
throw `TypeError`. Inputs MUST be defensively copied before runtime commit;
formatter functions MAY be retained by reference.

A failed `render()` MUST NOT consume the builder. The caller MAY correct its
configuration or parent and call `render()` again.

## 5. Public syntax grammar

Public methods MUST use domain vocabulary. They MUST NOT use ceremonial `get`,
`set`, `add`, `with`, `without`, `begin`, `end`, `build`, or `execute` prefixes
or suffixes. No method MAY accept more than three positional arguments. One
concept MUST have one spelling; aliases are forbidden.

Named datasets, markers, and regions MUST implement this grammar:

```text
method(label, payload)
method(label, payload, color)
method(label, payload, configure)
method(input, configure?)
```

Datasets MUST additionally accept the common single-series shorthand:

```text
dataset(payload)
dataset(payload, color)
dataset(payload, configure)
```

The unnamed shorthand is valid only when the final chart contains exactly one
dataset. A second dataset call, named or unnamed, combined with an unnamed
dataset MUST throw `TypeError` before DOM resolution. The single unnamed
dataset receives the internal accessible name `Series 1`; that generated name
MUST NOT appear in an automatic legend or tooltip. Applications distinguish multiple
series by naming them, but MUST NOT be forced to invent a name for one series.

The first argument MUST be the label, the second the domain payload, a third
string the primary CSS color, and a third function the scoped configurator. The
callback return value MUST be ignored. Callback calls MUST override equivalent
input-object properties. Callback scope MUST return automatically; `.end()` is
forbidden.

```js
.dataset("Sales", sales, "#2563eb")
.marker("Target", 4000, "#94a3b8")
.region("Expected range", [2800, 4000], "#dbeafe")
```

```js
.dataset("Sales", sales, (dataset) => dataset.gradient())
.marker("Target", 4000, (marker) => marker.lineStyle("dashed"))
.region("Expected range", [2800, 4000], (region) =>
  region.opacity(0.08),
)
```

## 6. Mounted chart lifecycle

`render()` MUST return:

```ts
interface Chart<TData, TPoint extends ChartPoint> {
  readonly element: SVGSVGElement;
  update(data: TData): this;
  point(index?: number): TPoint | undefined;
  toSvg(): string;
  download(filename?: string): this;
  destroy(): void;
}
```

The mounted chart MUST NOT expose creation-builder methods. `update()` MUST
replace the complete data scene while preserving chart-level configuration.
Omitting an existing ordered item MUST remove it. A callback-based update DSL
is intentionally absent; ordinary data objects remain the simplest boundary
for live application state.

Updates MUST validate and commit atomically. Failure MUST preserve the previous
scene, SVG, listeners, selection, and tooltip state.

After a successful update, selection MUST follow the same logical item when it
can be identified by type-specific normalized identity; otherwise selection
and keyboard-active state MUST clear. Identity is heatmap key, timesheet task
`label + start + end`, composition label, or series `dataset name + label`.
Composition labels and series identities MUST be unique to be preserved. An
unnamed, missing, or duplicate identity is ambiguous and MUST clear rather than
select the wrong item.

`point()` has one concept across every family: it reads one keyboard-inspectable
unit in navigation order and returns normalized raw data, never display
strings. An aligned series unit is a category snapshot because the inspector
compares its datasets together; an independently positioned series unit is one
mark; a composition unit is one slice or segment; and heatmap and timesheet
units are one cell and one task. `toSvg()` MUST serialize without downloading.
`download()` MUST start an SVG download and return the chart. `destroy()` MUST
be idempotent and release all owned DOM, listeners, tooltip state, and
generated resources. Other methods after destroy MUST throw `TypeError`.

`download(filename)` MUST add `.svg` only when the supplied filename does not
already end in `.svg` case-insensitively. It MUST reject empty names and path
separators. Temporary URLs and nodes MUST be released after the browser has
accepted the download.

`toSvg()` and `download()` MUST produce an SVG whose chart-owned visual
appearance survives when the file is opened without the Charts2 stylesheet or
its original parent. The export MUST materialize the computed values of
chart-owned CSS properties and every CSS custom property used as a color.
Export MUST NOT mutate the mounted SVG. External fonts and caller-owned
backgrounds are outside this guarantee.

`point(index)` MUST reject non-integer or negative indices. An out-of-range
index MUST return `undefined`. With no argument it MUST return the persistently
selected point, then the keyboard-active point, then index `0`, in that order.
Line, bar, radar, and composition charts index category snapshots.
Scatter, bubble, and mixed charts index `SeriesMarkSnapshot` values flattened
in dataset-call order and then point order; each snapshot therefore owns its
own `x` and label even when datasets use different coordinates.
After `destroy()`, `element` MUST retain the detached SVG reference for
inspection and `destroy()` MUST remain a no-op.

## 7. Common configuration

Every chart builder MUST expose:

```ts
interface CommonChartBuilder<TTooltipBuilder, TSelection extends ChartSelection> {
  title(value: string): this;
  description(value: string): this;
  ariaLabel(value: string): this;
  width(value: number): this;
  height(value: number): this;
  colors(values: readonly string[]): this;
  tooltip(visible: boolean): this;
  tooltip(configure: (tooltip: TTooltipBuilder) => void): this;
  onSelect(callback: (selection: TSelection | undefined) => void): this;
}

interface LegendChartBuilder {
  legend(visible: boolean): this;
}
```

`legend()` MUST be present only on line, bar, scatter, mixed, bubble, pie,
donut, percentage, radar, and polar-area builders. It MUST be absent from
heatmap and timesheet builders. Every other method in `CommonChartBuilder`
MUST be present on all twelve builders through their type-specific tooltip
builder. The ten builders with `legend()` MUST also implement
`LegendChartBuilder`.

Omitted width MUST use responsive parent width. Dimensions MUST be positive and
finite. Colors MUST be a non-empty array of supported CSS colors. A tooltip
callback MUST enable the tooltip. `onSelect()` MUST enable persistent
selection. User text MUST be treated as text, never HTML.

`title(value)` MUST render a visible chart heading and use the same text as the
accessible name unless `ariaLabel()` overrides it. Its layout MUST be included
within the declared chart height. `description(value)` is accessible
description text and MUST NOT create a second visible paragraph inside the
SVG. CSS variables passed to color methods MUST resolve to a supported color in
the parent context at render time; an unresolved variable MUST throw
`TypeError` before DOM commit.

An omitted width MUST track the positive content-box width of the parent after
render. Width changes MUST update the chart without replacing the mounted chart
object. An explicit `width()` MUST disable responsive measurement. A temporarily
zero-width parent MUST preserve the last positive layout and retry when the
parent becomes measurable.

### 7.1 Palette semantics

Palette assignment MUST be deterministic and MUST be recomputed from the new
data order after `update()`:

| Family                                   | Palette position                                                     |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Line, bar, scatter, mixed, bubble, radar | dataset call/index order                                             |
| Pie, donut, percentage, polar-area       | label/value index                                                    |
| Heatmap                                  | supplied colors are the complete ordered low-to-high intensity scale |
| Timesheet                                | one encounter-ordered stream of group and ungrouped-task keys        |

For categorical families, the color at position `i` MUST be
`colors[i % colors.length]`. An explicit
dataset, task, or input color MUST override its computed color without shifting
the palette position of later items. The same normalized item MUST use the same
color in its mark, legend, tooltip, selection, accessibility text, and export.

Heatmap MUST use each supplied color once as the complete ordinal intensity
scale and MUST NOT cycle back to the first color. Every first-seen non-empty
timesheet group contributes one palette key at the task where it is first
encountered; every ungrouped task contributes its own key at its encounter
position. A later task in an existing group reuses that group's position and
does not add a key. The zero-based position in this single key stream is the
task's categorical palette index.

## 8. Dataset contract

```ts
type ChartValue = number | Point;

interface SeriesDataBuilder<TDatasetBuilder, TDatasetInput extends DatasetInput> {
  labels(values: readonly string[]): this;
  dataset(values: TDatasetInput["values"]): this;
  dataset(values: TDatasetInput["values"], color: string): this;
  dataset(values: TDatasetInput["values"], configure: (dataset: TDatasetBuilder) => void): this;
  dataset(name: string, values: TDatasetInput["values"]): this;
  dataset(name: string, values: TDatasetInput["values"], color: string): this;
  dataset(name: string, values: TDatasetInput["values"], configure: (dataset: TDatasetBuilder) => void): this;
  dataset(input: TDatasetInput, configure?: (dataset: TDatasetBuilder) => void): this;
}

interface DatasetInput<TValue extends ChartValue = ChartValue> {
  name?: string;
  values: readonly TValue[];
  color?: string;
  opacity?: number;
  formatValue?: DatasetValueFormatter;
}

interface LineDatasetInput extends DatasetInput<number> {
  gradient?: boolean | GradientOptions;
  smooth?: boolean;
  dots?: boolean;
  dotSize?: number;
  line?: boolean;
  area?: boolean;
  strokeWidth?: number;
}

interface BarDatasetInput extends DatasetInput<number> {
  radius?: number;
}

interface ScatterDatasetInput extends DatasetInput<number | Point> {}

interface BubbleDatasetInput extends DatasetInput<BubblePoint> {}

type MixedDatasetInput =
  | (LineDatasetInput & { chartType: "line" })
  | (BarDatasetInput & { chartType: "bar" })
  | (ScatterDatasetInput & { chartType: "scatter" });

type AnyDatasetInput = LineDatasetInput | BarDatasetInput | ScatterDatasetInput | BubbleDatasetInput;

interface DatasetBuilder {
  color(value: string): this;
  opacity(value: number): this;
  formatValue(formatter: DatasetValueFormatter): this;
}

interface BarDatasetBuilder extends DatasetBuilder {
  radius(value: number): this;
}
```

Every call MUST append one dataset. Names are labels, not identifiers. Values
MUST be non-empty and finite after normalization. Call order MUST determine
series, legend, shared-tooltip, and palette order. Opacity MUST be finite from
`0` through `1`.

A numeric scatter value is shorthand for `{ x: index, y: value }`. Object
scatter points MUST provide finite `x` and `y`. Bubble points MUST provide
finite `x`, `y`, and a finite non-negative `r`.

Dataset, marker, region, task, title, description, and ARIA labels MUST reject
an empty or whitespace-only required string. `labels()` MUST defensively copy
its input and MUST reject non-string entries.

Line datasets MUST additionally expose:

```ts
interface LineDatasetBuilder extends DatasetBuilder {
  gradient(value?: boolean | GradientOptions): this;
  smooth(enabled?: boolean): this;
  dots(visible: boolean): this;
  dotSize(value: number): this;
  line(visible: boolean): this;
  area(enabled?: boolean): this;
  strokeWidth(value: number): this;
}

interface GradientOptions {
  fromOpacity?: number;
  toOpacity?: number;
}
```

`gradient()` and `smooth()` without arguments MUST mean `true`. Gradient
opacities MUST be finite from `0` through `1`. Gradient IDs MUST be chart-local
and released by `destroy()`. Non-line datasets MUST NOT expose `gradient()`.

`area()` enables an area fill. `gradient()` enables the area and selects its
gradient fill. `gradient(false)` disables the gradient without enabling an
area; if `area(true)` is also explicit, the area uses a solid fill. An explicit
`area(false)` suppresses both solid and gradient area fills regardless of call
order. These same rules apply to each eligible line dataset in `MixedChart`.

Bar datasets MUST additionally expose `radius(value)`. Radius and stroke width
MUST be finite and non-negative.

The dataset types are exhaustive:

| Chart builder                             | Object input           | Callback argument                        |
| ----------------------------------------- | ---------------------- | ---------------------------------------- |
| Line                                      | `LineDatasetInput`     | `LineDatasetBuilder`                     |
| Bar                                       | `BarDatasetInput`      | `BarDatasetBuilder`                      |
| Scatter                                   | `ScatterDatasetInput`  | `DatasetBuilder`                         |
| Bubble                                    | `BubbleDatasetInput`   | `DatasetBuilder`                         |
| Mixed                                     | `MixedDatasetInput`    | Builder selected by required `chartType` |
| Pie, donut, percentage, radar, polar-area | `DatasetInput<number>` | `DatasetBuilder`                         |

Only mixed datasets MAY contain `chartType`. Every other chart MUST reject that
key.

## 9. Formatting

Formatters MUST change user-facing strings only. They MUST NOT change raw
values, domains, `point()` results, selections, updates, or geometry.

```ts
type ValueFormatTarget = "axis" | "tooltip" | "value-label" | "accessibility";

interface ChartValueFormatContext {
  readonly target: ValueFormatTarget;
  readonly chartType: ChartType;
  readonly datasetIndex?: number;
  readonly datasetName?: string;
  readonly index?: number;
  readonly label?: string | number;
  readonly point?: Readonly<Point>;
}

interface DatasetValueFormatContext extends ChartValueFormatContext {
  readonly target: Exclude<ValueFormatTarget, "axis">;
  readonly datasetIndex: number;
  readonly index: number;
  readonly point: Readonly<Point>;
}

type ChartValueFormatter = (value: number, context: ChartValueFormatContext) => string;

type DatasetValueFormatter = (value: number, context: DatasetValueFormatContext) => string;
```

Cartesian series builders MUST expose:

```ts
formatValue(formatter: ChartValueFormatter): this;
formatLabel(formatter: LabelFormatter): this;
yAxis(configure: (axis: AxisBuilder) => void): this;

interface AxisBuilder {
  position(value: "left" | "right"): this;
  formatValue(formatter: AxisValueFormatter): this;
}

interface SeriesTooltipBuilder {
  formatLabel(formatter: LabelFormatter): this;
  formatValue(formatter: DatasetValueFormatter): this;
}

interface HeatmapTooltipBuilder {
  formatDate(formatter: DateFormatter): this;
  formatValue(formatter: ChartValueFormatter): this;
}

interface TimesheetTooltipBuilder {
  formatDate(formatter: DateFormatter): this;
  formatDuration(formatter: DurationFormatter): this;
}
```

Line, bar, scatter, mixed, bubble, pie, donut, percentage, radar, and
polar-area builders MUST use `SeriesTooltipBuilder`. Heatmap MUST use
`HeatmapTooltipBuilder`. Timesheet MUST use `TimesheetTooltipBuilder`.

Tooltip values MUST use the first defined formatter in this order: dataset,
tooltip, chart, built-in. Value labels and accessibility values MUST use
dataset, chart, built-in. Axis ticks MUST use axis, chart, built-in and MUST NOT
use dataset or tooltip formatters. Tooltip labels MUST use tooltip, chart,
built-in. Axis category labels and visible category labels MUST use chart,
built-in.

Formatters MUST be synchronous and receive frozen context. Value, date, duration,
marker, and region formatters MUST return a string. A label formatter MAY return
a string or a non-empty string array; arrays define explicit lines on category
axes and are joined with spaces on tooltips and other single-line surfaces.
Long phrase labels on horizontal category axes MUST be balanced into at most
three deterministic lines before truncation; rendering MUST NOT depend on
browser-specific SVG text wrapping.
Returned HTML MUST be treated as text. Initial formatters MUST run before DOM
commit. Tooltip-only formatter failure MUST preserve previous tooltip state and
throw an error naming its scope.

## 10. Markers

Cartesian builders MUST expose:

```ts
interface MarkerDataBuilder {
  marker(label: string, value: number): this;
  marker(label: string, value: number, color: string): this;
  marker(label: string, value: number, configure: (marker: MarkerBuilder) => void): this;
  marker(input: MarkerInput, configure?: (marker: MarkerBuilder) => void): this;
}

interface MarkerInput {
  label: string;
  value: number;
  color?: string;
  width?: number;
  opacity?: number;
  lineStyle?: "solid" | "dashed" | "dotted";
  dash?: readonly number[];
  labelPosition?: "start" | "center" | "end";
  labelColor?: string;
  includeInDomain?: boolean;
  formatLabel?: MarkerLabelFormatter;
}

interface MarkerBuilder {
  color(value: string): this;
  width(value: number): this;
  opacity(value: number): this;
  lineStyle(value: "solid" | "dashed" | "dotted"): this;
  dash(pattern: readonly number[]): this;
  labelPosition(value: "start" | "center" | "end"): this;
  labelColor(value: string): this;
  includeInDomain(enabled: boolean): this;
  formatLabel(formatter: MarkerLabelFormatter): this;
}
```

Marker values MUST be finite. Defaults are:

| Property          | Default                                        |
| ----------------- | ---------------------------------------------- |
| Color             | `var(--charts-secondary-label-color, #6e6e73)` |
| Width             | `1` non-scaling CSS pixel                      |
| Opacity           | `1`                                            |
| Line style        | Dashed `[4, 3]`                                |
| Label position    | `end`                                          |
| Include in domain | `true`                                         |

`solid`, `dashed`, and `dotted` MUST resolve to `[]`, `[4, 3]`, and `[1, 3]`
respectively. The default marker label color MUST be
`var(--charts-label-color, #3a3a3c)`.

Custom `dash()` MUST override `lineStyle()` regardless of order. Dash values
MUST be finite and non-negative, and at least one MUST be positive.

A marker MUST be parallel to the category axis: horizontal for line, vertical
bar, scatter, mixed, and bubble charts; vertical for horizontal bar charts.
Logical `start`, `center`, and `end` MUST map to left/middle/right on a
horizontal marker and bottom/middle/top on a vertical marker.

Included markers MUST affect automatic domains. Opted-out markers outside the
domain MUST NOT render. Geometry MUST be plot-clipped. Markers MUST be
non-interactive in `0.0.1`; accessible chart text MUST include label and value.

## 11. Regions

```ts
type ValueRange = readonly [start: number, end: number];

interface RegionDataBuilder {
  region(label: string, range: ValueRange): this;
  region(label: string, range: ValueRange, color: string): this;
  region(label: string, range: ValueRange, configure: (region: RegionBuilder) => void): this;
  region(input: RegionInput, configure?: (region: RegionBuilder) => void): this;
}

interface RegionInput {
  label: string;
  range: ValueRange;
  color?: string;
  opacity?: number;
  labelPosition?: "start" | "center" | "end";
  labelColor?: string;
  includeInDomain?: boolean;
  formatLabel?: RegionLabelFormatter;
}

interface RegionBuilder {
  color(value: string): this;
  opacity(value: number): this;
  labelPosition(value: "start" | "center" | "end"): this;
  labelColor(value: string): this;
  includeInDomain(enabled: boolean): this;
  formatLabel(formatter: RegionLabelFormatter): this;
}
```

A range MUST contain exactly two finite numbers and MUST normalize to ascending
order. Its band MUST use the same orientation rule as a marker. Defaults are
`var(--charts-focus-ring, #007aff)`, opacity `0.08`, label position `end`, label
color `var(--charts-label-color, #3a3a3c)`, and domain inclusion enabled.

Included endpoints MUST affect automatic domains. Opted-out non-overlapping
regions MUST NOT render; partial overlaps MUST be clipped. Regions MUST be
non-interactive in `0.0.1`.

## 12. Cartesian render order

The layer order MUST be grid, regions, marker lines, datasets, region labels,
marker labels, then interaction overlays. Within each layer, DOM order MUST
match call order.

Annotation labels MUST remain inside the plot and MUST resolve collisions
deterministically in layer and call order. A later label MAY move or be omitted,
but collision handling MUST NOT move an earlier label or change values,
geometry, or domains. The exact search step is an implementation detail, not a
public compatibility promise.

## 13. Type-specific method inventory

The inventory is exhaustive. A builder MUST NOT expose an absent method.

Line, bar, scatter, mixed, and bubble MUST expose `labels`, `dataset`, `axes`,
`grid`, `valueLabels`, `frameless`, `formatLabel`, `formatValue`, `yAxis`,
`marker`, and `region`.

```ts
axes(visible: boolean): this;
grid(visible: boolean): this;
valueLabels(visible: boolean): this;
frameless(enabled?: boolean): this;
```

`frameless()` MUST mean `axes(false)`, `grid(false)`, `valueLabels(false)`,
`legend(false)`, `tooltip(false)`, and `dots(false)` where `dots()` exists.
The default argument is `true`. An explicitly called individual setting MUST
override the preset regardless of call order. `frameless(false)` restores
ordinary defaults but MUST NOT erase explicit individual settings.

On `MixedChart`, `frameless()` MUST suppress dots for every eligible line and
scatter dataset even though Mixed does not expose chart-level `dots()`. A local
dataset callback that exposes and explicitly enables dots MUST override the
preset for that dataset.

Line, bar, and mixed datasets MUST contain the same number of values as
`labels()`. Scatter and bubble values MUST be `Point` objects with finite `x`
and `y`, except for the numeric scatter shorthand defined in section 8; bubble
points MUST additionally provide a finite non-negative `r`. Scatter and bubble
MAY omit `labels()`; when present, its length MUST match every dataset.

When `labels()` is omitted, line, bar, and mixed charts MUST generate the
one-based numeric labels `1..N`, where `N` is the common dataset length.
Scatter and bubble charts MUST use each normalized point's `x` value as its
generated label. Generated labels participate in tooltip, accessibility,
`point()`, selection identity, and axes exactly like explicit labels.

Line MUST expose `smooth`, `dots`, `dotSize`, `line`, `area`, `gradient`, and
`strokeWidth`. Mixed MUST expose chart-level `gradient`. Chart-level line
settings MUST be dataset defaults; local values MUST override them. On
`MixedChart`, `gradient()` MUST affect line datasets only.

```ts
smooth(enabled?: boolean): this;
dots(visible: boolean): this;
dotSize(value: number): this;
line(visible: boolean): this;
area(enabled?: boolean): this;
gradient(value?: boolean | GradientOptions): this;
strokeWidth(value: number): this;
```

Omitted `enabled` values MUST be `true`. Dot size and stroke width MUST be
finite and non-negative.

Bar MUST expose `horizontal`, `stacked`, and `radius`. Calls without arguments
MUST enable `horizontal` and `stacked`.

```ts
horizontal(enabled?: boolean): this;
stacked(enabled?: boolean): this;
radius(value: number): this;
```

Scatter and bubble MUST expose `dots`. Bubble radius MUST be finite and
non-negative.

```ts
dots(visible: boolean): this;
```

Mixed uses a distinct data grammar and MUST NOT implement positional
`dataset(values)` or `dataset(name, values)` overloads because those calls do
not identify a mark type:

```ts
interface MixedDataBuilder {
  labels(values: readonly string[]): this;
  line(name: string, values: readonly number[]): this;
  line(
    name: string,
    values: readonly number[],
    colorOrConfigure: string | ((dataset: LineDatasetBuilder) => void),
  ): this;
  bar(name: string, values: readonly number[]): this;
  bar(
    name: string,
    values: readonly number[],
    colorOrConfigure: string | ((dataset: BarDatasetBuilder) => void),
  ): this;
  scatter(name: string, values: readonly (number | Point)[]): this;
  scatter(
    name: string,
    values: readonly (number | Point)[],
    colorOrConfigure: string | ((dataset: DatasetBuilder) => void),
  ): this;
  dataset(
    input: MixedDatasetInput,
    configure?: (dataset: LineDatasetBuilder | BarDatasetBuilder | DatasetBuilder) => void,
  ): this;
}
```

Advanced mixed dataset objects MUST declare `chartType`. The implementation's
overloads MUST narrow the callback builder from the object's literal
`chartType`; a bar callback MUST NOT expose line-only methods.

Mixed MUST additionally provide the primary, object-free grammar below. These
methods append a typed dataset and are preferred in documentation:

```ts
line(name: string, values: readonly number[], colorOrConfigure?: string | ((dataset: LineDatasetBuilder) => void)): this;
bar(name: string, values: readonly number[], colorOrConfigure?: string | ((dataset: BarDatasetBuilder) => void)): this;
scatter(name: string, values: readonly (number | Point)[], colorOrConfigure?: string | ((dataset: DatasetBuilder) => void)): this;
```

The advanced `dataset(input, configure?)` form MAY express data assembled as
objects. Documentation MUST NOT require a `chartType` property for ordinary
hand-authored mixed charts.

Pie and donut MUST expose `labels`, `dataset`, `formatLabel`, `formatValue`,
`maxSlices`, `startAngle`, `padAngle`, and `cornerRadius`.

```ts
maxSlices(value: number): this;
startAngle(degrees: number): this;
padAngle(degrees: number): this;
cornerRadius(value: number): this;
```

Percentage MUST expose `labels`, `dataset`, `formatLabel`, `formatValue`,
`maxSlices`, and `radius`. It MUST NOT expose `startAngle`, `padAngle`, or
`cornerRadius`.

```ts
maxSlices(value: number): this;
radius(value: number): this;
```

Polar-area MUST expose `labels`, `dataset`, `formatLabel`, `formatValue`,
`padAngle`, and `cornerRadius`. It MUST NOT expose `maxSlices`, `startAngle`, or
`radius`.

```ts
padAngle(degrees: number): this;
cornerRadius(value: number): this;
```

Pie, donut, percentage, and polar-area MUST accept exactly one dataset. A
second dataset call MUST throw `TypeError` before DOM resolution. Their values
MUST be non-negative and at least one value MUST be positive.

Their `labels()` length MUST equal the dataset length. When the number of pie,
donut, or percentage values exceeds `maxSlices`, values MUST be stably sorted
descending, the largest `maxSlices - 1` MUST remain, and all others MUST become
one final value labelled `Rest`. Polar-area MUST NOT aggregate values.

`maxSlices` MUST be a positive integer. `startAngle` MUST be a finite number of
degrees and MUST normalize modulo `360`. `padAngle` MUST be finite and in
`[0, 360)`. `cornerRadius` and `radius` MUST be finite and non-negative.

Radar MUST expose `labels`, `dataset`, `formatLabel`, `formatValue`, and
`strokeWidth`. It MUST accept one or more datasets of non-negative values.
All radar datasets MUST have the same number of values. It MUST NOT expose
Cartesian markers, regions, axes, grid, line, area, gradient, smooth, dots,
dotSize, or radius.

```ts
strokeWidth(value: number): this;
```

Heatmap MUST expose:

```ts
range(start: Date, end: Date): this;
points(values: Readonly<Record<string | number, number>>): this;
countLabel(value: string): this;
radius(value: number): this;
```

`points()` MUST contain at least one entry. Heatmap ranges MUST be ascending
after normalization. Keys MUST be ISO `YYYY-MM-DD` dates or Unix timestamps in
seconds and values MUST be finite. When `range()` is omitted, the first and last
point dates MUST define it. An explicit range MUST contain every point date.
`countLabel()` MUST reject an empty or whitespace-only string. Heatmap radius
MUST be finite and non-negative.

Heatmap intensity MUST use a linear scale over the normalized data minimum and
maximum. For `K` colors and normalized value `v`, bucket index is
`min(K - 1, floor(((v - min) / (max - min)) * K))`. When every value is equal,
zero MUST use the first color and a non-zero value MUST use the last color.
This mapping uses the complete supplied ordinal scale and never cycles.

`range(Date, Date)` MUST interpret each `Date` by its UTC calendar day when
comparing it with timezone-free heatmap keys. Callers needing a local calendar
day MUST pass an explicit `YYYY-MM-DD` key or a `Date` representing the desired
UTC day. Range end MUST not precede range start.

Timesheet MUST expose:

```ts
range(start: TimesheetDate, end: TimesheetDate): this;
task(label: string, start: TimesheetDate, end: TimesheetDate): this;
task(input: TimesheetTaskInput): this;
axes(visible: boolean): this;
grid(visible: boolean): this;
valueLabels(visible: boolean): this;
formatDate(formatter: DateFormatter): this;
formatDuration(formatter: DurationFormatter): this;
formatTick(formatter: DateFormatter): this;
radius(value: number): this;
```

Advanced tasks MUST use the object overload; a fourth argument is forbidden.
Timesheet strings MAY use the date-only calendar form `YYYY-MM-DD`; it MUST
normalize to midnight UTC and built-in formatting MUST preserve that UTC
calendar date. A string containing a time MUST include an offset or `Z`.
Dates MUST otherwise normalize to finite timestamps, end MUST be later than
start, and at least one task is REQUIRED. An omitted timesheet range MUST span
the earliest task start through the latest task end. An explicit range MUST
contain every task. Group names MUST reject empty or whitespace-only strings.
Timesheet radius MUST be finite and non-negative.

### 13.1 Exact definition bindings

The declaration file MUST export these concrete builder interfaces and bind
each frozen definition exactly as shown. Each builder is the structural
composition of `CommonChartBuilder` with its tooltip and selection binding,
the data contracts and exhaustive method inventory in this section, and
`render(): Chart<TData, TPoint>`.

| Definition        | Builder                  | Render/update data                         | `point()` value          | `onSelect` value       |
| ----------------- | ------------------------ | ------------------------------------------ | ------------------------ | ---------------------- |
| `LineChart`       | `LineChartBuilder`       | `CartesianSeriesData<LineDatasetInput>`    | `SeriesPointSnapshot`    | `SeriesSelection`      |
| `BarChart`        | `BarChartBuilder`        | `CartesianSeriesData<BarDatasetInput>`     | `SeriesPointSnapshot`    | `SeriesSelection`      |
| `ScatterChart`    | `ScatterChartBuilder`    | `CartesianSeriesData<ScatterDatasetInput>` | `SeriesMarkSnapshot`     | `SeriesSelection`      |
| `MixedChart`      | `MixedChartBuilder`      | `CartesianSeriesData<MixedDatasetInput>`   | `SeriesMarkSnapshot`     | `SeriesSelection`      |
| `BubbleChart`     | `BubbleChartBuilder`     | `CartesianSeriesData<BubbleDatasetInput>`  | `SeriesMarkSnapshot`     | `SeriesSelection`      |
| `PieChart`        | `PieChartBuilder`        | `SeriesData<DatasetInput<number>>`         | `SeriesPointSnapshot`    | `CompositionSelection` |
| `DonutChart`      | `DonutChartBuilder`      | `SeriesData<DatasetInput<number>>`         | `SeriesPointSnapshot`    | `CompositionSelection` |
| `PercentageChart` | `PercentageChartBuilder` | `SeriesData<DatasetInput<number>>`         | `SeriesPointSnapshot`    | `CompositionSelection` |
| `RadarChart`      | `RadarChartBuilder`      | `SeriesData<DatasetInput<number>>`         | `SeriesPointSnapshot`    | `SeriesSelection`      |
| `PolarAreaChart`  | `PolarAreaChartBuilder`  | `SeriesData<DatasetInput<number>>`         | `SeriesPointSnapshot`    | `CompositionSelection` |
| `HeatmapChart`    | `HeatmapChartBuilder`    | `HeatmapData`                              | `HeatmapPointSnapshot`   | `HeatmapSelection`     |
| `TimesheetChart`  | `TimesheetChartBuilder`  | `TimesheetData`                            | `TimesheetPointSnapshot` | `TimesheetSelection`   |

```ts
declare const LineChart: Readonly<ChartDefinition<LineChartBuilder>>;
declare const BarChart: Readonly<ChartDefinition<BarChartBuilder>>;
declare const ScatterChart: Readonly<ChartDefinition<ScatterChartBuilder>>;
declare const MixedChart: Readonly<ChartDefinition<MixedChartBuilder>>;
declare const BubbleChart: Readonly<ChartDefinition<BubbleChartBuilder>>;
declare const PieChart: Readonly<ChartDefinition<PieChartBuilder>>;
declare const DonutChart: Readonly<ChartDefinition<DonutChartBuilder>>;
declare const PercentageChart: Readonly<ChartDefinition<PercentageChartBuilder>>;
declare const RadarChart: Readonly<ChartDefinition<RadarChartBuilder>>;
declare const PolarAreaChart: Readonly<ChartDefinition<PolarAreaChartBuilder>>;
declare const HeatmapChart: Readonly<ChartDefinition<HeatmapChartBuilder>>;
declare const TimesheetChart: Readonly<ChartDefinition<TimesheetChartBuilder>>;
```

`MixedChartBuilder` MUST use `MixedDataBuilder`, not the positional
`SeriesDataBuilder`. Type tests MUST prove each valid binding and reject every
method absent from the inventory.

## 14. Defaults and precedence

Precedence is scoped rather than global:

| Scope                        | Highest to lowest precedence                                               |
| ---------------------------- | -------------------------------------------------------------------------- |
| Dataset property             | callback call, input-object property, chart-level default, library default |
| Marker or region property    | callback call, input-object property, library default                      |
| Frameless-controlled setting | explicit individual method, `frameless()` preset, ordinary default         |
| Formatter                    | the target-specific order in section 9                                     |
| Marker dash                  | custom `dash()`, `lineStyle()`, library default                            |

Call order MUST NOT alter these precedence chains. A later low-precedence call
MUST NOT erase an earlier high-precedence decision.

The following defaults are normative:

| Property                                         | Default                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| Width                                            | Parent content width at commit                                              |
| Height                                           | `320` CSS pixels                                                            |
| Timesheet height                                 | `max(220, taskCount * 40 + 52)` CSS pixels                                  |
| Categorical colors                               | `#007AFF`, `#AF52DE`, `#FF3B30`, `#FF9500`, `#248A3D`, `#5856D6`, `#008C95` |
| Heatmap colors, low to high                      | `#E5E5EA`, `#B7E4C7`, `#74C69D`, `#40916C`, `#1B6B47`                       |
| Axes, grid, value labels                         | Visible                                                                     |
| Legend                                           | Visible for composition charts and charts with two or more datasets         |
| Tooltip                                          | Enabled                                                                     |
| Line smoothing                                   | Enabled                                                                     |
| Line, dots                                       | Visible                                                                     |
| Dot size                                         | `4.5` CSS pixels                                                            |
| Line/radar stroke width                          | `2` CSS pixels                                                              |
| Area, gradient, stacking, horizontal orientation | Disabled                                                                    |
| Bar/timesheet radius                             | `3` CSS pixels                                                              |
| Percentage radius                                | `6` CSS pixels                                                              |
| Sector pad angle                                 | `1.5` degrees                                                               |
| Sector corner radius                             | `4` CSS pixels                                                              |
| Maximum slices                                   | `20`                                                                        |

Keyboard navigation, visible focus, reduced-motion, and ARIA behavior are
REQUIRED for every chart. Persistent selection is REQUIRED after `onSelect()`
is registered. `onSelect()` MUST NOT fire during initial render or
programmatic update.

An explicit `legend(true|false)` MUST override the automatic legend convention.
`legend(true)` on the single unnamed dataset MUST display its generated
`Series 1` name; callers wanting a domain label use `dataset(name, values)`.

### 14.1 Accessibility and interaction defaults

The root SVG MUST use `role="group"` and `aria-roledescription="chart"`. Its
accessible name MUST use `ariaLabel()`, then `title()`, then the built-in
`"{type} chart"` fallback. `description()` MUST provide the accessible
description; when it is omitted, the runtime MUST generate a concise summary
from the chart type, labels, datasets, markers, and regions.

When tooltip inspection or selection is enabled, marks MUST use one roving tab
stop for the chart rather than one tab stop per value. Arrow keys move through
marks, Home and End move to the first and last mark, and Escape clears preview
and persistent selection. Enter and Space toggle persistent selection only when
`onSelect()` is present. Selectable marks MUST expose `role="button"` and
`aria-pressed`; inspectable non-selectable marks MUST expose descriptive text
without claiming button behavior.

`tooltip(false)` disables hover and focus preview. It MUST NOT disable keyboard
selection when `onSelect()` is present. Successful update and responsive resize
MUST preserve focus and selection only under the identity rule in section 6.
They MUST NOT call `onSelect()`. If a user `onSelect` callback throws, the
selection commit MUST remain valid and the exception MUST propagate to the
caller or browser event boundary.

`onSelect(selection)` MUST run after a user commits a new selection.
`onSelect(undefined)` MUST run after the user explicitly deselects with the
same mark, Escape, or a free-area pointer action. Programmatic render, update,
resize, destroy, and identity-based clearing MUST NOT invoke it.

Reduced-motion preference MUST disable non-essential transitions and animated
interpolation; focus, selection, tooltip, and data changes MUST remain
immediate and usable. Meaning MUST NOT depend on color alone: visible labels,
legend text, tooltip text, or generated accessible descriptions MUST identify
the represented series or value.

## 15. Dynamic selection

The package MUST NOT provide a generic runtime factory. Applications MUST use
an explicit registry and then the same fluent grammar:

```js
const chartTypes = { bar: BarChart, line: LineChart };
const ChartType = chartTypes[type];

if (!ChartType) {
  throw new TypeError(`Unsupported chart type: ${type}`);
}

ChartType.make("#chart").labels(labels).dataset("Revenue", revenue).render();
```

Heterogeneous input MUST be narrowed before type-specific calls.

## 16. Validation and errors

Independently decidable arguments MUST fail immediately. Cross-field
invariants MUST fail before DOM commit. Public failures MUST throw `TypeError`
and name the public method or concept. They MUST NOT expose internal option
paths, renderers, SVG IDs, or private classes.

CSS colors MUST be non-empty and browser-supported. Unknown input-object keys
MUST throw `TypeError`.

## 17. Internal boundaries

Builders MUST compile to detached plain scene records and formatter references.
The shared runtime MUST solely own DOM, lifecycle, interactions, tooltip,
renderer dispatch, resources, and cleanup.

Renderers MUST NOT import, retain, or call builders. Builders MUST NOT contain
layout, geometry, rendering, interaction, tooltip, or DOM behavior. Geometry
and scale modules MUST NOT depend on the fluent API.

Public Cartesian series data MUST use the orientation-neutral `markers` and
`regions` fields defined by `CartesianSeriesData`. Annotation-free
`SeriesData` for composition and radar MUST reject those keys. Public
`yMarkers` and `yRegions` are forbidden.

## 18. Conformance tests

The release MUST test:

- exact exports and absence of alternative constructors/factories;
- ESM and TypeScript parity;
- scalar replacement, collection order, single-use, and defensive copying;
- callback precedence and string-or-callback overloads;
- maximum argument counts and forbidden aliases;
- valid chains and `@ts-expect-error` cross-grammar failures;
- dataset capability narrowing and object-data updates;
- atomic render/update failures and lifecycle after destroy;
- formatter precedence without raw-value mutation;
- dataset-local isolation and gradient resource cleanup;
- annotation domains, clipping, rendering order, and collision layout;
- all chart types in desktop, mobile, dark, interaction, keyboard, focus,
  selection, reduced-motion, and accessibility states;
- cold-use autocomplete trials required by section 1.2;
- exact product-demo translations required by section 1.3, including a check
  that chart-wide palette, gradient, orientation, stacking, and frameless
  choices are each expressed once;
- a visible title, timezone-stable timesheet date-only values, the monotonic
  default heatmap scale, and standalone SVG export with resolved CSS variables;
- package contents and successful execution of canonical README examples.

The release MUST additionally test categorical palette cycling and overrides
for every categorical family, heatmap ordinal-scale behavior, chart-wide
gradient behavior for line and mixed charts, responsive width changes,
frameless precedence, unnamed single datasets, and successful selection
remapping or clearing after update.

## 19. Forbidden API

These forms MUST NOT exist:

```js
createChart("#chart", options);
new Chart("#chart", options);
new LineChart("#chart");
Chart.make("line", "#chart");

builder.setTitle("Revenue");
builder.addDataset("Sales", sales);
builder.hideLegend();
builder.withTooltip();
builder.options({ arbitrary: true });
builder.configure({ arbitrary: true });
builder.use(plugin);
builder.extend(extension);
builder.axis().position("right").end();
builder.enableGradient();
builder.setHeight(300);

dataset.render((surface) => {});
marker.render((surface) => {});
region.html("<strong>Target</strong>");
```

Arbitrary SVG, HTML, renderer, layout, and DOM callbacks are forbidden. Public
plugins, registries, hooks, and extension pipelines are forbidden.

## 20. Repository coherence and release gate

The repository previously taught and implemented the legacy
`createChart(parent, options)` API. It also used `axis-mixed`, `dataPoints`,
`yMarkers`, `yRegions`, and nested option groups. The implemented public API now
uses `MixedChart`, `points`, `marker`, `region`, and fluent scoped methods. The
legacy factory remains test-only and is neither exported nor shipped.

The implementation migration MUST use this single vocabulary:

| Current repository form                      | Target fluent form                                            |
| -------------------------------------------- | ------------------------------------------------------------- |
| `createChart(parent, { type: "line", ... })` | `LineChart.make(parent)...render()`                           |
| `type: "axis-mixed"` and dataset `chartType` | `MixedChart.make()` with `.line()`, `.bar()`, or `.scatter()` |
| `data.labels`                                | `.labels()`                                                   |
| `data.datasets`                              | ordered `.dataset()` calls                                    |
| heatmap `dataPoints`                         | `.points()` and `HeatmapData.points`                          |
| `yMarkers` / `yRegions`                      | `.marker()` / `.region()` and `markers` / `regions`           |
| `height`, `width`, `colors`                  | `.height()`, `.width()`, `.colors()`                          |
| `gradient: true`                             | `.gradient()`                                                 |
| `orientation: "horizontal"`                  | `.horizontal()`                                               |
| `barOptions.stacked` / `radius`              | `.stacked()` / `.radius()`                                    |
| `showAxes`, `showGrid`, `showLabels`         | `.axes()`, `.grid()`, `.valueLabels()`                        |
| six hidden-layer options in spark examples   | `.frameless()`                                                |
| `axisOptions.yAxisPosition`                  | `.yAxis((axis) => axis.position(...))`                        |
| `tooltipOptions`                             | scoped `.tooltip()` formatting                                |
| `timesheetOptions`                           | direct timesheet formatter and radius methods                 |

A release claiming conformance MUST make the following files and surfaces tell
the same story: package exports, JavaScript runtime, TypeScript declarations,
README, `docs/api-reference.md`, positioning copy, demo source, tests, and generated
package contents. The release MUST expose exactly the named definitions in
section 3 and MUST NOT expose both the legacy factory and the fluent API.

If `0.0.1` has already been publicly released with `createChart`, this contract
requires a breaking major version. If it has not been released, it MAY become
the `0.0.1` contract. Package metadata alone is not evidence of publication;
the maintainer MUST make this decision from the registry and release history.

Migration MUST proceed as one replacement, not as two permanent public APIs:

1. implement named builders as detached scene compilers over the shared
   internal runtime;
2. migrate the product demo and one executable before/after fixture for every
   chart family, including `update()`;
3. migrate README, API documentation, positioning, declarations, tests, and
   package examples;
4. remove the legacy export and every legacy public term before packing;
5. run the coherence and package-content gates against the packed artifact.

If published users require a transition period, a legacy adapter MAY be
released as a separate package. `@orchid/charts` MUST NOT export both grammars.

The implementation MUST prove detached, atomic render and update behavior.
Adapting builders to the existing renderer pipeline is allowed, but a thin
alias over the current eagerly mutating constructor does not conform.

## 21. Canonical advanced example

```js
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const chart = LineChart.make("#sales")
  .title("Sales performance")
  .labels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
  .formatValue((value) => currency.format(value))
  .dataset("Sales", [1240, 1890, 1650, 2340, 2780, 3120], (dataset) =>
    dataset.color("#2563eb").gradient({ fromOpacity: 0.4, toOpacity: 0.04 }),
  )
  .dataset("Profit", [890, 1340, 980, 1670, 2010, 2450], "#c2410c")
  .region("Expected range", [2800, 4000], (region) => region.color("#2563eb").opacity(0.08))
  .marker("Target", 4000)
  .marker("Annual average", 2900)
  .marker("Baseline", 1000, "#e2e8f0")
  .yAxis((axis) => axis.position("left").formatValue((value) => currency.format(value)))
  .tooltip((tooltip) => tooltip.formatLabel((label) => `Period: ${label}`))
  .render();
```
