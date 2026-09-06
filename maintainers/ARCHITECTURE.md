# Architecture

Orchid Charts is a dependency-free SVG library with twelve frozen named chart
definitions. `src/index.js` binds each definition to its builder, model factory,
and renderer. `src/index.d.ts` describes the public API; `docs` explains its use.

## Ownership

- `core/builders` owns detached authoring state, immediate validation, and
  callback scopes. A successful render consumes the builder.
- `core/ChartData.js` creates immutable family models. `ChartPoints.js` and
  `ChartSelection.js` project model data into public point and selection payloads.
- `core/Chart.js` owns the mounted chart lifecycle: render, update, resize,
  export, and destruction.
- `InteractionController.js` owns pointer, keyboard, focus, and selection state.
  `ChartTooltip.js` owns safe tooltip DOM and viewport placement.
- `renderers` turns a normalized chart into SVG through `SvgSurface.js`.
  Cartesian, composition, and temporal subdirectories hold family presentation.
  Radar inspection uses measure sectors shared across all profiles.
- `support/data`, `support/geometry`, and `support/presentation` hold normalization,
  geometry, formatting, and layout policies. Browser measurement stays at the
  DOM boundary.

Use classes for owned state and lifecycle, and functions for stateless work.
Renderer modules depend on normalized snapshots, not mutable builders. Builders
must not import renderers or resolve browser hosts before `render()`.

## Public boundary

Consumers import named definitions and the stylesheet through the package exports.
The build preserves ESM modules so unused chart families can be tree-shaken.
Keep runtime dependencies at zero. The `files` allowlist in `package.json` controls
publication; tests, demo sources, maintainer notes, and diagnostics stay private
to the repository.

Updates validate new data before replacing the rendered state. Destruction removes
owned DOM, observers, and listeners. Tooltip text is created with text nodes, not
HTML interpolation. Theme selectors use the `orchid-charts` namespace.

The demo and QA laboratory use the same public API as consumers. Shared
infrastructure must not introduce a second renderer or demo-only lifecycle.

## Verification

`npm run check` enforces formatting, linting, model policies, public types,
100% production coverage, runtime budgets, browser compatibility, package size,
native import-map loading, and server-side import safety.

See [Naming policy](./NAMING.md), [Performance](./PERFORMANCE.md), and
[Visual testing](./VISUAL_MATRIX.md) for the corresponding maintenance rules.
