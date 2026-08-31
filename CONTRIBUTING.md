# Contributing

Install the locked dependency graph with `npm ci`, then run `npm run check`
before opening a change. Use `npm run dev` for the demo and `npm run test:watch`
for a fast feedback loop.

```bash
npm ci
npx playwright install chromium
npm run check
```

## Quality policy

- JavaScript, CSS, HTML, and Markdown are formatted by the repository-local
  Prettier version. JSON, YAML, and TypeScript declarations use the same gate;
  `npm run format:check` rejects drift.
- JavaScript uses the strict ESLint profile. CSS uses Stylelint standard rules,
  logical property ordering, and kebab-case selectors.
- Every published JavaScript module remains at 100% statements, branches, functions, and lines.
- A bug fix starts with a failing regression test.
- Public API changes require types, tests, and documentation in the same change.
- Keep runtime dependencies at zero unless a dependency removes more risk than it adds.

All modules in `src` are first-class product code and follow the same gate. Use
`npm run format` for formatting and `npm run lint:fix` for safe lint fixes. Do
not add a vendored renderer, compatibility copy, or alternate lifecycle;
upstream provenance belongs in `NOTICE`, not in dormant source trees.

## Changes

Keep each change focused on one reason to change. Prefer a direct call site and
an existing abstraction over a new layer. Stateful lifecycle or polymorphic
behavior belongs in a class with native `#private` members; stateless
calculations remain named functions. Do not add Java-style `get…` or `set…`
methods.

For a rendering change, exercise every affected pointer, keyboard, focus,
selected, mobile, and dark state. Review reference, actual, and diff images
before running `npm run test:visual:update`. Never accept baselines merely to
make CI green.

## Pull requests

- Explain the user-visible behavior and the smallest public API involved.
- Add a failing regression test before a bug fix.
- Update `README.md`, `docs/api-reference.md`, relevant files in `maintainers/`, and
  `CHANGELOG.md` when their contracts change.
- Run `npm run pack:check` when package exports or shipped files change.
- Do not include generated `dist`, `coverage`, `.tgz`, or browser diagnostic
  files. Visual baselines under `test/__screenshots__` are the deliberate
  exception.

Security vulnerabilities must follow [SECURITY.md](./SECURITY.md), not a public
issue.
