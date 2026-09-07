# Performance

Runtime budgets are measured by `npm run test:performance` without coverage
instrumentation. `npm run coverage` excludes that timing-only file so V8
profiling overhead cannot turn a stable runtime budget into a machine-dependent
failure; the complete `npm run check` still executes both gates sequentially.

Performance is part of the release gate. `npm run test:performance` runs in Vitest Browser Mode using headless Chromium.

Current budgets:

- keep every single named chart import with CSS at or below 23.5 kB gzip;
- render a typical 90-day line chart in less than 50 ms;
- render a 50,000-point SVG line in less than 1,000 ms;
- perform 200 live updates of a 100-point line in less than 1,000 ms.

Run `npm run test:size` to create a fresh production build and enforce the bundle
budget. The regular `npm run build` and full `npm run check` paths enforce the
same limit.

The budgets include input normalization, scale calculation, SVG path generation, and DOM replacement. They run as part of `npm run check`, so a regression blocks release.

The size gate creates twelve temporary consumer applications. Each imports one
named definition from `@orchidsoftware/charts`, imports `@orchidsoftware/charts/style.css`, uses
the definition, runs production Vite/Terser tree-shaking, and gzip-compresses JS
and CSS separately at level 9. Combination builds report the cost of importing several chart families together;
they are diagnostics and do not enforce a separate duplication budget. The complete-package aggregate remains a
reported diagnostic; it is not presented as a typical chart import.

Production-source lines, bytes, files, and imports are reported as diagnostics;
the enforced size limit is defined in `scripts/WriteBuildSize.mjs`.

The mount scenarios perform two warm-up renders followed by five measured renders.
Their budgets use the median measured duration. The 90-day scenario verifies all
89 SVG segments; it protects warmed-up rendering cost, not cold startup latency.

The large-line gate also verifies that the resulting SVG path contains the full
50,000-point geometry. This prevents an accidental no-op or implicit
downsampling policy from making the timing look faster than the shipped work.

These tests protect computational and DOM-update cost on the supported Chromium baseline. They are not promises about paint time on every device. Very large scatter or bubble datasets create one SVG node per point; aggregate or window data when independently interactive marks become extremely numerous.

The 50,000-point line is a verified workload, not a universal maximum or a bar
budget. The public [large-data recipes](../docs/large-data.md) prepare aggregates
and selected ranges without changing the chart API or silently reducing geometry.

The laboratory's 100,000-value Line and Bar cards are manual diagnostics, not
release performance targets. They generate the full input on demand and report
synchronous construction time or the actual exception. A deterministic signal
with broad waves, a peak, a dip, and recovery keeps the overall shape readable
at screen resolution. Both examples render the same complete dataset. The Line
fixture disables dots and smoothing; the Bar fixture uses square ends.
Successful construction does not promise fast painting, resizing, interaction,
or export on every device.
Automated diagnostic UI tests control the rendering outcome and verify the full
generated input, signal shape, status, retry, and cleanup. They must not require
a particular engine's stack-overflow error. Separate scale and Cartesian
regression tests exercise larger inputs and preserve the existing geometry budgets.
