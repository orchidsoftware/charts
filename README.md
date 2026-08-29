# Charts2

**Charts that belong in your product.**

Charts2 turns everyday product data into clear, responsive SVG charts with one
small JavaScript API. It is built for dashboards, reports, activity views, and
release plans—not for turning every chart into a visualization project.

```bash
npm install @charts2/core
```

```js
import { BarChart } from "@charts2/core";
import "@charts2/core/style.css";

const revenue = BarChart.make("#revenue")
  .title("Revenue by region")
  .labels(["Europe", "Americas", "Asia-Pacific"])
  .dataset("Revenue", [31, 44, 38])
  .horizontal()
  .height(300)
  .render();

revenue.update({
  labels: ["Europe", "Americas", "Asia-Pacific"],
  datasets: [{ name: "Revenue", values: [37, 49, 46] }],
});
```

### No-build usage with import maps

Charts2 can run directly in modern browsers without npm or a bundler. Map the
same package name to the built ESM entry and load the explicit stylesheet with a
regular `<link>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@charts2/core@1.0.0/src/styles.css" />
<script type="importmap">
  {
    "imports": {
      "@charts2/core": "https://cdn.jsdelivr.net/npm/@charts2/core@1.0.0/dist/index.js"
    }
  }
</script>
<script type="module">
  import { LineChart } from "@charts2/core";

  LineChart.make("#chart").labels(["A", "B"]).dataset("Series", [1, 2]).render();
</script>
```

Pin an exact version in production. CSS uses a `<link>` because native browsers
do not treat `import "…/style.css"` as a standard JavaScript module import.

That is the whole idea. Every chart starts the same way, updates the same way,
and returns the same small lifecycle. There are no controllers to register,
constructor hierarchies to learn, or runtime dependencies to coordinate.

## Built for products, not chart projects

- **Looks at home.** Responsive sizing, balanced labels, legends, tooltips, and
  interaction states arrive together instead of as an assembly task.
- **One fluent language.** Line, donut, heatmap, and timesheet charts use named
  definitions, concise domain methods, and the same lifecycle.
- **Enough range for everyday product work.** Twelve chart types cover trends,
  comparisons, composition, activity, and planning without becoming a general
  visualization framework.
- **Easy to shape.** Axes, grid, labels, dots, legend, and tooltip can be removed
  independently. CSS variables let the chart follow the surrounding product.
- **Small by design.** Charts2 ships tree-shakeable ESM, explicit CSS, source
  maps, and TypeScript declarations with zero runtime dependencies.

Charts2 makes the common case feel finished while keeping the uncommon details
explicit.

## Choose the chart that answers the question

| Product question                | Chart types                        |
| ------------------------------- | ---------------------------------- |
| What is changing?               | Line, bar, mixed axis              |
| How do items compare or relate? | Scatter, bubble, radar             |
| How is the whole divided?       | Pie, donut, percentage, polar area |
| When does the work happen?      | Timesheet                          |
| When does activity repeat?      | Calendar heatmap                   |

Bar charts can be vertical or horizontal, grouped or stacked. Line and bar
charts can become compact, frameless views by removing presentation layers;
they keep the same chart type and lifecycle.

TypeScript autocomplete follows the chosen named definition and exposes only
methods that make sense for that chart. See [API.md](./docs/API.md).

## Product details are already included

Pointer, touch, keyboard, focus, and persistent selection use one interaction
model. Arrow keys inspect values, Enter and Space keep a selection open, and
Escape clears it. Cartesian tooltips show every series at the inspected
category, making comparisons easy without precise pointing.

Keyboard navigation, descriptive SVG content, reduced-motion behavior, and
readable value labels are included automatically. They are part of a finished
chart, not a separate accessibility setup.

```js
const plan = TimesheetChart.make("#release-plan")
  .title("Version 1.0 release plan")
  .task({ label: "Design review", start: "2026-09-01", end: "2026-09-03", group: "Design" })
  .task({ label: "Implementation", start: "2026-09-03", end: "2026-09-08", group: "Engineering" })
  .render();
```

## One small lifecycle

```js
chart.element; // Owned SVG element
chart.update(nextData); // Replace data atomically
chart.point(index); // Read a normalized public point
chart.toSvg(); // Serialize the current chart
chart.download("revenue"); // Download the current SVG
chart.destroy(); // Release DOM and listeners
```

The package exports twelve frozen named definitions such as `LineChart`,
`BarChart`, and `TimesheetChart`. Internal renderers and constructors remain
implementation details.

## Built to hold up

Version 1.0.0 is protected by:

- committed visual baselines covering complete pages, individual charts,
  mobile and dark appearance, hover, pressed, focus, and selected states;
- 100% statement, branch, function, and line coverage for published JavaScript;
- explicit performance budgets for large initial renders and repeated updates;
- architecture fitness tests, strict JSDoc, ESLint, Stylelint, TypeScript, and
  package-content inspection;
- demanding fixtures for fractions, millions, signed values, flat series,
  dense timelines, long labels, and multilingual content.

The product demo leads with recognizable scenarios. The separate technical
laboratory at `demo/lab.html` renders all 26 product and edge-case fixtures,
grouped by chart type, as the reference surface for QA and regression tests.

## Development

```bash
npm ci
npx playwright install chromium
npm run dev
npm run test:lab
npm run check
npm run pack:check
```

`npm run check` verifies formatting, JavaScript and CSS quality, declarations,
browser coverage, performance budgets, visual behavior, and production builds.
Intentional rendering changes must be reviewed before accepting new visual
baselines with `npm run test:visual:update`.

## Design and architecture

- [API](./docs/API.md) — the complete public contract.
- [Architecture](./docs/ARCHITECTURE.md) — lifecycle ownership and dependency
  direction.
- [Design audit](./docs/DESIGN_AUDIT.md) — interaction and visual decisions.
- [Performance](./docs/PERFORMANCE.md) — measurable rendering budgets.
- [Refactoring decisions](./docs/REFACTORING.md) — the opinion matrix and ADRs.
- [Positioning](./docs/POSITIONING.md) — the product category, message hierarchy,
  and go-to-market plan.
- [Releasing](./docs/RELEASING.md) — the version 1.0.0 publication gate.

## Browser support

Charts2 targets current evergreen browsers and uses responsive SVG rather than
canvas. Development requires Node.js 22.12 or newer.

## Attribution and license

Charts2 is maintained by [@tabuna](https://github.com/tabuna) and distributed
under the [MIT License](./LICENSE).
