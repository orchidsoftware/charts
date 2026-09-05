# Customization

Orchid Charts starts with product-ready defaults. Add only the methods that change
the result you need.

## Set the size

Charts are responsive by default: they follow the width of their host element.
Set a fixed drawing width only when the chart should not follow its container.

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue").dataset([42, 48, 57]).height(280).render();
```

- `height(pixels)` sets the chart height.
- `width(pixels)` sets an explicit width.

Heatmaps are the exception: their day cells stay square, calendar bands wrap at
the available width, and the SVG derives its own height. Put optional outer
space on the parent instead of inside the chart:

```html
<div style="padding: 10px">
  <div id="activity"></div>
</div>
```

## Choose chart colors

Pass colors in the order they should be used. The palette repeats when there
are more series or categories than colors.

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#orders")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Orders", [124, 86, 43])
  .colors(["#2563eb", "#8b5cf6", "#f59e0b"])
  .render();
```

For series charts, colors are assigned by dataset. For pie, donut, percentage,
and polar area charts, colors are assigned by category. A heatmap uses the
palette as a low-to-high intensity scale.

To change one dataset without changing the chart palette, pass a color directly:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .dataset("Actual", [42, 48, 57], "#2563eb")
  .dataset("Plan", [45, 50, 55], "#94a3b8")
  .render();
```

## Match the surrounding interface

Orchid Charts uses CSS variables for shared surface colors. Override them on a page,
card, or chart host:

```css
.analytics-card {
  --charts-label-color: #e2e8f0;
  --charts-secondary-label-color: #94a3b8;
  --charts-axis-line-color: #334155;
  --charts-tooltip-bg: rgb(15 23 42 / 96%);
  --charts-tooltip-value: #f8fafc;
  --charts-focus-ring: #38bdf8;
  --charts-mark-separator: #0f172a;
  --charts-point-fill: #0f172a;
}
```

This is usually enough for a dark card or branded product surface. Keep data
colors in `colors()` so they remain explicit and readable.

## Change the presentation

Common chart-wide methods describe the result directly:

```js
import { LineChart } from "@orchidsoftware/charts";

const compactTrend = LineChart.make("#trend")
  .dataset([12, 18, 16, 25])
  .height(90)
  .smooth()
  .gradient()
  .frameless()
  .render();
```

- Line: `smooth()`, `gradient()`, `area()`, `dots(false)`, `strokeWidth(value)`.
- Bar: `horizontal()`, `stacked()`, `radius(value)`.
- Cartesian: `axes(false)`, `grid(false)`, `valueLabels(false)`, `frameless()`.
- Pie and donut: `maxSlices(value)`, `startAngle(value)`, `padAngle(value)`,
  `cornerRadius(value)`.
- Percentage: `maxSlices(value)`, `radius(value)`.
- Polar area: `padAngle(value)`, `cornerRadius(value)`.
- Radar: `strokeWidth(value)`.
- Heatmap: `countLabel(value)`, `radius(value)`.
- Timesheet: `axes(false)`, `grid(false)`, `valueLabels(false)`, `radius(value)`.

Boolean conventions use the short form when enabled. Their optional boolean
argument is useful for conditional code, such as `.stacked(isCompact)`.

## Format labels and values

Use chart-level formatters when the same rule should apply everywhere:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#revenue")
  .labels(["Starter", "Team", "Business"])
  .dataset("MRR", [12400, 28600, 53100])
  .formatValue((value) => `$${Math.round(value / 1000)}k`)
  .formatLabel((label) => label.toUpperCase())
  .render();
```

Customize only the tooltip when the axis should stay compact:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .dataset("Revenue", [12400, 28600, 53100])
  .tooltip((tooltip) => {
    tooltip.formatValue((value) => `$${value.toLocaleString()}`);
  })
  .render();
```

Pass `false` to `tooltip()` or `legend()` when that layer does not help the
reader.

## Add context to a cartesian chart

Markers show a target or threshold. Regions show a meaningful range.

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#response-time")
  .labels(["Mon", "Tue", "Wed", "Thu", "Fri"])
  .dataset("p95", [180, 210, 195, 240, 205])
  .marker("Target", 200, "#dc2626")
  .region("Healthy", [0, 200], "#16a34a")
  .render();
```

Line, bar, scatter, bubble, and mixed charts support markers and regions.

## Customize one dataset

Use a dataset callback only when one series needs different treatment:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .dataset("Actual", [42, 48, 57], (dataset) => {
    dataset.color("#2563eb").strokeWidth(3).dots(true);
  })
  .dataset("Plan", [45, 50, 55], (dataset) => {
    dataset.color("#94a3b8").opacity(0.7).dots(false);
  })
  .render();
```

Start with chart-wide methods. Reach for a callback only when a single dataset,
axis, marker, region, or tooltip must differ.

Continue with [Updates and interaction](./updates-and-interaction.md) to connect
the finished chart to your application.
