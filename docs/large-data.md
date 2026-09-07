# Large Data

Choose the question and the visible range before sending data to a chart.
For an overview, aggregate records into meaningful intervals. For individual
measurements, show a selected window of the original series.

Orchid Charts renders the Line and Bar values you supply without automatically
aggregating or downsampling them. There is no universal point-count limit:
cost depends on the chart type, labels, browser, and device. In particular, Bar
creates individual SVG marks. The QA lab includes 100,000-value Line and Bar
examples; these are manual diagnostics, not supported performance targets.

Successful SVG construction is not proof that a browser can paint an arbitrarily
large path. For dense lines, `.dots(false).smooth(false)` avoids marker and cubic
smoothing work while retaining every supplied point. It still cannot make a
million values individually distinguishable in a small viewport. Dense bars
overlap because their minimum width is 2 px; use a selected range to inspect them.

## Aggregate for an Overview

For daily revenue, sum order amounts per day. Prefer doing this on the server
so the browser receives daily totals instead of every order. This standalone
example uses a small local array to show the transformation:

```html
<div id="daily-revenue"></div>
```

```js
import { BarChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const orders = [
  { createdAt: "2026-09-02T10:00:00Z", amountCents: 4200 },
  { createdAt: "2026-09-01T08:00:00Z", amountCents: 1500 },
  { createdAt: "2026-09-01T16:00:00Z", amountCents: 2300 },
  { createdAt: "2026-09-02T18:00:00Z", amountCents: 800 },
];
const daily = new Map();

for (const order of orders) {
  const day = new Date(order.createdAt).toISOString().slice(0, 10);
  daily.set(day, (daily.get(day) ?? 0) + order.amountCents);
}

const days = [...daily.keys()].sort();
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const chart = BarChart.make("#daily-revenue")
  .labels(days)
  .dataset("Daily revenue", days.map((day) => daily.get(day) / 100))
  .formatValue((value) => currency.format(value))
  .render();
```

The resulting bars are **$38 on September 1** and **$50 on September 2**.
This example groups by UTC day and includes only days with orders. Choose your
reporting timezone explicitly; fill missing dates with zero only when they
mean no activity rather than missing data.

The operation is part of your metric: use a sum for revenue, a mean for average
measurements, or a maximum for peaks. These are different questions. When
combining averages, retain each group's count so you can weight them correctly.
Tooltips and selections describe the supplied aggregates, not individual orders.

## Window for Detail

For a detailed trend, pass a contiguous range with its matching labels. This
example generates 10,000 readings but renders only the latest 120:

```html
<div id="readings"></div>
```

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const readings = Array.from({ length: 10_000 }, (_, index) => ({
  label: `Reading ${index + 1}`,
  value: 20 + Math.sin(index / 10) * 5,
}));

function windowData(end) {
  const visible = readings.slice(Math.max(0, end - 120), end);
  return {
    labels: visible.map((reading) => reading.label),
    datasets: [{ name: "Temperature", values: visible.map((reading) => reading.value) }],
  };
}

const initial = windowData(readings.length);
const chart = LineChart.make("#readings")
  .labels(initial.labels)
  .dataset(initial.datasets[0])
  .formatValue((value) => `${value.toFixed(1)} °C`)
  .render();

// For example, when the user selects the preceding range:
chart.update(windowData(readings.length - 120));
```

Each window keeps the original values and labels in order. `chart.point(0)`
refers to the first item in the current window; retain your source identifiers
when opening record details. The value axis is calculated from the current
window. For remote data, request the selected range from your API instead of
loading the entire history. Handle an empty response before rendering as shown
in [Updates and interaction](./updates-and-interaction.md).

Call `chart.destroy()` when removing either example's view. See
[Exporting SVG](./exporting.md) to export the currently displayed totals or range.
