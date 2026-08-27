# Performance

Runtime budgets are measured by `npm run test:performance` without coverage
instrumentation. `npm run coverage` excludes that timing-only file so V8
profiling overhead cannot turn a stable runtime budget into a machine-dependent
failure; the complete `npm run check` still executes both gates sequentially.

Performance is part of the release gate. `npm run test:performance` runs in Vitest Browser Mode using headless Chromium.

Current budgets:

- render a 50,000-point SVG line in less than 1,000 ms;
- perform 200 live updates of a 100-point line in less than 1,000 ms.

The budgets include input normalization, scale calculation, SVG path generation, and DOM replacement. They run as part of `npm run check`, so a regression blocks release.

These tests protect computational and DOM-update cost on the supported Chromium baseline. They are not promises about paint time on every device. Very large scatter or bubble datasets create one SVG node per point; aggregate or window data when independently interactive marks become extremely numerous.
