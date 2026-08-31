# Mixed charts

## Introduction

Mixed charts place line, bar, and scatter datasets on the same cartesian scale.
They are useful for comparing an actual value with a plan, or showing events
alongside a trend.

## Creating a mixed chart

```js
import { MixedChart } from "@charts2/core";
import "@charts2/core/style.css";

const chart = MixedChart.make("#plan")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .bar("Actual", [42, 48, 57, 63])
  .line("Plan", [45, 50, 55, 65])
  .render();
```

Unlike other series charts, mixed charts use a method named after the desired
dataset type.

## Line datasets

Use `line(name, values, colorOrCallback?)` to add a line:

```js
import { MixedChart } from "@charts2/core";

MixedChart.make("#plan")
  .labels(["Jan", "Feb", "Mar"])
  .line("Plan", [45, 50, 55], (line) => {
    line.color("#2563eb").smooth().dots(false).strokeWidth(3);
  })
  .render();
```

The callback supports every line-dataset method: `color()`, `opacity()`,
`formatValue()`, `smooth()`, `gradient()`, `dots()`, `dotSize()`, `line()`,
`area()`, and `strokeWidth()`.

## Bar datasets

Use `bar(name, values, colorOrCallback?)` to add bars:

```js
import { MixedChart } from "@charts2/core";

MixedChart.make("#plan")
  .labels(["Jan", "Feb", "Mar"])
  .bar("Actual", [42, 48, 57], (bars) => {
    bars.color("#8b5cf6").radius(5);
  })
  .render();
```

The callback supports `color()`, `opacity()`, `formatValue()`, and `radius()`.

## Scatter datasets

Use `scatter(name, values, colorOrCallback?)` to add individual observations:

```js
import { MixedChart } from "@charts2/core";

MixedChart.make("#plan")
  .scatter("Releases", [
    { x: 0, y: 42 },
    { x: 2, y: 57 },
  ])
  .render();
```

Scatter values may be `{ x, y }` points or numbers. The callback supports
`color()`, `opacity()`, and `formatValue()`.

## Gradient fills

Call `gradient()` on the chart to add a fading fill to every line dataset:

```js
import { MixedChart } from "@charts2/core";

MixedChart.make("#plan")
  .labels(["Jan", "Feb", "Mar"])
  .bar("Actual", [42, 48, 57])
  .line("Plan", [45, 50, 55])
  .gradient({ fromOpacity: 0.3, toOpacity: 0.02 })
  .render();
```

Use a line callback when only one line should have a gradient.

## Advanced dataset input

The named methods are the clearest way to add mixed data. When your data is
already stored as objects, `dataset()` also accepts an explicit `chartType`:

```js
import { MixedChart } from "@charts2/core";

MixedChart.make("#plan")
  .dataset({ chartType: "bar", name: "Actual", values: [42, 48, 57] })
  .dataset({ chartType: "line", name: "Plan", values: [45, 50, 55] })
  .render();
```

The `chartType` must be `"line"`, `"bar"`, or `"scatter"`. Its value also
determines which methods are available in an optional dataset callback.

Mixed charts also support the shared [cartesian presentation, formatting, and
annotation methods](./customization.md).
