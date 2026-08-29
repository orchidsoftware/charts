# Performance

Runtime budgets are measured by `npm run test:performance` without coverage
instrumentation. `npm run coverage` excludes that timing-only file so V8
profiling overhead cannot turn a stable runtime budget into a machine-dependent
failure; the complete `npm run check` still executes both gates sequentially.

Performance is part of the release gate. `npm run test:performance` runs in Vitest Browser Mode using headless Chromium.

Current budgets:

- keep the combined JavaScript and CSS production bundle at or below 32 kB gzip;
- render a typical 90-day line chart in less than 50 ms;
- render a 50,000-point SVG line in less than 1,000 ms;
- perform 200 live updates of a 100-point line in less than 1,000 ms.

Run `npm run test:size` to create a fresh production build and enforce the bundle
budget. The regular `npm run build` and full `npm run check` paths enforce the
same limit.

The budgets include input normalization, scale calculation, SVG path generation, and DOM replacement. They run as part of `npm run check`, so a regression blocks release.

The 32 kB gzip ceiling is measured against the complete package entry rather
than a tree-shaken single-chart application. The pre-fluent checkpoint was
23.6 kB gzip; the named family builders, scoped formatting, and their shared
validation add about 7.1 kB. The ceiling therefore leaves roughly four percent
for deterministic build variance while still rejecting material growth.

The 90-day scenario runs first, without an explicit warm-up, and verifies all 89
smooth segments. Its 50 ms budget therefore protects the ordinary first-chart
experience rather than only warmed-up throughput.

The large-line gate also verifies that the resulting SVG path contains the full
50,000-point geometry. This prevents an accidental no-op or implicit
downsampling policy from making the timing look faster than the shipped work.

These tests protect computational and DOM-update cost on the supported Chromium baseline. They are not promises about paint time on every device. Very large scatter or bubble datasets create one SVG node per point; aggregate or window data when independently interactive marks become extremely numerous.
