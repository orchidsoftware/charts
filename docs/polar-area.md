# Polar Area Charts

## Introduction

Polar area charts give every category the same angle and encode its value with
radius. Use one when the circular form is useful and magnitude—not a share of a
fixed whole—is the main comparison.

## Creating a Polar Area Chart

```js
import { PolarAreaChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = PolarAreaChart.make("#sources")
  .labels(["Search", "Direct", "Partners", "Social"])
  .dataset([48, 31, 22, 15])
  .colors(["#2563eb", "#8b5cf6", "#f59e0b", "#16a34a"])
  .render();
```

Values must be non-negative and at least one value must be positive.

## Segment Spacing

`padAngle()` adds space between segments, measured in degrees:

```js
import { PolarAreaChart } from "@orchidsoftware/charts";

PolarAreaChart.make("#sources").labels(sources).dataset(visits).padAngle(3).render();
```

## Rounded Segments

Use `cornerRadius()` to round segment corners in CSS pixels:

```js
import { PolarAreaChart } from "@orchidsoftware/charts";

PolarAreaChart.make("#sources").labels(sources).dataset(visits).padAngle(3).cornerRadius(4).render();
```

Polar area charts also support `formatLabel()`, `formatValue()`,
`legend(false)`, and the shared [colors, dimensions, tooltip, and selection
methods](./customization.md).
