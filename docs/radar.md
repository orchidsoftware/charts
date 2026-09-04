# Radar charts

## Introduction

Radar charts compare profiles across several measures that share a common
scale. They work best with a small number of measures and datasets.

## Creating a radar chart

```js
import { RadarChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = RadarChart.make("#quality")
  .labels(["Speed", "Reliability", "Ease", "Support", "Value"])
  .dataset("Current", [78, 91, 86, 74, 82])
  .render();
```

Radar values must be non-negative. Every dataset must contain one value for
each label.

## Comparing profiles

Add another named dataset to compare profiles on the same scale:

```js
import { RadarChart } from "@orchidsoftware/charts";

RadarChart.make("#quality")
  .labels(["Speed", "Reliability", "Ease", "Support", "Value"])
  .dataset("Current", [78, 91, 86, 74, 82])
  .dataset("Previous", [69, 84, 80, 70, 76])
  .colors(["#2563eb", "#94a3b8"])
  .render();
```

## Stroke width

Use `strokeWidth()` to change the outline of every profile:

```js
import { RadarChart } from "@orchidsoftware/charts";

RadarChart.make("#quality").labels(metrics).dataset(scores).strokeWidth(3).render();
```

Radar charts also support `formatLabel()`, `formatValue()`, `legend(false)`,
and the shared [colors, dimensions, tooltip, and selection methods](./customization.md).
