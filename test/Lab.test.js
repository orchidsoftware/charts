import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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
  "extreme-zero": 12,
  "extreme-million": 12,
  "extreme-empty": 12,
  "extreme-many": 12,
};
const families = [
  "line",
  "bar",
  "scatter",
  "bubble",
  "mixed",
  "pie",
  "donut",
  "percentage",
  "polar-area",
  "radar",
  "timesheet",
  "heatmap",
];
const rejectedZeros = new Set(["pie", "donut", "percentage", "polar-area", "timesheet"]);
const extremeCases = ["zero", "million", "empty", "many"].flatMap((scenario) =>
  families.map((type) => ({
    id: `extreme-${type}-${scenario}`,
    rejected: scenario === "empty" || (scenario === "zero" && rejectedZeros.has(type)),
  })),
);
const rejectedExtremes = extremeCases.filter((fixture) => fixture.rejected);
const renderedExtremes = extremeCases.filter((fixture) => !fixture.rejected);
const legendFamilies = families
  .filter((type) => !["timesheet", "polar-area"].includes(type))
  .map((type) => ({
    type,
    selector: type === "heatmap" ? ".orchid-charts-heat-legend-swatch" : ".orchid-charts-legend-swatch",
  }));

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

function compareAnnotation(name) {
  const fixture = document.querySelector(`[data-fixture="${CSS.escape(name)}"]`);
  return expect.element(page.elementLocator(fixture)).toMatchScreenshot(`lab-${name}.png`, screenshotOptions);
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

beforeEach(async () => {
  await page.viewport(1280, 900);
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  document.activeElement?.blur();
  for (const mark of document.querySelectorAll(".orchid-charts-interactive-mark")) {
    mark.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
  }
  window.scrollTo(0, 0);
  await settle();
});

afterAll(async () => {
  await page.viewport(1280, 720);
});

describe("QA chart laboratory", () => {
  it("groups every fixture once and renders it through the public demo entry", () => {
    const brand = document.querySelector(".brand");
    const groups = [...document.querySelectorAll("[data-fixture-group]")];
    const fixtures = [...document.querySelectorAll("[data-fixture]")];
    const fixtureNames = fixtures.map((fixture) => fixture.dataset.fixture);

    expect(brand).toHaveAttribute("aria-label", "Orchid Charts by Orchid, product demo");
    expect(brand.querySelectorAll(".brand-mark path")).toHaveLength(2);
    expect(
      Object.fromEntries(
        groups.map((group) => [group.dataset.fixtureGroup, group.querySelectorAll("[data-fixture]").length]),
      ),
    ).toEqual(expectedGroups);
    expect(fixtures).toHaveLength(93);
    expect(new Set(fixtureNames).size).toBe(fixtures.length);
    expect(document.querySelectorAll(".lab-index a")).toHaveLength(groups.length);
    expect(document.querySelectorAll(".example-code-copy")).toHaveLength(fixtures.length);
    expect(document.querySelector("#example-code-toggle")).toBeNull();
    expect(document.querySelector("details")).toBeNull();

    for (const fixture of fixtures) {
      const host = fixture.querySelector(`#${CSS.escape(fixture.dataset.fixture)}`);
      const button = fixture.querySelector(":scope > header .example-code-copy");
      expect(host, fixture.dataset.fixture).not.toBeNull();
      expect(Boolean(host.querySelector("svg")), fixture.dataset.fixture).toBe(
        rejectedExtremes.every(({ id }) => id !== fixture.dataset.fixture),
      );
      expect(button).toHaveAttribute("aria-label", `Copy code for #${fixture.dataset.fixture}`);
    }
  });

  it.each(rejectedExtremes)("explains the rejected $id fixture without stopping the laboratory", ({ id }) => {
    const host = document.querySelector(`#${CSS.escape(id)}`);
    expect(host.dataset.result).toBe("rejected");
    expect(host.querySelector(".lab-fixture-error").textContent).toContain("TypeError:");
    expect(host.querySelector("svg")).toBeNull();
  });

  it.each(renderedExtremes)("renders finite geometry for $id", ({ id }) => {
    const host = document.querySelector(`#${CSS.escape(id)}`);
    expect(host.dataset.result).toBe("rendered");
    expect(host.querySelector("svg").outerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("keeps million-value bubbles visible, separate, and proportional in area", () => {
    const host = document.querySelector("#extreme-bubble-million");
    const circles = [...host.querySelectorAll(".orchid-charts-bubble.orchid-charts-visual-mark")];
    const frame = host.querySelector("svg").getBoundingClientRect();
    expect(circles).toHaveLength(4);
    const boxes = circles.map((circle) => circle.getBoundingClientRect());
    for (const [index, circle] of circles.entries()) {
      const box = boxes[index];
      expect(box.width).toBeGreaterThan(0);
      expect(box.left).toBeGreaterThanOrEqual(frame.left);
      expect(box.right).toBeLessThanOrEqual(frame.right);
      expect(box.top).toBeGreaterThanOrEqual(frame.top);
      expect(box.bottom).toBeLessThanOrEqual(frame.bottom);
      expect((circle.r.baseVal.value / circles[0].r.baseVal.value) ** 2).toBeCloseTo(
        (1_250_000 + index * 375_000) / 1_250_000,
      );
    }
    for (const [index, circle] of circles.slice(1).entries()) {
      expect(intersects(circles[index], circle)).toBe(false);
    }
  });

  it("shows every tooltip row in the twelve-series Cartesian fixtures", () => {
    for (const type of ["bar", "line", "mixed"]) {
      const host = document.querySelector(`#extreme-${type}-many`);
      const mark = host.querySelector(".orchid-charts-x-hit");
      mark.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      const tooltip = host.querySelector(".orchid-charts-tooltip");
      expect(tooltip.hidden).toBe(false);
      const rows = [...tooltip.querySelectorAll(".orchid-charts-tooltip-row")];
      expect(rows).toHaveLength(12);
      expect(tooltip.scrollHeight).toBeLessThanOrEqual(tooltip.clientHeight);
      const bounds = tooltip.getBoundingClientRect();
      for (const row of rows) {
        const box = row.getBoundingClientRect();
        expect(box.top).toBeGreaterThanOrEqual(bounds.top);
        expect(box.bottom).toBeLessThanOrEqual(bounds.bottom);
      }
      host.querySelector("svg").dispatchEvent(new MouseEvent("mouseleave"));
    }
  });

  it.each(["timesheet", "polar-area"])("documents the absent legend for %s with many values", (type) => {
    expect(document.querySelector(`[data-fixture="extreme-${CSS.escape(type)}-many"]`).textContent).toContain(
      "no legend",
    );
  });

  it.each(legendFamilies)("shows twelve legend entries for $type", ({ type, selector }) => {
    const fixture = document.querySelector(`[data-fixture="extreme-${CSS.escape(type)}-many"]`);
    expect(fixture.querySelectorAll(selector)).toHaveLength(12);
  });

  it("renders a square-cell heatmap for the three-month fixture", () => {
    const fixture = document.querySelector('[data-fixture="heatmap-quarter"]');
    const cells = [...fixture.querySelectorAll(".orchid-charts-heat-cell")];

    expect(cells).toHaveLength(91);
    const cellSize = Number(cells[0].getAttribute("width"));
    expect(cells[0]).toHaveAttribute("x", "0");
    expect(Number(cells[0].getAttribute("y"))).toBeCloseTo(2 * (cellSize + 3));
    expect(cells.every((cell) => cell.getAttribute("width") === cell.getAttribute("height"))).toBe(true);
  });

  it("keeps annotation labels readable when points and bars deliberately cross them", () => {
    const fixture = document.querySelector('[data-fixture="annotation-collision"]');
    const labels = [...fixture.querySelectorAll(".orchid-charts-annotation")];
    const points = [...fixture.querySelectorAll(".orchid-charts-point")];
    const bars = [...fixture.querySelectorAll(".orchid-charts-bar")];
    expect(labels).toHaveLength(2);
    expect(labels.every((label) => points.some((point) => intersects(label, point)))).toBe(true);
    expect(labels.every((label) => bars.some((bar) => intersects(label, bar)))).toBe(true);
    for (const label of fixture.querySelectorAll(".orchid-charts-annotation")) {
      const style = getComputedStyle(label);

      expect(style.fillOpacity).toBe("1");
      expect(style.opacity).toBe("1");
      expect(style.stroke).toBe(getComputedStyle(fixture).backgroundColor);
      expect(style.paintOrder).toBe("stroke");
      expect(style.fontWeight).toBe("500");
    }
    expect(fixture.querySelectorAll(".orchid-charts-annotation-sample")).toHaveLength(0);
  });

  it("covers fixed annotations across both bar orientations and a full region partition", () => {
    const vertical = document.querySelector('[data-fixture="annotation-bars-vertical"]');
    const horizontal = document.querySelector('[data-fixture="annotation-bars-horizontal"]');
    const experimental = document.querySelector('[data-fixture="annotation-regions-experimental"]');

    for (const fixture of [vertical, horizontal]) {
      const labels = [...fixture.querySelectorAll(".orchid-charts-annotation")];
      const bars = [...fixture.querySelectorAll(".orchid-charts-bar")];

      expect(labels).toHaveLength(2);
      expect(labels.every((label) => bars.some((bar) => intersects(label, bar)))).toBe(true);
    }

    expect(experimental.querySelectorAll(".orchid-charts-region-label")).toHaveLength(3);
    expect(experimental.querySelectorAll(".orchid-charts-marker-label")).toHaveLength(2);
    expect(experimental.querySelectorAll(".orchid-charts-annotation-background")).toHaveLength(0);
    expect(experimental.querySelectorAll(".orchid-charts-annotation-sample")).toHaveLength(0);
    expect(
      [...experimental.querySelectorAll(".orchid-charts-region")].map(
        (region) => getComputedStyle(region).fill,
      ),
    ).toEqual(["rgb(52, 199, 89)", "rgb(255, 204, 0)", "rgb(255, 59, 48)"]);
  });

  it("keeps the four annotation views stable during the laboratory tour", async () => {
    await compareAnnotation("annotation-collision");
    await compareAnnotation("annotation-bars-vertical");
    await compareAnnotation("annotation-bars-horizontal");
    await compareAnnotation("annotation-regions-experimental");
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
    const grids = [...document.querySelectorAll(".lab-boundary .orchid-charts-grid-horizontal")];
    expect(grids.length).toBeGreaterThan(0);
    for (const grid of grids) {
      expect(Number(grid.getAttribute("x2"))).toBe(grid.ownerSVGElement.viewBox.baseVal.width);
    }
    const swatches = [...document.querySelectorAll(".lab-boundary .orchid-charts-legend-swatch")];
    expect(swatches.length).toBeGreaterThan(0);
    const surfaces = new Set(swatches.map((swatch) => swatch.ownerSVGElement));
    for (const svg of surfaces) {
      expect(svg.querySelector(".orchid-charts-legend-swatch").getBBox().x).toBe(0);
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

    const overflowing = [...document.querySelectorAll("[data-fixture]")].flatMap((fixture) => {
      const fixtureBounds = fixture.getBoundingClientRect();
      const host = fixture.querySelector(`[id="${CSS.escape(fixture.dataset.fixture)}"]`);
      const hostBounds = host.getBoundingClientRect();
      const isInside =
        hostBounds.left >= fixtureBounds.left - 0.5 && hostBounds.right <= fixtureBounds.right + 0.5;
      return isInside ? [] : [fixture.dataset.fixture];
    });

    expect(overflowing).toEqual([]);
  });
});
