# Launch readiness audit

Audit date: 2026-08-29

Historical status: release blockers 1, 2, and 4 were resolved on 2026-09-04 by
publishing `@orchidsoftware/charts@0.0.1`, deploying the GitHub Pages demo, and
creating the `v0.0.1` tag and GitHub Release. The remaining findings are kept
as the original audit record.

## Verdict

Orchid Charts has a strong product surface, but the repository is not ready for its
first external user yet. Rendering quality and API discipline are ahead of
distribution, installation, and public trust.

A 15,000-star outcome cannot be guaranteed by repository polish. The repository
can, however, remove the reasons a curious visitor would leave before trying
the library. The immediate goal is therefore a trustworthy five-minute path
from GitHub to a working chart.

## What is already strong

- The demo shows recognizable dashboards, reports, activity, and planning
  scenarios instead of isolated test shapes.
- Twelve named chart definitions share one concise authoring and runtime
  lifecycle.
- TypeScript, keyboard interaction, responsive behavior, SVG export, dark
  surfaces, visual regression coverage, and performance budgets are already
  implemented.
- The repository includes issue templates, contributing guidance, a code of
  conduct, a security policy, and automated quality workflows.

## Release blockers

These items block the first external user and must be resolved before launch.

### 1. The documented npm package does not exist

`npm view @orchidsoftware/charts` returns `404 Not Found`, while the README begins with
`npm install @orchidsoftware/charts`. Publish the package before announcing the
repository, then verify installation in a clean temporary project using the
registry artifact rather than the worktree.

### 2. There is no public demo URL

The GitHub repository has no homepage URL, and the package homepage points back
to the README. Deploy `demo/` to a stable HTTPS URL and set that URL as the
GitHub repository homepage and package homepage. A charting library needs a
clickable result before it asks a visitor to install anything.

### 3. Public automation is red

The latest CI and CodeQL runs did not start because the GitHub account is locked
by a billing issue. Resolve the account state and obtain a green run on the
default branch before adding a CI badge or announcing the release.

### 4. Version 0.0.1 has no GitHub release or tag

`package.json` and `CHANGELOG.md` present version 0.0.1, but GitHub reports no
release and the repository has no version tags. Complete the release checklist,
create the signed or annotated tag, publish npm from that exact commit, and
create a GitHub release with the same notes.

### 5. Private vulnerability reporting is disabled

`SECURITY.md` asks for a private channel, but GitHub private vulnerability
reporting is currently disabled. Enable it and replace the temporary profile
contact instructions with the repository security advisory URL.

## Changes completed during this audit

- Moved internal specifications, review documents, matrices, and launch notes
  from `docs/` to `maintainers/`. They are no longer included in the npm package.
- Added a real product-dashboard screenshot near the top of the README.
- Added a real gallery image covering line, stacked bar, donut, and timesheet
  scenarios. Both images come from committed visual-regression renders rather
  than generated marketing artwork.
- Added React and Vue lifecycle examples.
- Kept chart-specific documentation as one page per chart type and retained a
  dedicated SVG export page.

## Next growth work

These items are not release blockers, but they matter for sustained adoption.

1. Add a runnable StackBlitz or CodeSandbox example linked beside the live demo.
2. Publish a tested migration guide for the shared Frappe Charts data shapes.
3. Turn the Markdown documentation into a searchable, versioned documentation
   site without changing its concise chapter structure.
4. Add one short recording that demonstrates data updates, tooltip inspection,
   keyboard navigation, and SVG download. Prefer an optimized WebM with a GIF
   fallback; do not add a decorative loop that only repeats chart drawing.
5. Add empty, loading, and error-state recipes for dashboards.
6. Publish two small framework examples as runnable applications before
   considering wrappers.
7. Write a launch article around one product problem and its complete solution,
   then collect real usage examples with permission.

## Launch sequence

1. Resolve GitHub Actions billing and enable private vulnerability reporting.
2. Deploy the demo and set repository/package homepage metadata.
3. Run the complete quality gate from a clean clone.
4. Pack the package and install the generated tarball into clean vanilla,
   TypeScript, React, and Vue fixtures.
5. Publish npm, verify the CDN/import-map example, then create the matching tag
   and GitHub release.
6. Replace all pre-release language, add npm and CI badges only after both are
   verifiably green, and announce the project.
