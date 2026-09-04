# Pie charts

## Introduction

Pie charts show how a whole is divided into a small number of categories. They
work best when the differences between slices are clear and precise comparison
is not required.

## Creating a pie chart

```js
import { PieChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = PieChart.make("#plans")
  .labels(["Starter", "Team", "Business"])
  .dataset([58, 31, 11])
  .colors(["#2563eb", "#8b5cf6", "#f59e0b"])
  .render();
```

Pie values must be non-negative and at least one value must be positive.

## Limiting slices

Use `maxSlices()` when incoming data may contain more categories than the chart
can communicate clearly. Orchid Charts keeps the largest slices and combines the
remainder:

```js
import { PieChart } from "@orchidsoftware/charts";

PieChart.make("#sources").labels(sources).dataset(visits).maxSlices(5).render();
```

## Starting angle

`startAngle()` rotates the chart by the given number of degrees:

```js
import { PieChart } from "@orchidsoftware/charts";

PieChart.make("#plans").labels(plans).dataset(accounts).startAngle(-90).render();
```

## Slice spacing and corners

Use `padAngle()` to place space between slices and `cornerRadius()` to soften
their corners:

```js
import { PieChart } from "@orchidsoftware/charts";

PieChart.make("#plans").labels(plans).dataset(accounts).padAngle(2).cornerRadius(4).render();
```

Pie charts also support `formatLabel()`, `formatValue()`, `legend(false)`, and
the shared [colors, dimensions, tooltip, and selection methods](./customization.md).
