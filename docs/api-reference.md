# API reference

This page is a compact map of the public Orchid Charts API. Begin with
[Getting started](./getting-started.md) if you have not rendered a chart yet.

## Imports

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
} from "@orchidsoftware/charts";

import "@orchidsoftware/charts/style.css";
```

Each definition exposes `make(parent)`, where `parent` is a CSS selector or an
`Element`. Configuration methods return the same builder, and `render()` mounts
the chart.

## Common chart methods

| Method               | Result                                                     |
| -------------------- | ---------------------------------------------------------- |
| `title(text)`        | Shows a visible title.                                     |
| `description(text)`  | Adds a longer accessible SVG description.                  |
| `ariaLabel(text)`    | Sets the chart's accessible name.                          |
| `width(pixels)`      | Uses an explicit width instead of the host width.          |
| `height(pixels)`     | Sets the chart height, except on intrinsic-height Heatmap. |
| `colors(palette)`    | Sets the ordered chart palette.                            |
| `tooltip(false)`     | Hides the tooltip.                                         |
| `tooltip(callback)`  | Formats tooltip content.                                   |
| `onSelect(callback)` | Receives a selection or `undefined` when it clears.        |
| `render()`           | Mounts the chart and returns its runtime API.              |

Charts with a legend also provide `legend(false)`. Categorical legends share one
bottom placement with color dots beside their labels and whole-item wrapping.

## Series data

Line, bar, scatter, bubble, radar, pie, donut, percentage, and polar area charts
use `dataset()`:

```js
chart
  .labels(["Jan", "Feb", "Mar"])
  .dataset([42, 48, 57])
  .dataset("Plan", [45, 50, 55])
  .dataset("Previous", [38, 41, 49], "#94a3b8");
```

Accepted forms are:

```text
dataset(values)
dataset(values, color)
dataset(values, callback)
dataset(name, values)
dataset(name, values, color)
dataset(name, values, callback)
dataset(input, callback?)
```

A numeric dataset input has this shape:

```js
{
  name: "Revenue",       // optional
  values: [42, 48, 57],
  color: "#2563eb",      // optional
  opacity: 0.8,           // optional, 0–1
  formatValue(value, context) { return String(value); } // optional
}
```

`labels()` is optional. When omitted, Orchid Charts generates positional labels.
Named datasets are recommended when a legend or tooltip compares series.

## Cartesian methods

Line, bar, scatter, bubble, and mixed charts provide:

| Method                                | Result                                                   |
| ------------------------------------- | -------------------------------------------------------- |
| `axes(visible)`                       | Shows or hides axes.                                     |
| `grid(visible)`                       | Shows or hides grid lines.                               |
| `valueLabels(visible)`                | Shows or hides direct values.                            |
| `frameless()`                         | Removes optional presentation layers for a compact view. |
| `formatLabel(formatter)`              | Formats category labels.                                 |
| `formatValue(formatter)`              | Formats values across the chart.                         |
| `yAxis(callback)`                     | Changes Y-axis position or formatting.                   |
| `marker(label, value, color?)`        | Adds a reference line.                                   |
| `region(label, [start, end], color?)` | Adds a reference band.                                   |

### LineChart

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make(parent).labels(labels).dataset(name, values).smooth().gradient().render();
```

Line-specific methods: `smooth(enabled?)`, `dots(visible)`, `dotSize(pixels)`,
`line(visible)`, `area(enabled?)`, `gradient(enabledOrOptions?)`, and
`strokeWidth(pixels)`.

Gradient options are `{ fromOpacity?, toOpacity? }`.

See [Line charts](./line.md) for examples of every line method.

### BarChart

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make(parent).labels(labels).dataset(name, values).horizontal().stacked().render();
```

Bar-specific methods: `horizontal(enabled?)`, `stacked(enabled?)`, and
`radius(pixels)`.

See [Bar charts](./bar.md) for grouped, horizontal, and stacked examples.

### ScatterChart

```js
import { ScatterChart } from "@orchidsoftware/charts";

ScatterChart.make(parent)
  .dataset("Results", [{ x: 12, y: 38 }])
  .render();
```

Values may be `{ x, y }` points or numbers. A number uses its array index as
`x`. Scatter charts also provide `dots(visible)`.

See [Scatter charts](./scatter.md) for point and dataset examples.

### BubbleChart

```js
import { BubbleChart } from "@orchidsoftware/charts";

BubbleChart.make(parent)
  .dataset("Accounts", [{ x: 12, y: 38, r: 8 }])
  .render();
```

Every bubble is `{ x, y, r }`. Bubble charts also provide `dots(visible)`.
Automatic coordinate domains account for circle bounds while preserving `r` in CSS pixels.

See [Bubble charts](./bubble.md) for radius and dataset guidance.

### MixedChart

```js
import { MixedChart } from "@orchidsoftware/charts";

MixedChart.make(parent)
  .labels(labels)
  .bar("Actual", actual)
  .line("Plan", plan)
  .scatter("Events", events)
  .render();
