# Charts2

**Make the data clear. Keep the charting out of the way.**

Charts2 is an expressive, accessible SVG charting library with one factory and
zero runtime dependencies. Twelve visual grammars share the same responsive
lifecycle, interaction language, update contract, and export path.

```bash
npm install @charts2/core
```

```js
import { createChart } from "@charts2/core";
import "@charts2/core/style.css";

const revenue = createChart("#revenue", {
  type: "bar",
  orientation: "horizontal",
  ariaLabel: "Revenue by region",
  data: {
    labels: ["Europe", "Americas", "Asia-Pacific"],
    datasets: [{ name: "Revenue", values: [31, 44, 38] }],
  },
});

revenue.update({
  labels: ["Europe", "Americas", "Asia-Pacific"],
  datasets: [{ name: "Revenue", values: [37, 49, 46] }],
});
```

That is the happy path for every chart type. There is no default export,
constructor hierarchy, plugin registration, or alternate lifecycle to learn.

## Why Charts2

- **One expressive entry.** `createChart(host, options)` reads the same for a
  line, donut, heatmap, or release plan.
- **Useful by default.** Responsive sizing, scales, labels, legends, tooltips,
  keyboard navigation, and accessible semantics arrive together.
- **Explicit when it matters.** Presentation layers such as axes, grid, dots,
  labels, legend, and tooltip can be removed independently—without switching to
  a special compact API.
- **Small operational footprint.** Charts2 ships ESM, CommonJS, CSS, source maps,
  and TypeScript declarations with zero runtime dependencies.
- **One owned lifecycle.** Update data, inspect a point, export SVG, download,
  or destroy the chart through the same returned object.

Charts2 compresses the charting machinery so application code can stay focused
on the question the data needs to answer.

## One API, twelve visual grammars

| Question                        | Chart types                        |
| ------------------------------- | ---------------------------------- |
| How is something changing?      | Line, bar, mixed axis              |
| How do items compare or relate? | Scatter, bubble, radar             |
| How is a whole composed?        | Pie, donut, percentage, polar area |
| When does work happen?          | Timesheet                          |
| How does activity repeat?       | Calendar heatmap                   |

Bar charts can be vertical or horizontal, grouped or stacked. Line and bar
charts can become frameless by explicitly removing presentation layers; they do
not switch to another chart type or lifecycle.

The discriminated TypeScript contract guides options from the selected `type`.
The complete option surface is documented in [API.md](./docs/API.md).

## Interaction is part of the chart

Pointer, touch, keyboard, focus, and persistent selection use one state model.
Arrow keys inspect categories or marks, Enter and Space pin a selection, and
Escape clears it. Cartesian tooltips show every series at the inspected
category, so comparison does not require pixel-perfect pointing.

Charts expose a labelled chart group, descriptive SVG content, one roving tab
stop, and readable value labels. Motion is optional and automatically respects
reduced-motion preferences.

```js
const plan = createChart("#release-plan", {
  type: "timesheet",
  ariaLabel: "Version 1.0 release plan",
  data: {
    tasks: [
      { label: "Design review", start: "2026-09-01", end: "2026-09-03", group: "Design" },
      { label: "Implementation", start: "2026-09-03", end: "2026-09-08", group: "Engineering" },
    ],
  },
});
```

## Designed to hold up

Version 1.0.0 is protected by:

- 76 committed visual baselines covering complete pages, individual charts,
  mobile and dark appearance, hover, pressed, focus, and selected states;
- 100% statement, branch, function, and line coverage for published JavaScript;
- explicit performance budgets for large initial renders and repeated updates;
- architecture fitness tests, strict JSDoc, ESLint, Stylelint, TypeScript, and
  package-content inspection;
- demanding fixtures for fractions, millions, signed values, flat series,
  dense timelines, long labels, and multilingual content.

The demo presents recognizable product scenarios first and keeps those demanding
fixtures available in its optional **Quality Lab**.

## Public lifecycle

```js
chart.element; // Owned SVG element
chart.update(nextData); // Replace data atomically
chart.point(index); // Read a normalized public point
chart.toSvg(); // Serialize the current chart
chart.download("revenue.svg"); // Download without another renderer
chart.destroy(); // Release DOM and listeners
```

Only `createChart` is exported. Internal renderer classes are implementation
details, not extension points that consumers must coordinate.

## Development

```bash
npm ci
npx playwright install chromium
npm run dev
npm run check
npm run pack:check
```

`npm run check` formats JavaScript, TypeScript, CSS, HTML, Markdown, JSON, and
YAML; runs strict ESLint/JSDoc and Stylelint gates; verifies declarations; runs
the Chromium coverage and visual suite; enforces performance budgets; and builds
the ESM, CommonJS, and CSS artifacts.

Intentional rendering changes must be reviewed in reference, actual, and diff
images before accepting them with `npm run test:visual:update`.

## Design and architecture

- [API](./docs/API.md) — the complete public contract.
- [Architecture](./docs/ARCHITECTURE.md) — lifecycle ownership and dependency
  direction.
- [Design audit](./docs/DESIGN_AUDIT.md) — accessibility, interaction, and visual
  decisions.
- [Performance](./docs/PERFORMANCE.md) — measurable rendering budgets.
- [Refactoring decisions](./docs/REFACTORING.md) — the opinion matrix and ADRs.
- [Releasing](./docs/RELEASING.md) — the version 1.0.0 publication gate.

JavaScript modules use PascalCase, with `index.js` and tool-required
`*.config.js` files as documented exceptions. Classes own identity, state,
lifecycle, or polymorphic behavior; stateless calculations remain functions.
Production functions and methods use explanatory multiline JSDoc with typed,
described parameters.

## Browser support

Charts2 targets current evergreen browsers and uses responsive SVG rather than
canvas. Development requires Node.js 22.12 or newer.

## Attribution and license

Charts2 is maintained by [@tabuna](https://github.com/tabuna) and distributed
under the [MIT License](./LICENSE). Work derived from Frappe Charts remains
credited in [NOTICE](./NOTICE).
