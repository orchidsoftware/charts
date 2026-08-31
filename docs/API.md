# API

The package intentionally has one JavaScript export:

```js
import { createChart } from "@charts2/core";
import "@charts2/core/style.css";
```

## `createChart(parent, options)`

`parent` is an `Element` or a selector resolving to one. `options.type` is
required and must be one of:

```text
line, bar, scatter, axis-mixed, bubble,
pie, donut, percentage, radar, polar-area,
heatmap, timesheet
```

Series charts receive `data.datasets`; heatmaps receive dated `dataPoints`;
timesheets receive `tasks`. The TypeScript declarations model these as a
discriminated union, so `type` selects the valid data contract.

```js
const chart = createChart("#chart", {
  type: "bar",
  orientation: "horizontal",
  ariaLabel: "Revenue by region",
  data: {
    labels: ["Europe", "Americas", "Asia-Pacific"],
    datasets: [{ name: "Revenue", values: [36, 42, 54] }],
  },
});
```

Common options are `width`, `height`, `colors`, `ariaLabel`, `description`,
`showLegend`, `showTooltip`, and `onSelect`. Cartesian presentation is
controlled explicitly with `showAxes`, `showGrid`, `showLabels`, and `showDots`.
Type-specific options live under `lineOptions`, `barOptions`, `axisOptions`,
`sectorOptions`, `tooltipOptions`, and `timesheetOptions`.

## Lifecycle

- `chart.update(data)` validates, normalizes, redraws, and returns the chart.
- `chart.point(index)` reads normalized data at an index.
- `chart.toSvg()` returns SVG source without side effects.
- `chart.download(name)` downloads the SVG and returns the chart.
- `chart.destroy()` removes DOM and listeners.
- `chart.element` is the root `SVGSVGElement`.

## Selection

Supplying `onSelect(detail)` opts marks into persistent click/Enter selection.
Without it, marks remain hover/focus-readable but are not buttons. Escape clears
selection. The callback receives normalized coordinates and type-specific data.

## Frameless charts

There is no compact preset. A small chart states every omitted layer:

```js
createChart("#trend", {
  type: "line",
  height: 90,
  showAxes: false,
  showGrid: false,
  showLabels: false,
  showLegend: false,
  showDots: false,
  showTooltip: false,
  data: { datasets: [{ values: [12, 18, 16, 25] }] },
});
```

Removed APIs fail instead of silently entering compatibility code:
`new Chart`, named constructors, `Sparkline`, `type: "sparkline"`, `compact`,
`angularInset`, `variant`, and `sparklineType`.

Invalid selectors, unsupported types/options, empty datasets, invalid dates,
and non-finite coordinates fail immediately with descriptive `TypeError`s.