```

Use `bar(name, values, colorOrCallback?)`, `line(...)`, and `scatter(...)`.
`gradient(enabledOrOptions?)` applies to line datasets.

See [Mixed charts](./mixed.md) for each dataset type and its methods.

## Composition and radial charts

These charts use numeric `labels()` and `dataset()` data. They also provide
`formatLabel(formatter)` and `formatValue(formatter)`.

| Definition        | Additional methods                                                                     |
| ----------------- | -------------------------------------------------------------------------------------- |
| `PieChart`        | `maxSlices(count)`, `startAngle(degrees)`, `padAngle(degrees)`, `cornerRadius(pixels)` |
| `DonutChart`      | `maxSlices(count)`, `startAngle(degrees)`, `padAngle(degrees)`, `cornerRadius(pixels)` |
| `PercentageChart` | `maxSlices(count)`, `radius(pixels)`                                                   |
| `RadarChart`      | `strokeWidth(pixels)`                                                                  |
| `PolarAreaChart`  | `padAngle(degrees)`, `cornerRadius(pixels)`                                            |

`maxSlices()` keeps the largest categories and combines the remainder.

Each type has its own guide: [Pie](./pie.md), [donut](./donut.md),
[percentage](./percentage.md), [radar](./radar.md), and
[polar area](./polar-area.md).

## HeatmapChart

```js
import { HeatmapChart } from "@orchidsoftware/charts";

HeatmapChart.make(parent)
  .range(new Date("2026-01-01T00:00:00Z"), new Date("2026-12-31T00:00:00Z"))
  .points({ "2026-08-28": 4, "2026-08-29": 9 })
  .countLabel("contributions")
  .radius(2)
  .render();
```

| Method              | Result                                                  |
| ------------------- | ------------------------------------------------------- |
| `range(start, end)` | Sets the displayed calendar range.                      |
| `points(values)`    | Adds values keyed by `YYYY-MM-DD`.                      |
| `countLabel(text)`  | Names the counted unit in accessible text and tooltips. |
| `radius(pixels)`    | Rounds day cells.                                       |

The tooltip callback provides `formatDate(formatter)` and
`formatValue(formatter)`.

See [Calendar heatmaps](./heatmap.md) for range, color scale, and tooltip examples.

## TimesheetChart

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make(parent)
  .range("2026-09-01", "2026-09-12")
  .task("Design", "2026-09-01", "2026-09-03")
  .task({
    label: "Build",
    start: "2026-09-03",
    end: "2026-09-08",
    group: "Engineering",
    color: "#2563eb",
  })
  .render();
```

| Method                      | Result                                        |
| --------------------------- | --------------------------------------------- |
| `range(start, end)`         | Sets the displayed time range.                |
| `task(label, start, end)`   | Adds a task.                                  |
| `task(input)`               | Adds a task with an optional group and color. |
| `axes(visible)`             | Shows or hides the time axis.                 |
| `grid(visible)`             | Shows or hides the time grid.                 |
| `valueLabels(visible)`      | Shows or hides task labels.                   |
| `formatDate(formatter)`     | Formats dates in chart content.               |
| `formatDuration(formatter)` | Formats task durations.                       |
| `formatTick(formatter)`     | Formats time-axis ticks.                      |
| `radius(pixels)`            | Rounds task bars.                             |

The tooltip callback provides `formatDate(formatter)` and
`formatDuration(formatter)`.

Timesheet dates accept `Date`, milliseconds, `YYYY-MM-DD`, or date-time strings
with an explicit timezone.

See [Timesheet charts](./timesheet.md) for task, range, and formatting examples.

## Scoped customization

Callbacks expose methods only for the item they configure:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#chart")
  .dataset("Actual", values, (dataset) => {
    dataset
      .color("#2563eb")
      .opacity(0.9)
      .formatValue((value) => `${value}k`)
      .smooth()
      .gradient()
      .dots(true)
      .dotSize(5)
      .line(true)
      .area(false)
      .strokeWidth(3);
  })
  .render();
```

- Every dataset callback: `color()`, `opacity()`, `formatValue()`.
- Line dataset callback: `gradient()`, `smooth()`, `dots()`, `dotSize()`,
  `line()`, `area()`, `strokeWidth()`.
- Bar dataset callback: `radius()`.
- Y-axis callback: `position("left" | "right")`, `formatValue()`.
- Series tooltip callback: `formatLabel()`, `formatValue()`.
- Marker callback: `color()`, `width()`, `opacity()`, `lineStyle()`, `dash()`,
  `labelPosition()`, `labelColor()`, `includeInDomain()`, `formatLabel()`.
- Region callback: `color()`, `opacity()`, `labelPosition()`, `labelColor()`,
  `includeInDomain()`, `formatLabel()`.

Callbacks run while the builder is being configured; do not keep their scoped
objects for later use.

## Runtime API

`render()` returns a chart with the same lifecycle for every definition:

| Member                | Result                                                |
| --------------------- | ----------------------------------------------------- |
| `element`             | The owned root `SVGSVGElement`.                       |
| `update(data)`        | Validates and replaces the complete data scene.       |
| `point(index?)`       | Returns an immutable normalized point or `undefined`. |
| `toSvg()`             | Returns the current SVG source.                       |
| `download(filename?)` | Downloads the current chart as SVG.                   |
| `destroy()`           | Releases the DOM, observers, and listeners.           |

See [Updates and interaction](./updates-and-interaction.md) for the mounted
lifecycle and [Exporting SVG](./exporting.md) for serialization and download.

## TypeScript

Type declarations ship with the package. Each named definition returns a
chart-specific builder, so autocomplete shows only methods that can affect that
chart. Public input, update, point, and selection types can also be imported
from `@orchidsoftware/charts`.
