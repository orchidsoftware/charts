# Scatter charts

## Introduction

Scatter charts show whether two measurements move together. Each point has an
`x` and `y` coordinate; multiple named datasets may be compared in one chart.

## Creating a scatter chart

```js
import { ScatterChart } from "@orchid/charts";
import "@orchid/charts/style.css";

const chart = ScatterChart.make("#results")
  .dataset("Teams", [
    { x: 12, y: 38 },
    { x: 18, y: 51 },
    { x: 25, y: 63 },
  ])
  .render();
```

The value returned by `render()` is the mounted chart and may be updated,
selected, or exported.

## Point data

The clearest scatter input uses `{ x, y }` objects:

```js
import { ScatterChart } from "@orchid/charts";

ScatterChart.make("#results")
  .dataset("Current", [
    { x: 4, y: 18 },
    { x: 8, y: 31 },
    { x: 12, y: 46 },
  ])
  .dataset("Previous", [
    { x: 4, y: 15 },
    { x: 8, y: 25 },
    { x: 12, y: 38 },
  ])
  .render();
```

A plain number is also accepted. In that form, its array index becomes the
`x` coordinate:

```js
import { ScatterChart } from "@orchid/charts";

ScatterChart.make("#results").dataset([18, 31, 46]).render();
```

## Point visibility

Use `dots(false)` to hide scatter marks while keeping the chart's scale and
annotations:

```js
import { ScatterChart } from "@orchid/charts";

ScatterChart.make("#results").dataset(points).dots(false).render();
```

## Dataset appearance

A scatter dataset callback supports `color()`, `opacity()`, and
`formatValue()`:

```js
import { ScatterChart } from "@orchid/charts";

ScatterChart.make("#results")
  .dataset("Teams", points, (dataset) => {
    dataset.color("#2563eb").opacity(0.75);
  })
  .render();
```

Scatter charts also support the shared [cartesian presentation, formatting,
and annotation methods](./customization.md).
