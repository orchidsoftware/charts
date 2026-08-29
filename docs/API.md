# API

Charts2 exports twelve frozen named chart definitions:

```js
import { BarChart, HeatmapChart, LineChart, TimesheetChart } from "@charts2/core";
import "@charts2/core/style.css";
```

Every definition exposes one creation method, `make(parent)`. The returned
single-use builder contains only methods meaningful for that chart family.

```js
const chart = BarChart.make("#chart")
  .title("Revenue by region")
  .labels(["Europe", "Americas", "Asia-Pacific"])
  .dataset("Revenue", [36, 42, 54])
  .horizontal()
  .height(300)
  .render();
```

The common authoring vocabulary is `title`, `description`, `ariaLabel`,
`width`, `height`, `colors`, `tooltip`, `onSelect`, and `render`. Series charts
add `labels` and `dataset`; each family then adds only its concise domain terms,
such as `gradient`, `stacked`, `maxSlices`, `points`, or `task`.

## Lifecycle

- `chart.update(data)` validates and atomically replaces the complete data scene.
- `chart.point(index)` returns an immutable normalized snapshot.
- `chart.toSvg()` returns SVG source without downloading.
- `chart.download(name)` downloads the SVG and returns the chart.
- `chart.destroy()` idempotently releases DOM and listeners.
- `chart.element` is the stable root `SVGSVGElement`.

## The 95% path

```js
const trend = LineChart.make("#trend")
  .dataset([12, 18, 16, 25])
  .colors(["#00bdff", "#1b3bff", "#8f00ff"])
  .height(90)
  .gradient()
  .frameless()
  .render();
```

No generic runtime factory or public chart constructor is provided. For dynamic
selection, use an explicit registry of named definitions.

The normative, exhaustive grammar, defaults, validation rules, callback types,
selection payloads, and per-family method inventory are in
[FLUENT_API.md](./FLUENT_API.md).
