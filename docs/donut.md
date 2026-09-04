# Donut charts

## Introduction

Donut charts show the same part-to-whole relationship as pie charts while
leaving the center open. Use one when the ring shape fits the surrounding
interface better than a solid circle.

## Creating a donut chart

```js
import { DonutChart } from "@orchid/charts";
import "@orchid/charts/style.css";

const chart = DonutChart.make("#plans")
  .labels(["Starter", "Team", "Business"])
  .dataset([58, 31, 11])
  .colors(["#2563eb", "#8b5cf6", "#f59e0b"])
  .render();
```

Donut values must be non-negative and at least one value must be positive.

## Limiting slices

`maxSlices()` keeps the largest categories and combines the remainder:

```js
import { DonutChart } from "@orchid/charts";

DonutChart.make("#sources").labels(sources).dataset(visits).maxSlices(5).render();
```

## Starting angle

Use `startAngle()` to rotate the first slice to a deliberate position:

```js
import { DonutChart } from "@orchid/charts";

DonutChart.make("#plans").labels(plans).dataset(accounts).startAngle(-90).render();
```

## Slice spacing and corners

`padAngle()` adds spacing between slices. `cornerRadius()` rounds their corners:

```js
import { DonutChart } from "@orchid/charts";

DonutChart.make("#plans").labels(plans).dataset(accounts).padAngle(2).cornerRadius(4).render();
```

Donut charts also support `formatLabel()`, `formatValue()`, `legend(false)`, and
the shared [colors, dimensions, tooltip, and selection methods](./customization.md).
