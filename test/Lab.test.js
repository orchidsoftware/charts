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
  time: 3,
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
    const brand = document.querySelector(".brand");
    const groups = [
      ...document.querySelectorAll("[data-fixture-group]"),
    ];
    const fixtures = [
      ...document.querySelectorAll("[data-fixture]"),
    ];
    const fixtureNames = fixtures.map((fixture) => fixture.dataset.fixture);

    expect(brand).toHaveAttribute("aria-label", "Orchid Charts by Orchid, product demo");
    expect(brand.querySelectorAll(".brand-mark path")).toHaveLength(2);
    expect(
      Object.fromEntries(
        groups.map((group) => [
          group.dataset.fixtureGroup,
          group.querySelectorAll("[data-fixture]").length,
        ]),
      ),
    ).toEqual(expectedGroups);
    expect(fixtures).toHaveLength(45);
    expect(new Set(fixtureNames).size).toBe(fixtures.length);
    expect(document.querySelectorAll(".lab-index a")).toHaveLength(groups.length);
    expect(document.querySelectorAll(".example-code-copy")).toHaveLength(fixtures.length);
    expect(document.querySelector("#example-code-toggle")).toBeNull();
    expect(document.querySelector("details")).toBeNull();

    for (const fixture of fixtures) {
      const host = fixture.querySelector(`#${CSS.escape(fixture.dataset.fixture)}`);
      const button = fixture.querySelector(":scope > header .example-code-copy");
      expect(host, fixture.dataset.fixture).not.toBeNull();
      expect(host.querySelector("svg"), fixture.dataset.fixture).not.toBeNull();
      expect(button).toHaveAttribute("aria-label", `Copy code for #${fixture.dataset.fixture}`);
    }
  });

  it("renders a square-cell heatmap for the three-month fixture", () => {
    const fixture = document.querySelector('[data-fixture="heatmap-quarter"]');
    const cells = [
      ...fixture.querySelectorAll(".charts2-heat-cell"),
    ];

    expect(cells).toHaveLength(91);
    const cellSize = Number(cells[0].getAttribute("width"));
    expect(cells[0]).toHaveAttribute("x", "0");
    expect(Number(cells[0].getAttribute("y"))).toBeCloseTo(2 * (cellSize + 3));
    expect(cells.every((cell) => cell.getAttribute("width") === cell.getAttribute("height"))).toBe(true);
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
      expect(style.opacity).toBe("1");
      expect(style.stroke).toBe(getComputedStyle(fixture).backgroundColor);
      expect(style.paintOrder).toBe("stroke");
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

  it.each([
    "annotation-collision",
    "annotation-bars-vertical",
    "annotation-bars-horizontal",
    "annotation-regions-experimental",
  ])("keeps %s visually stable", async (name) => {
    const fixture = document.querySelector(`[data-fixture="${CSS.escape(name)}"]`);
    await expect
      .element(page.elementLocator(fixture))
      .toMatchScreenshot(`lab-${name}.png`, screenshotOptions);
  });

  it("keeps copy actions visible in every card header", () => {
    for (const fixture of document.querySelectorAll("[data-fixture]")) {
      const button = fixture.querySelector(":scope > header .example-code-copy");
      expect(getComputedStyle(button).display).not.toBe("none");
      expect(button).toHaveAttribute("title", "Copy code");
      expect(button.querySelector("svg")).not.toBeNull();
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

  it("uses the SVG width for plots and legends without decorative side padding", () => {
    for (const host of document.querySelectorAll(".lab-boundary")) {
      const svg = host.querySelector("svg");
      const width = svg.viewBox.baseVal.width;
      const grid = svg.querySelector(".charts2-grid-horizontal");
      const swatch = svg.querySelector(".charts2-legend-swatch");

      if (grid) {
        expect(Number(grid.getAttribute("x2")), host.id).toBe(width);
      }

      if (swatch) {
        expect(swatch.getBBox().x, host.id).toBe(0);
      }
    }

    const percentage = document.querySelector("#background-percentage svg");
    const strip = percentage.querySelector("clipPath rect");
    expect(Number(strip.getAttribute("x"))).toBe(0);
    expect(Number(strip.getAttribute("y"))).toBe(0);
    expect(Number(strip.getAttribute("width"))).toBe(percentage.viewBox.baseVal.width);
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
