# Releasing Orchid Charts

The npm package is `@orchidsoftware/charts`. GitHub Releases use tags of the form
`vX.Y.Z`; publishing a release triggers `.github/workflows/publish.yml` and npm
trusted publishing. The tag must match `package.json` exactly.

## Prepare

1. Update `package.json`, the root package entry in `package-lock.json`, the demo
   footer, CDN examples, and the release-candidate workflow default.
2. Move completed changelog entries into a dated release section. Document changes
   to public interaction payloads, CSS selectors, and theme variables.
3. Install the locked dependencies and Chromium, Firefox, and WebKit.
4. Run `npm run check`, `npm audit --audit-level=high`, `npm run build:demo`,
   and `npm run pack:check`.
5. Review visual changes on macOS and Linux. See [Visual testing](./VISUAL_MATRIX.md).
6. Inspect the archive for the ESM build, source maps, types, stylesheet, docs,
   changelog, and license. It must exclude tests, demo source, credentials,
   coverage, and local artifacts.

`npm run build` records measured bundle sizes in `demo/BuildSize.js`; include the
updated metrics before reviewing demo screenshots. The complete quality gate
builds once and reuses the result for native import-map and server-side tests.

## Publish

Commit and push the reviewed changes. Wait for CI on the exact release commit.
Create an annotated `vX.Y.Z` tag on that commit, push the tag, and publish a GitHub
Release with the matching changelog notes.

The publish workflow verifies the tag, runs the complete gate, packs the verified
build, and publishes through npm trusted publishing. Confirm workflow success and
that the expected version is available from the registry before calling the
release complete. Do not store npm tokens in the repository.

The manual **Release candidate** workflow only builds and uploads an archive;
it does not create tags or publish the package.
