# Percentage Charts

## Introduction

Percentage charts show composition as a compact horizontal strip. They are a
good fit for storage, plan distribution, progress allocation, and other places
where a full pie or donut would use too much space.

## Creating a Percentage Chart

```js
import { PercentageChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = PercentageChart.make("#storage")
  .labels(["Used", "Available"])
  .dataset([68, 32])
  .colors(["#2563eb", "#e2e8f0"])
  .render();
```

Values must be non-negative and at least one value must be positive. Orchid Charts
calculates each category's share from the supplied values; they do not need to
sum to 100.

## Limiting Segments

Use `maxSlices()` to keep the largest categories and combine the remainder:

```js
import { PercentageChart } from "@orchidsoftware/charts";

PercentageChart.make("#traffic").labels(sources).dataset(visits).maxSlices(5).render();
```

## Rounded Segments

The `radius()` method rounds segment corners in CSS pixels:

```js
import { PercentageChart } from "@orchidsoftware/charts";

PercentageChart.make("#storage").labels(["Used", "Available"]).dataset([68, 32]).radius(6).render();
```

Percentage charts also support `formatLabel()`, `formatValue()`,
`legend(false)`, and the shared [colors, dimensions, tooltip, and selection
methods](./customization.md).
