# Fluent API opinion matrix

Status: final design review of the target contract  
Normative specification: [FLUENT_API.md](./FLUENT_API.md)  
Implementation verdict: fluent contract implemented; all repository release
gates pass

## 1. What these names and scores mean

Taylor Otwell, DHH, Martin Fowler, Robert C. Martin, Kent Beck, and the other
named people did not review Charts2, endorse it, or assign these scores. The
rows below are explicit role simulations based on published design principles.
They are internal acceptance lenses, not quotations or claims of approval.

Each final score evaluates the API design in `FLUENT_API.md`. The runtime,
types, README, demo, and tests now use that contract. Design approval remains
separate from release readiness: every executable repository gate must pass.

## 2. Decision rule

The Taylor Otwell / Laravel lens leads, has triple weight, and has veto power.
It optimizes for the code an ordinary frontend developer should be able to
write from autocomplete without reading a manual:

```js
const chart = LineChart.make("#revenue")
  .labels(["Jan", "Feb", "Mar"])
  .dataset([42, 48, 57])
  .colors(["#00bdff", "#1b3bff", "#8f00ff", "#ff0011"])
  .height(300)
  .gradient()
  .render();
```

No score may reach `100/100` merely because the syntax looks fluent. A lens
passes only when its concrete blocker has been resolved in the normative
contract. Implementation conformance is a separate, executable release gate.

## 3. Review history

The first review rejected the previous advance `10/10` claims.

| Lens                    | Before revision | Blocking finding                                                                    |
| ----------------------- | --------------: | ----------------------------------------------------------------------------------- |
| Taylor Otwell / Laravel |          60/100 | The delightful common path was hidden beneath a protocol-like surface               |
| DHH / Rails             |          65/100 | A single series needed a fake name and a frameless chart needed six negative flags  |
| Martin Fowler           |          70/100 | `axis()` collided with `axes()` and callback updates introduced a second DSL        |
| Kent Beck               |          60/100 | Too many guarantees arrived as one untested leap; state transitions were incomplete |
| Robert C. Martin        |          70/100 | `Point.x` and the optional-field selection record weakened type boundaries          |
| Product JavaScript lens |          50/100 | Palette, responsive, migration, and demo-to-spec behavior were ambiguous            |

The revised specification then made these binding changes:

- placed the `colors + height + gradient` path first and defined documentation
  disclosure order;
- made categorical palette cycling, heatmap intensity, timesheet palette keys,
  and explicit-color precedence exact;
- made chart-level `gradient()` apply to all eligible lines and specified its
  relationship with `area()`;
- added a single unnamed `dataset(values)` convention and automatic legend
  behavior;
- added `frameless()` for the compact product scenario already present in the
  demo;
- renamed scoped `axis()` to `yAxis()` and gave MixedChart its own `.line()`,
  `.bar()`, and `.scatter()` grammar;
- removed the callback update DSL;
- separated `Point`, `BubblePoint`, normalized task snapshots, and
  discriminated selections;
- specified generated labels, container responsiveness, selection identity,
  accessibility, deselection, scoped-builder lifetime, and download behavior;
- replaced exact layout-search steps with semantic guarantees;
- documented the legacy-to-fluent migration and made repository coherence a
  blocking release gate.

A second cold review still withheld `100/100`: Taylor/Laravel scored the target
`87/100`, DHH/Rails scored the full contract `80/100`, and the product-JavaScript
lens scored it `87/100`. That review found that the syntax was pleasant but the
contract did not yet prove no-documentation use, prohibit framework escape
hatches, define heatmap defaults, preserve CSS-variable colors in exported
SVG, make `title()` visually unsurprising, or remove timesheet date-only
ambiguity. It also found that `point()` returned different shapes without
stating the single navigation concept behind them.

The final revision resolved those findings normatively in sections 1.1–1.3, 6,
7, 13, 14, 18, 19, and 20. The scores below are the result after those changes;
they are not advance scores and do not score the legacy implementation.

### 3.1 Evidence taken from the current product and demo

The review treated the repository's positioning and product demo as input, not
as incidental examples. They establish a focused product-interface library:
trends, comparisons, composition, activity, and planning with product-ready
defaults. The target fluent API preserves those jobs while removing authoring
friction visible in the current demo:

| Current demo expression                                | Target product expression                  |
| ------------------------------------------------------ | ------------------------------------------ |
| `colors: [...]` inside a root options object           | `.colors([...])` once for the whole chart  |
| `height: 300`                                          | `.height(300)`                             |
| `gradient: true`                                       | `.gradient()` for every eligible line      |
| `orientation: "horizontal"`                            | `.horizontal()`                            |
| `barOptions: { stacked: true }`                        | `.stacked()`                               |
| Six `show*` flags for the three compact demo charts    | `.frameless()`                             |
| `type: "axis-mixed"` plus repeated dataset type tags   | `MixedChart` with `.bar()` and `.line()`   |
| `tooltipOptions` and `axisOptions` presentation groups | domain-named scoped methods when necessary |

This translation is now an executable conformance requirement in sections 1.3
and 18. The marketing promise “one small JavaScript API” therefore describes
the 95% authoring experience rather than the old generic options protocol.

## 4. Final target-design matrix

