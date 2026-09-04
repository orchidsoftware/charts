# Getting started

This page takes you from an empty element to a responsive product chart.

## Install Orchid Charts

Install the package with npm:

```bash
npm install @orchidsoftware/charts
```

Orchid Charts ships as an ES module. Import the chart you need and its stylesheet:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";
```

## Render your first chart

Add a host element to your page:

```html
<div id="revenue"></div>
```

Create a line chart inside it:

```js
import { LineChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const revenue = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Revenue", [42, 48, 57, 63])
  .render();
```

Orchid Charts uses the width of the host element and redraws when that width changes.
The default height, palette, axes, legend, labels, and tooltip are ready to use.

## Understand the chain

Every chart follows the same path:

```text
make(parent) → add data → render()
```

- `make(parent)` accepts a CSS selector or an `Element`.
- Data methods describe the values to show. Most charts use `labels()` and
  `dataset()`.
- `render()` mounts the chart and returns its small runtime API.

Methods before `render()` shape the whole chart:

```js
import { LineChart } from "@orchidsoftware/charts";

const revenue = LineChart.make("#revenue")
  .title("Monthly revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Revenue", [42, 48, 57, 63])
  .colors(["#2563eb"])
  .height(300)
  .smooth()
  .gradient()
  .render();
```

## Add another series

Call `dataset()` again. Names appear in the legend and tooltip.

```js
import { LineChart } from "@orchidsoftware/charts";

const revenue = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar", "Apr"])
  .dataset("Actual", [42, 48, 57, 63])
  .dataset("Plan", [45, 50, 55, 65])
  .colors(["#2563eb", "#94a3b8"])
  .render();
```

Each dataset must contain one value for every label.

## Use Orchid Charts without a build step

For a plain HTML page, use an import map and load the stylesheet with a
`<link>`. Pin an exact version in production.

```html
<div id="chart"></div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@orchidsoftware/charts@0.0.2/src/styles.css" />

<script type="importmap">
  {
    "imports": {
      "@orchidsoftware/charts": "https://cdn.jsdelivr.net/npm/@orchidsoftware/charts@0.0.2/dist/index.js"
    }
  }
</script>

<script type="module">
  import { BarChart } from "@orchidsoftware/charts";

  BarChart.make("#chart").labels(["Starter", "Team", "Business"]).dataset("Accounts", [84, 46, 21]).render();
</script>
```

Native browsers load CSS through `<link>`; a JavaScript `import` cannot load the
stylesheet without a bundler.

## Where to go next

- Pick a visualization in [Chart types](./chart-types.md).
- Make it fit your interface in [Customization](./customization.md).
- Connect it to changing data in [Updates and interaction](./updates-and-interaction.md).
