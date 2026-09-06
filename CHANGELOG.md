# Changelog

All notable changes to Orchid Charts are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Hover inspection now works automatically for long line, bar, and compatible
  mixed series, including hidden dots. Dense charts use a constant number of
  interaction elements and support keyboard and touch inspection. The per-family
  gzip budget is now 22.8 kB (previously 22.4 kB) for this default interaction.

- Cartesian x-axis labels now use measured text widths to skip crowded labels
  instead of truncating every date. Endpoint labels stay inside the plot, and
  responsive resizing adjusts label density without dropping data points.

## 0.0.3 - 2026-09-06

### Changed

- Prefer `system-ui` throughout the library, demo, and documentation, with the
  same font stack used for canvas label measurement.

- Removed completed maintainer audits and superseded proposals; refreshed the
  remaining architecture, naming, testing, performance, and release guidance.

- Renamed internal environment flags to `ORCHID_CHARTS_*` and aligned ESLint
  rule names and test globals with Orchid Charts.

- Renamed CSS classes and generated element IDs from `charts2-` to
  `orchid-charts-`, including the demo theme variables. Custom CSS selectors
  targeting the old classes must use the new prefix. Library theme variables
  now use `--orchid-charts-*` instead of `--charts-*`.

- Published static documentation alongside the demo,
  with clearer sizing guidance and readable fluent examples.
- Stabilized demo loading heights, linked documentation calls to action to the
  guides, and clarified chart updates, destruction, and persistent selection.

- Radar inspection now follows measures across every profile, using wide sectors
  and the standard compact series tooltip. Arrow keys move between measures;
  `onSelect` and `point()` now address the measure instead of an entire dataset.
- Radar tooltips keep long series names readable and reserve space for the legend;
  Escape also dismisses a tooltip without a selection callback.

- Limited calendar heatmap cells to 32 CSS pixels so short date ranges remain
  compact, with space below the intensity legend for its text.
- Allowed tooltips to use the chart's available height instead of clipping
  twelve-series lists at 240 pixels.
- Consolidated render metadata, model point lookup, annotation rendering, and
  formatting helpers, with browser-independent model policy tests.
- Added lab fixtures for zero, million-scale, empty, and twelve-parameter inputs
  across every chart family, including copyable examples and validation errors.

- Bubble charts now fit their automatic coordinate domains around complete circles
  on render, update, and resize, preserving explicit pixel radii and the existing API.

- Made auxiliary marker and region labels opaque with thin theme-aware outlines
  for readability over data, retaining secondary text colors and the existing API.

- Unified categorical legends below the plot with compact color dots,
  content-sized items, consistent spacing, and whole-item wrapping.
- Consolidated series and composition legend placement into one shared content
  layout, removing separate Cartesian and radar top-legend calculations.
- Reduced default line point radius to 3 px, outline to 2 px, and separator
  stroke to 3 px without changing inspection targets or the public API.

## 0.0.2 - 2026-09-04

### Changed

- Renamed the public product from Charts2 to Orchid Charts across the demo,
  documentation, repository templates, and release presentation.
- Refreshed the README hero and visual regression references with the Orchid
  logo, permanent card-header copy actions, and Linux Chromium baselines.
- Made CI diagnostics include hidden Vitest attachments and audit only the
  dependency graph shipped to package consumers.

## 0.0.1 - 2026-09-04

### Added

- Twelve frozen named fluent definitions for SVG chart grammars: line, bar, scatter,
  mixed axis, pie, donut, percentage, heatmap, bubble, radar, polar area, and
  timesheet.
- Responsive rendering, export, updates, destruction, accessible chart
  semantics, roving keyboard navigation, tooltips, and persistent selection.
- ESM, CSS, and TypeScript package entry points with zero runtime
  dependencies.
- Browser tests for pointer, hover, pressed, focus, keyboard, selection, mobile,
  dark, full-demo, and individual chart states.
- Automated formatting, linting, type checks, 100% code coverage, performance
  budgets, builds, package inspection, dependency review, and CodeQL analysis.
- GitHub Pages deployment for the product demo and QA laboratory at
  `charts.orchid.software`.

### Changed

- Require JavaScript array literals with three or more elements to place each
  element on its own line, with matching ESLint and Prettier enforcement.
- Require directly returned object literals with two or more properties to
  place each property on its own line.
- Updated the public declaration compatibility gate to TypeScript 7. SonarJS
  remains isolated on TypeScript 5.9.3 until its analyzer supports the newer
  compiler API.
- Switched the unpublished package to ESM-only module-preserving output with
  closed exports and explicit CSS loading.
- Bound each named definition directly to its model and renderer functions so
  root imports can tree-shake unused chart families without subpath imports.
- Added per-family gzip/source gates, SSR import coverage, and a compact
  Chromium/Firefox/WebKit lifecycle suite.
- Added documented no-build/import-map consumption with a native static-server
  test in Chromium, Firefox, and WebKit.
- Corrected the release size gate to use the actual module-preserving package
  baseline while retaining strict per-family and production-source ratchets.

- Reframed the demo as a concise product story with exact API language,
  verifiable release metrics, a stronger usage ending, and a compact release
  footer.
- Moved demanding datasets into an optional Quality Lab disclosure so precision,
  localization, density, signed values, and flat-series evidence remains
  inspectable without overwhelming the primary showcase.
- Aligned the package description, README, and demo around one evidence-backed
  promise: expressive SVG charts, one factory, useful defaults, and zero runtime
  dependencies.
- Reduced the demo index to four real visual families in one proportional row;
  frameless presentation remains a documented Line/Bar configuration instead of
  pretending to be a fifth chart family.
- Rebuilt the family index icons as one SVG language with shared guides, stroke
  weights, radii, fills, and semantic secondary-series color. Individual links
  no longer render cramped hover cards around long labels such as Percentage.

- Replaced the inherited upstream constructor surface with one explicit,
  discriminated configuration contract.
- Split lifecycle, render strategies, domain layout, and stateless support into
  directional architectural boundaries.

### Removed

- Deprecated constructors, the default export, implicit chart types, Sparkline,
  compact aliases, and dormant compatibility code.
