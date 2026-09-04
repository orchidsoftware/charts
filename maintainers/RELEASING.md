# Releasing Charts2

The GitHub repository and its CI workflows exist, and the source is prepared to
build version 0.0.1. The `@orchid/charts` name is owned through the `orchid` npm
organization. The repository still has no version tag or public package release.

## First-publication decisions

Before publishing, verify these external release settings:

1. Enable branch protection, private vulnerability reporting, Dependabot, and
   GitHub Actions in the repository settings.
2. Publish the first public version interactively, then configure npm trusted
   publishing for `orchidsoftware/charts` and `.github/workflows/publish.yml`.
   Do not store an npm token in `.npmrc` or the repository.

## Release gate

Run the complete release gate from a clean checkout:

```bash
npm ci
npx playwright install chromium firefox webkit
npm run check
npm audit --audit-level=high
npm run pack:check
```

The gate includes a native no-build smoke test in Chromium, Firefox, and WebKit.
It serves `dist` as static files, resolves `@orchid/charts` through an import map,
loads CSS through `<link>`, and exercises render, update, and destroy without a
bundler transform.

Inspect the archive listing. It must contain the module-preserving ESM build,
source maps, CSS, TypeScript declarations, documentation, license, notice,
changelog, and package manifest. It must not contain CommonJS, authored
JavaScript, tests, demo code, credentials, coverage, or local artifacts.

`npm run pack:check` uses `npm pack --ignore-scripts` so archive inspection does
not recurse through `prepack → build → size → pack`.

The CI and release-candidate workflows must install all three Playwright
browsers before `npm run check`; the no-build contract launches Chromium,
Firefox, and WebKit. A Chromium-only workflow setup is not equivalent to this
release gate.

## Version workflow

1. Move completed entries from `Unreleased` into a dated release in
   `CHANGELOG.md`.
2. Set the exact same version in `package.json` and `package-lock.json`.
3. Run the release gate and review all visual diffs.
4. Commit the release as one focused change.
5. Tag the commit as `vX.Y.Z` and create release notes from
   the matching changelog entry.
6. Publish the already-reviewed archive. For the first release, verify the
   package name and access level interactively rather than automating an
   irreversible publication.

The manual **Release candidate** workflow performs the gate and uploads a `.tgz`
artifact. It does not create a tag, GitHub Release, or npm publication. Publishing
a GitHub Release triggers `.github/workflows/publish.yml`; after the first package
version exists, connect that workflow through npm trusted publishing before using
it for subsequent versions.
