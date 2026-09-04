# Line charts

## Introduction

Line charts are a good choice when the shape of change matters: revenue over
time, response time by hour, or the growth of several plans. A line chart may
contain one or more datasets, and every dataset must contain one value for each
label.

## Creating a line chart

Import `LineChart`, choose a host element with `make()`, add the labels and
values, and call `render()`:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Revenue", [42, 48, 57, 63])
  .render();
```

The value returned by `render()` is the mounted chart. You may use it to
[update the data](./updates-and-interaction.md#replace-the-data), react to a
selection, or export the SVG.

## Multiple lines

Call `dataset()` once for each line. Named datasets appear in the legend and
tooltip:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Actual", [42, 48, 57, 63])
  .dataset("Plan", [45, 50, 55, 65])
  .colors(["#2563eb", "#94a3b8"])
  .render();
```

## Smooth lines

The `smooth()` method rounds the path between points. It applies to every line
in the chart:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#signups")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Signups", [120, 156, 184, 231])
  .smooth()
  .render();
```

You may pass a boolean when the choice is conditional:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#signups").dataset(values).smooth(shouldSmooth).render();
```

## Gradient and area fills

The `gradient()` method fills the area beneath every visible line with a
fading version of its color:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Revenue", [42, 48, 57, 63])
  .gradient()
  .render();
```

To control the fade, pass the starting and ending opacity:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .dataset([42, 48, 57, 63])
  .gradient({ fromOpacity: 0.35, toOpacity: 0.02 })
  .render();
```

Use `area()` for a solid area fill. Use `line(false)` when the filled shape
should appear without its line:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#usage").dataset([18, 24, 31, 39]).area().line(false).render();
```

## Points and stroke

Use `dots(false)` to hide points, `dotSize()` to resize them, and
`strokeWidth()` to change the line width:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#latency").dataset([180, 210, 195, 205]).dots(false).dotSize(5).strokeWidth(3).render();
```

## Compact line charts

`frameless()` hides the axes, grid, direct values, legend, tooltip, and points
unless you explicitly enable one of them. This is useful for a chart embedded
inside a small metric card:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue-trend").dataset([42, 48, 57, 63]).height(90).gradient().frameless().render();
```

## Customizing one line

Chart-level methods are the usual choice. When one line needs different
styling, configure only that dataset:

```js
import { LineChart } from "@orchidsoftware/charts";

LineChart.make("#revenue")
  .dataset("Actual", [42, 48, 57], (line) => {
    line.color("#2563eb").smooth().gradient().strokeWidth(3);
  })
  .dataset("Plan", [45, 50, 55], (line) => {
    line.color("#94a3b8").dots(false).opacity(0.7);
  })
  .render();
```

A line dataset supports `color()`, `opacity()`, `formatValue()`, `smooth()`,
`gradient()`, `dots()`, `dotSize()`, `line()`, `area()`, and `strokeWidth()`.

Line charts also support the shared [cartesian presentation, formatting, and
annotation methods](./customization.md).
