# Updates and Interaction

`render()` returns the mounted chart. Keep that value when data can change or
when your interface needs to react to the chart.

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar"])
  .dataset("Revenue", [42, 48, 57])
  .render();
```

## Replace the Data

`update(data)` replaces the complete data scene and redraws the existing chart.

```js
chart.update({
  labels: ["Feb", "Mar", "Apr"],
  datasets: [{ name: "Revenue", values: [48, 57, 63] }],
});
```

Send all datasets that should remain visible. The update is validated before
the current chart changes, so invalid data does not leave a half-updated view.

Series charts use this shape:

```js
chart.update({
  labels: ["Jan", "Feb", "Mar"],
  datasets: [
    { name: "Actual", values: [42, 48, 57], color: "#2563eb" },
    { name: "Plan", values: [45, 50, 55], color: "#94a3b8" },
  ],
});
```

Heatmaps and timesheets use their own domain data:

```js
activity.update({
  points: {
    "2026-08-27": 7,
    "2026-08-28": 4,
    "2026-08-29": 9,
  },
});

plan.update({
  tasks: [
    { label: "Design", start: "2026-09-01", end: "2026-09-03" },
    { label: "Build", start: "2026-09-03", end: "2026-09-08" },
  ],
});
```

## React to a Selection

Use `onSelect()` to connect a mark to the rest of your interface.

```js
import { BarChart } from "@orchidsoftware/charts";

BarChart.make("#orders")
  .labels(["Web", "Retail", "Partners"])
  .dataset("Orders", [124, 86, 43])
  .onSelect((selection) => {
    if (!selection) {
      closeDetails();
      return;
    }

    openDetails({
      channel: selection.label,
      orders: selection.value,
    });
  })
  .render();
```

The callback receives the selected label, value, dataset, and coordinates for
series charts. Composition charts add the selected color; heatmaps add a date
and key; timesheets add the task range and duration. It receives `undefined`
when the selection is cleared.

Pointer, touch, and keyboard input share the same selection model. Arrow keys
move between values, Enter or Space keeps a selection open, and Escape clears
it.

## Read a Normalized Point

`point(index)` returns an immutable snapshot without exposing internal SVG
nodes. Without an index it returns the active keyboard or pointer point, or the
first point when nothing is active.

```js
const first = chart.point();
const third = chart.point(2);
```

It returns `undefined` when the index is outside the chart data.

## Export the Chart

Every mounted chart can return its current SVG source or download an SVG file.
See [Exporting SVG](./exporting.md) for both workflows.

## Clean Up

Destroy a chart when its view is permanently removed:

```js
chart.destroy();
```

This removes the owned SVG, tooltip, observers, and event listeners. Calling
`destroy()` again is safe. A destroyed chart cannot be updated or exported.

For method signatures and chart-specific data shapes, use the
[API reference](./api-reference.md).
