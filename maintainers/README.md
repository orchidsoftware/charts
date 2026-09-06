# Maintainer notes

Current internal references for Orchid Charts:

- [Architecture](./ARCHITECTURE.md): ownership and dependency boundaries.
- [Naming policy](./NAMING.md): source, CSS, and tooling vocabulary.
- [Performance](./PERFORMANCE.md): runtime and bundle budgets.
- [Visual testing](./VISUAL_MATRIX.md): browser baselines and review workflow.
- [Release process](./RELEASING.md): verification and npm publication.
- [Positioning](./POSITIONING.md): product audience and messaging.

The public API is documented in [docs](../docs/readme.md) and typed in
[src/index.d.ts](../src/index.d.ts). Development checks are defined in
[CONTRIBUTING.md](../CONTRIBUTING.md) and package scripts.

Completed audits, opinion matrices, and superseded design proposals are available
in Git history. They are no longer maintained as parallel specifications.
Nothing in this directory is included in the npm package.
