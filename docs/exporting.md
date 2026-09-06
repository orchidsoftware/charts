# Exporting SVG

## Introduction

Every Orchid Charts chart is rendered as SVG. The runtime API can return that SVG as
a string or download it as a file. Export always uses the chart's current data
and presentation.

## Getting the SVG Source

The `toSvg()` method returns the complete SVG markup as a string:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Revenue", [42, 48, 57, 63])
  .render();

const source = chart.toSvg();
```

Orchid Charts copies the computed presentation styles into the exported SVG. This
makes the result self-contained when it is opened outside the current page.

You may send the string to your own storage or download service:

```js
await fetch("/reports/revenue.svg", {
  method: "PUT",
  headers: { "Content-Type": "image/svg+xml" },
  body: chart.toSvg(),
});
```

## Downloading an SVG File

The `download()` method starts a browser download:

```js
import { BarChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = BarChart.make("#orders")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Orders", [124, 86, 43])
  .render();

chart.download("orders-by-channel");
```

Orchid Charts adds the `.svg` extension when it is not supplied. If the filename is
omitted, the chart title is used; a chart without a title downloads as
`Chart.svg`.

The filename must not be empty or contain `/` or `\\` path separators.

## Exporting Updated Data

Export reflects the latest successful update:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar"])
  .dataset("Revenue", [42, 48, 57])
  .render();

chart.update({
  labels: ["Feb", "Mar", "Apr"],
  datasets: [{ name: "Revenue", values: [48, 57, 63] }],
});

chart.download("latest-revenue");
```

An invalid update leaves the previous chart unchanged, so a later export still
contains the last successfully rendered data.

## Exporting After Cleanup

Do not call `toSvg()` or `download()` after `destroy()`. Destroying a chart
releases its SVG and browser resources, and the chart can no longer be used.
