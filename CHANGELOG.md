# Changelog

All notable changes to Charts2 are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

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

## 1.0.0 - 2026-08-26

### Added

- Twelve frozen named fluent definitions for SVG chart grammars: line, bar, scatter,
  mixed axis, pie, donut, percentage, heatmap, bubble, radar, polar area, and
  timesheet.
- Responsive rendering, export, updates, destruction, accessible chart
  semantics, roving keyboard navigation, tooltips, and persistent selection.
- ESM, CommonJS, CSS, and TypeScript package entry points with zero runtime
  dependencies.
- Browser tests for pointer, hover, pressed, focus, keyboard, selection, mobile,
  dark, full-demo, and individual chart states.
- Automated formatting, linting, type checks, 100% code coverage, performance
  budgets, builds, package inspection, dependency review, and CodeQL analysis.

### Changed

- Replaced the inherited upstream constructor surface with one explicit,
  discriminated configuration contract.
- Split lifecycle, render strategies, domain layout, and stateless support into
  directional architectural boundaries.

### Removed

- Deprecated constructors, the default export, implicit chart types, Sparkline,
  compact aliases, and dormant compatibility code.
