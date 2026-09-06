# Visual testing

`test/VisualRegression.test.js` covers the full demo, individual chart cards,
responsive layouts, themes, and pointer/keyboard states. Full-page captures expand
the viewport so offscreen content is rendered. `test/Lab.test.js` covers laboratory
fixtures. `test/RadarInspection.test.js` verifies measure hit areas, touch,
keyboard navigation, narrow layouts, and tooltip placement.

References live in `test/__screenshots__` and include browser and operating system
names. Chromium references support macOS and Linux; radar compatibility cases
also have Firefox and WebKit references. Equivalent pointer and keyboard selection
states compare rendered output while retaining input and accessibility assertions.

Run `npm run test:visual` for the primary visual suite. Before updating a reference,
inspect the expected, actual, and diff images and explain the intended change.
Never update images merely to make CI pass. Failure screenshots and Vitest
attachments are diagnostics and must not be committed.

The **Update Linux Screenshots** workflow generates references on Ubuntu 24.04
using `npm ci` and the locked Playwright browsers. Download its artifact, review
changes, commit the references, and run CI against that commit. The workflow
includes radar cases in all three supported browsers.
