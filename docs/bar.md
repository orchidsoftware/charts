# Bar charts

## Introduction

Bar charts make differences between categories easy to compare. They may be
vertical or horizontal, and multiple datasets may be grouped or stacked.

## Creating a bar chart

```js
import { BarChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = BarChart.make("#regions")
  .labels(["Europe", "Americas", "Asia-Pacific"])
  .dataset("Revenue", [36, 42, 54])
  .render();
```

The value returned by `render()` is the mounted chart and may be updated,
selected, or exported.

## Grouped bars

Add another dataset to place related bars beside one another:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#orders")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Shipped", [124, 86, 43])
  .dataset("Processing", [32, 18, 12])
  .colors(["#2563eb", "#f59e0b"])
  .render();
```

## Horizontal bars

Call `horizontal()` when category labels are long or ranking is the main task:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#delivery-time")
  .labels(["North America", "Europe", "Asia-Pacific"])
  .dataset("Hours", [42, 36, 54])
  .horizontal()
  .render();
```

Passing `false` restores vertical bars, which is useful in conditional code:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#orders").dataset(values).horizontal(isCompact).render();
```

## Stacked bars

Call `stacked()` when both the total and its parts are meaningful:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#orders")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Shipped", [124, 86, 43])
  .dataset("Processing", [32, 18, 12])
  .horizontal()
  .stacked()
  .render();
```

Without `stacked()`, multiple datasets remain grouped.

## Rounded bars

The `radius()` method rounds bar corners in CSS pixels:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#revenue").labels(regions).dataset(values).radius(6).render();
```

## Customizing one dataset

Use a dataset callback when one set of bars needs a different color, opacity,
value format, or radius:

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#orders")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Actual", [124, 86, 43], (bars) => {
    bars.color("#2563eb").radius(6);
  })
  .dataset("Previous", [108, 79, 39], (bars) => {
    bars.color("#94a3b8").opacity(0.65);
  })
  .render();
```

A bar dataset supports `color()`, `opacity()`, `formatValue()`, and `radius()`.

Bar charts also support the shared [cartesian presentation, formatting, and
annotation methods](./customization.md).
