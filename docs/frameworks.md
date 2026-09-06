# React, Vue, and Hotwire

## Introduction

Orchid Charts does not require a framework wrapper. A chart owns one host element and
returns a small lifecycle that maps directly to component mounting, updates,
and cleanup.

## React

Create the chart after the host element mounts. Keep the chart in a ref so data
changes can call `update()`, then destroy it from the effect cleanup:

```jsx
import { useEffect, useRef } from "react";
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

export function RevenueChart({ labels, values }) {
  const host = useRef(null);
  const chart = useRef(null);
  const initialData = useRef({ labels, values });

  useEffect(() => {
    const initial = initialData.current;

    chart.current = LineChart.make(host.current)
      .labels(initial.labels)
      .dataset("Revenue", initial.values)
      .gradient()
      .render();

    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.update({
      labels,
      datasets: [{ name: "Revenue", values }],
    });
  }, [labels, values]);

  return <div ref={host} />;
}
```

The first effect owns the chart lifecycle. The second replaces its data without
recreating the SVG or its event listeners.

If presentation methods such as `gradient()` or `height()` depend on props,
recreate the chart when those presentation props change. `update()` replaces
data; it does not reconfigure the chart type or builder options.

## Vue

Mount the chart in `onMounted()`, watch the data that may change, and destroy
the chart before the component unmounts:

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BarChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
});

const host = ref(null);
let chart;

onMounted(() => {
  chart = BarChart.make(host.value)
    .labels(props.labels)
    .dataset("Orders", props.values)
    .horizontal()
    .render();
});

watch(
  () => [props.labels, props.values],
  ([labels, values]) => {
    chart?.update({
      labels,
      datasets: [{ name: "Orders", values }],
    });
  },
);

onBeforeUnmount(() => chart?.destroy());
</script>

<template>
  <div ref="host" />
</template>
```

## Hotwire and Stimulus

Let a Stimulus controller own the chart element. Values keep server-rendered
data in the HTML, value callbacks update a controller preserved by a Turbo
morph, and `disconnect()` handles frame or page replacement.

Import the Orchid Charts stylesheet once from your JavaScript entry point:

```js
// app/javascript/application.js
import "@orchidsoftware/charts/style.css";
```

Put the chart data in Stimulus values. The `turbo:before-cache` action removes
the generated SVG before Turbo takes its snapshot, so restoring the page never
duplicates a cached chart:

```html
<div
  class="analytics-chart"
  data-controller="revenue-chart"
  data-action="turbo:before-cache@document->revenue-chart#destroy"
  data-revenue-chart-labels-value='["Jan", "Feb", "Mar", "Apr"]'
  data-revenue-chart-values-value="[42, 48, 57, 63]"
></div>
```

```js
// app/javascript/controllers/revenue_chart_controller.js
import { Controller } from "@hotwired/stimulus";
import { LineChart } from "@orchidsoftware/charts";

export default class extends Controller {
  static values = {
    labels: Array,
    values: Array,
  };

  chart = null;
  updateQueued = false;

  connect() {
    this.renderChart();
    this.observer = new MutationObserver(() => {
      if (this.chart && !this.element.contains(this.chart.element)) {
        this.renderChart();
      }
    });
    this.observer.observe(this.element, { childList: true });
  }

  renderChart() {
    this.chart?.destroy();
    this.chart = LineChart.make(this.element)
      .labels(this.labelsValue)
      .dataset("Revenue", this.valuesValue)
      .gradient()
      .render();
  }

  disconnect() {
    this.destroy();
  }

  labelsValueChanged() {
    this.queueUpdate();
  }

  valuesValueChanged() {
    this.queueUpdate();
  }

  destroy() {
    this.observer?.disconnect();
    this.chart?.destroy();
    this.chart = null;
  }

  queueUpdate() {
    if (!this.chart || this.updateQueued) return;

    this.updateQueued = true;

    queueMicrotask(() => {
      this.updateQueued = false;
      this.chart?.update({
        labels: this.labelsValue,
        datasets: [{ name: "Revenue", values: this.valuesValue }],
      });
    });
  }
}
```

The observer recreates the chart if a Turbo morph replaces its generated children,
even when the data values stay the same. The microtask combines adjacent label
and value mutations into one update.
When Turbo replaces the controller element, Stimulus destroys the old chart
and `connect()` renders the new one; no Turbo-specific global listener is
needed.

## Resizing

Do not calculate the component width for Orchid Charts. Unless `width()` is set, the
chart follows its host element and observes width changes automatically. Use
ordinary CSS to size the host:

```css
.analytics-chart {
  width: 100%;
  min-width: 0;
}
```

Continue with [Updates and interaction](./updates-and-interaction.md) for data,
selection, point snapshots, and cleanup details.
