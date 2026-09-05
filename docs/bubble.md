# Bubble charts

## Introduction

Bubble charts compare three measurements at once. The `x` and `y` properties
position each point, while `r` controls its radius.

## Creating a bubble chart

```js
import { BubbleChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = BubbleChart.make("#accounts")
  .dataset("Accounts", [
    { x: 12, y: 38, r: 6 },
    { x: 18, y: 51, r: 10 },
    { x: 25, y: 63, r: 15 },
  ])
  .render();
```

The value returned by `render()` is the mounted chart and may be updated,
selected, or exported.

## Comparing datasets

Name each dataset so the legend and tooltip can distinguish its bubbles:

```js
import { BubbleChart } from "@orchidsoftware/charts";

BubbleChart.make("#accounts")
  .dataset("Self-serve", [
    { x: 12, y: 38, r: 6 },
    { x: 18, y: 51, r: 10 },
  ])
  .dataset("Sales-led", [
    { x: 16, y: 58, r: 12 },
    { x: 24, y: 72, r: 16 },
  ])
  .colors(["#2563eb", "#f59e0b"])
  .render();
```

The radius must be finite and non-negative. Keep the range of radii modest so
large bubbles do not hide smaller ones.

The chart automatically expands its coordinate domains to fit complete circles,
including after resizing or updating data. The supplied `r` stays a radius in
CSS pixels; it is never rescaled to fit the container. A circle larger than the
available plot cannot fit and may extend outside it. Use a larger container or
smaller source radii in that case.

If area represents a measurement, convert that measurement before passing the
data: `r = scaleFactor * Math.sqrt(value)`. Explain the measurement and its units
in your product; the library cannot infer them from a radius. For example,
`{ x: 1, y: 78, r: Math.sqrt(529) }` can represent 78 thousand weekly users and
an installed size of 529 MB when the product supplies those labels.

## Point visibility

Use `dots(false)` to hide bubble marks while retaining the scale and any
annotations:

```js
import { BubbleChart } from "@orchidsoftware/charts";

BubbleChart.make("#accounts").dataset(bubbles).dots(false).render();
```

## Dataset appearance

A bubble dataset callback supports `color()`, `opacity()`, and
`formatValue()`:

```js
import { BubbleChart } from "@orchidsoftware/charts";

BubbleChart.make("#accounts")
  .dataset("Accounts", bubbles, (dataset) => {
    dataset.color("#2563eb").opacity(0.75);
  })
  .render();
```

Bubble charts also support the shared [cartesian presentation, formatting, and
annotation methods](./customization.md).