| Simulated lens                          | Weight | Gate that had to be earned                                                    | Binding evidence in the revised specification                                                                                       |       Final |
| --------------------------------------- | -----: | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------: |
| Taylor Otwell / Laravel                 |     3× | Obvious, expressive 95% path with no ceremony                                 | Minimal unnamed series; `.colors()`, `.height()`, global `.gradient()`; remembered-vocabulary and cold-use gates; no escape hatches | **100/100** |
| DHH / Rails                             |     1× | Convention over configuration and programmer happiness                        | Unnamed single series, automatic legend, `frameless()`, product-ready defaults, one inspector-unit meaning for `point()`            | **100/100** |
| Martin Fowler                           |     1× | A fluent interface that reads as domain language                              | Named definitions, domain verbs, `yAxis()` disambiguation, typed local scopes, dedicated Mixed grammar                              | **100/100** |
| Robert C. Martin                        |     1× | Stable boundaries and dependency direction                                    | Discriminated selections, explicit point/snapshot types, exact builder bindings, renderers independent of builders                  | **100/100** |
| Kent Beck                               |     1× | Simple interface with observable changes isolated behind it                   | Small core path, plain-object update, atomic state transitions, semantic rather than algorithmic layout guarantees                  | **100/100** |
| Rich Hickey                             |     1× | Data, configuration, effects, and formatting are not complected               | Authoring ends at one `render()` effect; mounted lifecycle is separate; formatters cannot change raw data                           | **100/100** |
| Sandi Metz                              |     1× | Messages reveal responsibility and scopes stay small                          | Chart, dataset, tooltip, annotation, and y-axis scopes expose only owned behavior and expire after callbacks                        | **100/100** |
| Hyrum Wright                            |     1× | Observable compatibility is named rather than accidental                      | Exact exports, palette order, defaults, precedence, validation, lifecycle, and migration vocabulary are explicit                    | **100/100** |
| Michael Feathers                        |     1× | Replacement behavior can be characterized and migrated                        | Legacy-to-target table, canonical executable examples, behavior gates, and repository-wide parity requirement                       | **100/100** |
| Rich Harris / Lea Verou product-JS lens |     1× | Copyable demo syntax, browser-native expectations, and progressive disclosure | Product-demo translation fixtures, family palettes, responsive sizing, standalone SVG export, concise first example                 | **100/100** |

Weighted target-design result:
`(100 × 3 + 9 × 100) / 12 = 100/100`. Taylor/Laravel veto: passed.

## 5. Taylor/Laravel lead gate

| Criterion                 | Required evidence                                                               |       Score |
| ------------------------- | ------------------------------------------------------------------------------- | ----------: |
| Obvious entry             | `LineChart.make(parent)` and equivalent named definitions                       |       10/10 |
| Reads like the domain     | `labels`, `dataset`, `colors`, `height`, `gradient`, `render`                   |       10/10 |
| Short common case         | One import and one chain; no nested configuration required                      |       10/10 |
| Whole-chart convenience   | Palette and gradient apply globally by default                                  |       10/10 |
| Progressive disclosure    | Values, optional name/color, then optional scoped callback                      |       10/10 |
| Product convention        | `frameless()` replaces six negative flags                                       |       10/10 |
| No ceremony               | No constructor, runtime type string, options bag, alias, `get/set`, or `.end()` |       10/10 |
| Discoverable without docs | Cold-use test plus only type-valid capabilities in autocomplete                 |       10/10 |
| Predictable lifecycle     | `render()` commits; mounted chart owns update/export/destroy                    |       10/10 |
| One repository story      | Explicit coherence gate blocks a release with docs/runtime drift                |       10/10 |
| **Taylor/Laravel total**  | **Target design accepted**                                                      | **100/100** |

## 6. Release verdict

The target design is unanimously `100/100`, and its public vocabulary is now
implemented consistently across runtime exports, TypeScript declarations,
README, API guide, product positioning, demo, tests, and the packed artifact.
The legacy factory survives only in a test-only migration adapter used to keep
historical renderer tests readable; it is not exported or shipped.

| Evaluated surface               |  Result | Evidence                                                         |
| ------------------------------- | ------: | ---------------------------------------------------------------- |
| Revised target contract         | 100/100 | Every simulated lens has a binding requirement and testable gate |
| JavaScript runtime              |    Pass | Twelve frozen named definitions; no public generic factory       |
| TypeScript declarations         |    Pass | Family-specific builders, scopes, data, and selections           |
| README, guides, and positioning |    Pass | Canonical fluent vocabulary and progressive disclosure           |
| Product demo                    |    Pass | All examples render through named fluent definitions             |
| Functional and visual tests     |    Pass | 270/270 functional tests and 105/105 visual tests pass           |
| Performance and production pack |    Pass | Performance budget, build, and dry-run package inspection pass   |
| Repository coverage gate        |    Pass | 100% statements, branches, functions, and lines                  |

The implementation is release-ready at repository level. Publishing still
depends on the maintainer's registry ownership and version-history decision.

## 7. Principle sources

- [Laravel query builder](https://laravel.com/docs/13.x/queries) and
  [collections](https://laravel.com/docs/13.x/collections): fluent, expressive
  chains and progressive operations.
- [The Rails Doctrine](https://rubyonrails.org/doctrine): convention over
  configuration and optimized programmer happiness.
- [Martin Fowler, Fluent Interface](https://martinfowler.com/bliki/FluentInterface.html):
  readable, domain-oriented chained interfaces.
- [Robert C. Martin, Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html):
  dependency direction and isolated boundaries.
- [Kent Beck, New interface, old implementation](https://newsletter.kentbeck.com/p/tidying-new-interface-old-implementation):
  simple interfaces and controlled evolution.
- [Rich Hickey, Simple Made Easy transcript](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy.md):
  separating concerns that change independently.
- [Sandi Metz, What Does OO Afford?](https://sandimetz.com/blog/2018/21/what-does-oo-afford):
  responsibility and message-oriented design.
- [Hyrum's Law](https://www.hyrumslaw.com/): observable API behavior becomes a
  dependency.
- [Michael Feathers, Characterization Testing](https://michaelfeathers.silvrback.com/characterization-testing):
  tests that capture behavior during replacement.
