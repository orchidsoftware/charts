# Naming policy

## Rules

1. Public authoring reads as a short sentence:
   `LineChart.make(parent).dataset(values).gradient().render()`. Mounted
   lifecycle remains `chart.point(0)`, `chart.update(data)`, `chart.toSvg()`,
   and `chart.download(name)`.
2. Application methods never use Java-style `getThing()` or `setThing()` names.
   Native Web API calls such as `getAttribute()` and `setAttribute()` retain the
   browser vocabulary. Property accessors remain nouns, for example
   `chart.element` and `model.datasets`.
3. A noun names a value or policy (`extent`, `legendLayout`, `valueScale`); a
   verb names an effect or transformation (`render`, `normalize`, `download`).
   Prefixes such as `create` and `calculate` are not added mechanically.
4. Domain terms win over generic technical terms. Short mathematical coordinates
   such as `x`, `y`, `cx`, and `cy` stay short because expansion reduces clarity.
5. Every JavaScript module and test uses PascalCase. `index.js` and
   tool-mandated `*.config.js` names are conventional exceptions.
6. Renderer roles are explicit: `*Renderer.js` exports one matching stateful
   class, while `*Rendering.js` exports named rendering functions and has no
   default export. A rendering module may keep private implementation classes.
7. Directories group cohesive reasons to change: authoring DSL, chart-family
   rendering, geometry, or presentation. Generic `helpers`, `utils`, `concerns`,
   `classes`, and `functions` directories are prohibited.
8. Classes, types, interfaces, and filenames use PascalCase; functions and variables use
   camelCase; constants use SCREAMING_SNAKE_CASE; CSS classes and URLs use
   kebab-case.

The architecture fitness suite rejects new application methods beginning with
`get` or `set`. ESLint separately enforces filename case, abbreviation policy,
JSDoc completeness, dependency cycles, and complexity budgets.

CSS classes and generated IDs use `orchid-charts-`; CSS custom properties use
`--orchid-charts-`. Environment flags use `ORCHID_CHARTS_`, and internal ESLint
rules use `orchid-charts/`.
