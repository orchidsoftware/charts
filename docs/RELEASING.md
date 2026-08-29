# Releasing Charts2

The repository is prepared to build version 1.0.0, but no GitHub repository or
npm package has been created yet. The current package name is a release target,
not proof that the `@charts2` npm scope is available or owned.

## First-publication decisions

Before publishing, choose and verify these external identities:

1. Create the GitHub repository and add release comparison links to
   `CHANGELOG.md`.
2. Confirm ownership of `@charts2/core`, or choose another npm name before any
   consumers depend on it.
3. Add `repository`, `homepage`, and `bugs` metadata to `package.json` only when
   their final URLs exist.
4. Enable branch protection, private vulnerability reporting, Dependabot, and
   GitHub Actions in the repository settings.
5. Add npm trusted publishing or an automation token only after the package
   identity is final. Do not store a token in `.npmrc` or the repository.

## Release gate

Run the same commands used by CI from a clean checkout:

```bash
npm ci
npx playwright install chromium firefox webkit
npm run check
npm audit --audit-level=high
npm run pack:check
```

The gate includes a native no-build smoke test in Chromium, Firefox, and WebKit.
It serves `dist` as static files, resolves `@charts2/core` through an import map,
loads CSS through `<link>`, and exercises render, update, and destroy without a
bundler transform.

Inspect the archive listing. It must contain the module-preserving ESM build,
source maps, CSS, TypeScript declarations, documentation, license, notice,
changelog, and package manifest. It must not contain CommonJS, authored
JavaScript, tests, demo code, credentials, coverage, or local artifacts.

`npm run pack:check` uses `npm pack --ignore-scripts` so archive inspection does
not recurse through `prepack → build → size → pack`.

## Version workflow

1. Move completed entries from `Unreleased` into a dated release in
   `CHANGELOG.md`.
2. Set the exact same version in `package.json` and `package-lock.json`.
3. Run the release gate and review all visual diffs.
4. Commit the release as one focused change.
5. After GitHub exists, tag the commit as `vX.Y.Z` and create release notes from
   the matching changelog entry.
6. Publish the already-reviewed archive. For the first release, verify the
   package name and access level interactively rather than automating an
   irreversible publication.

The manual **Release candidate** workflow performs the gate and uploads a `.tgz`
artifact. It does not create a tag, GitHub Release, or npm publication. Registry
publication automation should be added only after the first release establishes
the final identities and recovery procedure.
