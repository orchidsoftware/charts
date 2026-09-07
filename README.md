# Orchid Charts

**Charts that belong in your product.**

Orchid Charts is a JavaScript library for dashboards, reports, activity calendars,
and release plans. Turn your data into interactive SVG charts with a short,
consistent API and ready-to-use axes, tooltips, and keyboard navigation.

[Live demo](https://charts.orchid.software/) · [Documentation](https://charts.orchid.software/docs/)

## Quick start

```bash
npm install @orchidsoftware/charts
```

Add a chart container:

```html
<div id="revenue"></div>
```

Import the chart and its stylesheet, then render your data:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const revenue = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
  .dataset("Revenue", [42, 48, 57, 63, 68, 76])
  .render();
```

The chart follows its container's width. Keep the returned instance to update its
data with `update()`, download an SVG with `download()`, and release resources
with `destroy()` when the view is removed.

## Use it in your product

Twelve chart types share the same lifecycle, from line and bar charts to calendar
heatmaps and timelines. The package includes TypeScript declarations,
tree-shakeable ESM, and zero runtime dependencies.

- [React, Vue, and Hotwire](https://charts.orchid.software/docs/frameworks.html) — connect charts to component lifecycles.
- [Customization](https://charts.orchid.software/docs/customization.html) — match your interface with CSS variables and chart options.
- [Large data](https://charts.orchid.software/docs/large-data.html) — aggregate records or select a range before rendering.

## License

[MIT](./LICENSE). Part of [Orchid Software](https://orchid.software), maintained
by [@tabuna](https://github.com/tabuna).
