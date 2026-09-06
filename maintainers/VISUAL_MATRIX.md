# Visual regression matrix

The source baseline for this review is `9d24c57`. No reference image was replaced.
The full demo, family cards, responsive/theme cases, hover, pressed, focus, and
pointer selection remain visual checks. Donut keyboard selection retains its
separate baseline because its Linux reference differs from pointer selection.

The following keyboard-selection references were byte-identical to their
pointer-selection counterparts on both supported baseline platforms. Their
keyboard scenarios now compare rendered geometry, text, paint, and visibility
with pointer selection, while retaining focus/selection/tooltip assertions.
The pointer reference remains the visual oracle. This removes 11 duplicate
screenshot comparisons and 22 reference files without removing input scenarios.

| Family          | Platform | Shared SHA-256 prefix |
| --------------- | -------- | --------------------- |
| bubble          | darwin   | `f823cf738e22b90d`    |
| bubble          | linux    | `a95023c3160d1963`    |
| heatmap         | darwin   | `7ab02ce38b4d576b`    |
| heatmap         | linux    | `5be6126363214f61`    |
| horizontal-bar  | darwin   | `4e66c8085562313a`    |
| horizontal-bar  | linux    | `2a9039e7b632956e`    |
| line            | darwin   | `ae8632db4d4f26ce`    |
| line            | linux    | `96ed9701a5a1e3b3`    |
| mixed           | darwin   | `15072bfe3ed99806`    |
| mixed           | linux    | `bdd1d3cc4b80ceb0`    |
| mixed-dual-axis | darwin   | `109d639834c0482d`    |
| mixed-dual-axis | linux    | `5c19698f068870d2`    |
| percentage      | darwin   | `f5ba08afe264ea9a`    |
| percentage      | linux    | `d06786d7013bdf7c`    |
| pie             | darwin   | `70caef869904d5d8`    |
| pie             | linux    | `319a2889b52c3319`    |
| radar           | darwin   | `d1a77a3c22437084`    |
| radar           | linux    | `524f4f5ee25ccb68`    |
| scatter         | darwin   | `c17160493936f4a4`    |
| scatter         | linux    | `c4fc553c76df9ea3`    |
| timesheet       | darwin   | `5f0e3d136d0c1f99`    |
| timesheet       | linux    | `749a1c34726f97e5`    |

CI and screenshot generation use Ubuntu 24.04, `npm ci`, and the Playwright/browser
versions in the lockfile. macOS baselines support local development. Any future
reference update requires inspection of the actual and diff images. Failure
screenshots are diagnostics, not references, and are excluded from version control.

Removed 99 previously tracked automatic failure screenshots (`*-1.png`, etc.).
These were never read by `toMatchScreenshot`; actual references include the
browser and platform in their filenames.
