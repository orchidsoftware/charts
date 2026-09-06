# Orchid Charts

**Charts that belong in your product.**

Orchid Charts turns everyday product data into clear, responsive SVG charts. One
small JavaScript API covers dashboards, reports, activity views, and release
plans—without turning chart configuration into a project.

**[Explore the live demo →](https://charts.orchid.software)**

[Try your data](https://charts.orchid.software/#try) · [Browse chart types](#choose-a-chart) · [Documentation](#documentation)

![Orchid Charts rendering a revenue chart inside a product dashboard](https://raw.githubusercontent.com/orchidsoftware/charts/master/.github/assets/orchid-charts-hero.png)

```bash
npm install @orchidsoftware/charts
```

Add an element for the chart:

```html
<div id="revenue"></div>
```

Then choose a chart, add your data, and render it:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const revenue = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
  .dataset("Revenue", [42, 48, 57, 63, 68, 76])
  .colors(["#8267aa"])
  .height(260)
  .render();
```

The result is responsive and already includes axes, labels, a tooltip,
keyboard navigation, and accessible SVG text.

## From your data to your interface

**Get a finished chart from a short example.** Axes, tooltips, keyboard navigation,
and container resizing are included. [Try your own values in the demo](https://charts.orchid.software/#try)
and see the code change with the chart.

**Carry one API across your product.** Use line and bar charts for revenue,
a donut for expenses, a calendar heatmap for activity, and a timeline for a
release plan. Every type shares `update()`, selection, SVG export, and `destroy()`.

**Bring your own theme.** CSS variables control labels, grids, tooltips, and focus
colors. Data colors stay explicit in your code. Try the light and dark surfaces
in the demo, then copy the [theme recipe](./docs/customization.md#match-the-surrounding-interface).

## Shape the result

Chart-wide methods keep common changes close to the data:

```js
import { BarChart } from "@orchidsoftware/charts";

const orders = BarChart.make("#orders")
  .title("Orders by status")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Shipped", [124, 86, 43])
  .dataset("Processing", [32, 18, 12])
  .colors(["#2563eb", "#f59e0b"])
  .horizontal()
  .stacked()
  .height(280)
  .render();
```

Use the same vocabulary across all twelve chart types:

```text
Choose a chart → make(parent) → add data → shape it → render()
```

## Choose a chart

![Line, stacked bar, donut, and timesheet charts rendered by Orchid Charts](https://raw.githubusercontent.com/orchidsoftware/charts/master/.github/assets/orchid-charts-gallery.png)

| If you want to show…              | Start with…                                    |
| --------------------------------- | ---------------------------------------------- |
| Change over time                  | `LineChart`                                    |
| Comparisons between categories    | `BarChart`                                     |
| A line and bars on one scale      | `MixedChart`                                   |
| Relationships between values      | `ScatterChart` or `BubbleChart`                |
| Parts of a whole                  | `PieChart`, `DonutChart`, or `PercentageChart` |
| A profile across several measures | `RadarChart` or `PolarAreaChart`               |
| Activity by day                   | `HeatmapChart`                                 |
| Work across a timeline            | `TimesheetChart`                               |

See [Chart types](./docs/chart-types.md) for a dedicated guide to every chart.

## Update a chart

Keep the value returned by `render()` and replace its data when your product
state changes:

```js
revenue.update({
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [{ name: "Revenue", values: [45, 52, 61, 70, 74, 82] }],
});
```

Export the current chart, including its computed styles, and release its resources
when the view is removed:

```js
revenue.download("monthly-revenue");
revenue.destroy();
```

## Where it fits

Orchid Charts focuses on dashboards, reports, activity views, and release plans.
Its twelve SVG chart types are built for everyday product data in current browsers.
For very large datasets, aggregate or window the data before rendering individual marks.

The package includes tree-shakeable ESM, TypeScript declarations, explicit CSS, and
zero runtime dependencies. It works with plain JavaScript and component lifecycles;
see the [React, Vue, and Hotwire examples](./docs/frameworks.md).

## Documentation

- [Getting started](./docs/getting-started.md) — install Orchid Charts and render your first chart.
- [Chart types](./docs/chart-types.md) — choose the chart that answers your question.
- [Customization](./docs/customization.md) — change color, layout, labels, and presentation.
- [Updates and interaction](./docs/updates-and-interaction.md) — connect charts to live product state.
- [Exporting SVG](./docs/exporting.md) — serialize or download the current chart.
- [React, Vue, and Hotwire](./docs/frameworks.md) — mount, update, and clean up charts in components.
- [API reference](./docs/api-reference.md) — scan the complete public vocabulary.

Orchid Charts has zero runtime dependencies, includes TypeScript declarations, and
targets current evergreen browsers. It is part of
[Orchid Software](https://orchid.software), maintained by
[@tabuna](https://github.com/tabuna), and released under the [MIT License](./LICENSE).
