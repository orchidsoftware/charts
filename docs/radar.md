# Radar Charts

## Introduction

Radar charts compare profiles across several measures that share a common
scale. They work best with a small number of measures and datasets.

## Creating a Radar Chart

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

## Comparing Profiles

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

Hover or tap the broad sector around a measure to compare all profiles for that
measure. The tooltip uses the same heading and series rows as a line chart;
the active axis and each profile's value receive a subtle highlight. There is
no need to target a polygon edge or a small point.

On touch screens, tap to keep the comparison open and tap outside to dismiss it.
Keyboard focus opens the same comparison; arrow keys move between measures and
Escape closes it. The small neutral area at the center avoids accidental changes
between axes.

With `onSelect()`, clicking or pressing Enter selects a measure across all
profiles. The callback's `values` and `points` follow dataset order, and
`chart.point()` reads the selected measure just like `chart.point(index)`.

## Stroke Width

Use `strokeWidth()` to change the outline of every profile:

```js
import { RadarChart } from "@orchidsoftware/charts";

RadarChart.make("#quality")
  .labels(metrics)
  .dataset(scores)
  .strokeWidth(3)
  .render();
```

Radar charts also support `formatLabel()`, `formatValue()`, `legend(false)`,
and the shared [colors, dimensions, tooltip, and selection methods](./customization.md).
