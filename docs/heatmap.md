# Calendar heatmaps

## Introduction

Calendar heatmaps show activity day by day. Color intensity makes recurring
patterns, quiet periods, and unusually active days easy to find.

## Creating a calendar heatmap

Point keys use the timezone-free `YYYY-MM-DD` form:

```js
import { HeatmapChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = HeatmapChart.make("#activity")
  .points({
    "2026-08-26": 3,
    "2026-08-27": 7,
    "2026-08-28": 4,
    "2026-08-29": 9,
  })
  .render();
```

Point values must be finite numbers. Zero is valid and represents an inactive
day.

## Displaying a fixed range

Without `range()`, Charts2 derives the calendar range from the first and last
point. Use `range(start, end)` when the chart should also show inactive days
outside that interval:

```js
import { HeatmapChart } from "@orchidsoftware/charts";

HeatmapChart.make("#activity")
  .range(new Date("2026-01-01T00:00:00Z"), new Date("2026-12-31T00:00:00Z"))
  .points(activity)
  .render();
```

## Naming the count

`countLabel()` names the unit in the tooltip and accessible text:

```js
import { HeatmapChart } from "@orchidsoftware/charts";

HeatmapChart.make("#activity").points(activity).countLabel("contributions").render();
```

## Color scale

For a heatmap, `colors()` defines a low-to-high intensity scale. Unlike a
series palette, the supplied colors are used once rather than cycled:

```js
import { HeatmapChart } from "@orchidsoftware/charts";

HeatmapChart.make("#activity")
  .points(activity)
  .colors(["#eff6ff", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"])
  .render();
```

## Rounded day cells

Use `radius()` to round each day cell in CSS pixels:

```js
import { HeatmapChart } from "@orchidsoftware/charts";

HeatmapChart.make("#activity").points(activity).radius(2).render();
```

## Formatting the tooltip

The heatmap tooltip provides `formatDate()` and `formatValue()`:

```js
import { HeatmapChart } from "@orchidsoftware/charts";

HeatmapChart.make("#activity")
  .points(activity)
  .tooltip((tooltip) => {
    tooltip.formatDate((date) => date.toLocaleDateString()).formatValue((value) => `${value} contributions`);
  })
  .render();
```

Calendar heatmaps also support the shared `title()`, `description()`,
`ariaLabel()`, `width()`, `height()`, `colors()`, `tooltip()`, and `onSelect()`
methods. See [Customization](./customization.md) for details.
