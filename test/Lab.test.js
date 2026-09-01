import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import labMarkup from "../demo/lab.html?raw";
import "../demo/style.css";
import "../demo/lab.css";

const expectedGroups = {
  line: 10,
  bar: 7,
  annotation: 4,
  mixed: 2,
  xy: 2,
  radial: 5,
  time: 2,
  background: 12,
};
const screenshotOptions = {
  comparatorName: "pixelmatch",
  comparatorOptions: {
    allowedMismatchedPixelRatio: 0.0005,
    threshold: 0.1,
  },
  timeout: 10_000,
};

async function settle() {
  await document.fonts.ready;
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function intersects(first, second) {
  const a = first.getBoundingClientRect();
  const b = second.getBoundingClientRect();

  return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
}

beforeAll(async () => {
  await page.viewport(1280, 900);
  const lab = new DOMParser().parseFromString(labMarkup, "text/html");
  document.body.className = lab.body.className;
  document.body.innerHTML = `${lab.querySelector("main").outerHTML}${lab.querySelector("footer").outerHTML}`;
  await import("../demo/Main.js");
  await settle();
});

afterAll(async () => {
  await page.viewport(1280, 720);
});

describe("QA chart laboratory", () => {
  it("groups every fixture once and renders it through the public demo entry", () => {
    const groups = [
      ...document.querySelectorAll("[data-fixture-group]"),
    ];
    const fixtures = [
      ...document.querySelectorAll("[data-fixture]"),
    ];
    const fixtureNames = fixtures.map((fixture) => fixture.dataset.fixture);

    expect(
      Object.fromEntries(
        groups.map((group) => [
          group.dataset.fixtureGroup,
          group.querySelectorAll("[data-fixture]").length,
        ]),
      ),
    ).toEqual(expectedGroups);
    expect(fixtures).toHaveLength(44);
    expect(new Set(fixtureNames).size).toBe(fixtures.length);
    expect(document.querySelectorAll(".lab-index a")).toHaveLength(groups.length);

    for (const fixture of fixtures) {
      const host = fixture.querySelector(`#${CSS.escape(fixture.dataset.fixture)}`);
      expect(host, fixture.dataset.fixture).not.toBeNull();
      expect(host.querySelector("svg"), fixture.dataset.fixture).not.toBeNull();
    }
  });

  it("keeps annotation labels readable when points and bars deliberately cross them", () => {
    const fixture = document.querySelector('[data-fixture="annotation-collision"]');
    const labels = [
      ...fixture.querySelectorAll(".charts2-annotation"),
    ];
    const points = [
      ...fixture.querySelectorAll(".charts2-point"),
    ];
    const bars = [
      ...fixture.querySelectorAll(".charts2-bar"),
    ];
    expect(labels).toHaveLength(2);
    expect(labels.every((label) => points.some((point) => intersects(label, point)))).toBe(true);
    expect(labels.every((label) => bars.some((bar) => intersects(label, bar)))).toBe(true);
    for (const label of fixture.querySelectorAll(".charts2-annotation")) {
      const style = getComputedStyle(label);

      expect(style.fillOpacity).toBe("1");
      expect(style.stroke).toBe("none");
      expect(style.fontWeight).toBe("500");
    }
    expect(fixture.querySelectorAll(".charts2-annotation-sample")).toHaveLength(0);
  });

  it("covers fixed annotations across both bar orientations and a full region partition", () => {
    const vertical = document.querySelector('[data-fixture="annotation-bars-vertical"]');
    const horizontal = document.querySelector('[data-fixture="annotation-bars-horizontal"]');
    const experimental = document.querySelector('[data-fixture="annotation-regions-experimental"]');

    for (const fixture of [
      vertical,
      horizontal,
    ]) {
      const labels = [
        ...fixture.querySelectorAll(".charts2-annotation"),
      ];
      const bars = [
        ...fixture.querySelectorAll(".charts2-bar"),
      ];

      expect(labels).toHaveLength(2);
      expect(labels.every((label) => bars.some((bar) => intersects(label, bar)))).toBe(true);
    }

    expect(experimental.querySelectorAll(".charts2-region-label")).toHaveLength(3);
    expect(experimental.querySelectorAll(".charts2-marker-label")).toHaveLength(2);
    expect(experimental.querySelectorAll(".charts2-annotation-background")).toHaveLength(0);
    expect(experimental.querySelectorAll(".charts2-annotation-sample")).toHaveLength(0);
    expect(
      [
        ...experimental.querySelectorAll(".charts2-region"),
      ].map((region) => getComputedStyle(region).fill),
    ).toEqual([
      "rgb(52, 199, 89)",
      "rgb(255, 204, 0)",
      "rgb(255, 59, 48)",
    ]);
  });

  it("keeps every annotation stress fixture visually stable", async () => {
    for (const fixture of document.querySelectorAll('[data-fixture-group="annotation"] [data-fixture]')) {
      // eslint-disable-next-line no-await-in-loop -- Element screenshots share one browser page.
      await expect
        .element(page.elementLocator(fixture))
        .toMatchScreenshot(`lab-${fixture.dataset.fixture}.png`, screenshotOptions);
    }
  });

  it("keeps every boundary SVG flush with its zero-padding background host", () => {
    const hosts = document.querySelectorAll(".lab-boundary");
    const expectedBackground = getComputedStyle(document.body).backgroundColor;

    expect(hosts).toHaveLength(12);

    for (const host of hosts) {
      const hostBounds = host.getBoundingClientRect();
      const svgBounds = host.querySelector("svg").getBoundingClientRect();

      expect(getComputedStyle(host).backgroundColor, host.id).toBe(expectedBackground);
      expect(getComputedStyle(host).padding, host.id).toBe("0px");
      expect(svgBounds.left, host.id).toBeCloseTo(hostBounds.left, 1);
      expect(svgBounds.right, host.id).toBeCloseTo(hostBounds.right, 1);
      expect(svgBounds.top, host.id).toBeCloseTo(hostBounds.top, 1);
      expect(svgBounds.bottom, host.id).toBeCloseTo(hostBounds.bottom, 1);
    }
  });

  it("keeps every fixture inside its card at the QA mobile viewport", async () => {
    await page.viewport(390, 900);
    await settle();

    const overflowing = [
      ...document.querySelectorAll("[data-fixture]"),
    ].flatMap((fixture) => {
      const fixtureBounds = fixture.getBoundingClientRect();
      const host = fixture.querySelector(`[id="${CSS.escape(fixture.dataset.fixture)}"]`);
      const hostBounds = host.getBoundingClientRect();
      const isInside =
        hostBounds.left >= fixtureBounds.left - 0.5 && hostBounds.right <= fixtureBounds.right + 0.5;
      return isInside
        ? []
        : [
            fixture.dataset.fixture,
          ];
    });

    expect(overflowing).toEqual([]);
  });
});
