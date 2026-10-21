import { afterEach, describe, expect, it } from "vitest";

import { BarChart, LineChart } from "../src/index.js";
import "../src/styles.css";

const charts = [];

function mount({ width = 360, typography = "font-size: 14px;", hidden = false } = {}) {
  const host = document.createElement("div");
  host.style.width = `${width}px`;
  host.hidden = hidden;
  const sheet = document.createElement("style");
  sheet.textContent = `.orchid-charts-host .orchid-charts-marker-label { ${typography} }`;
  document.body.append(sheet, host);
  return host;
}

function render(
  host,
  { horizontal = false, markers = [{ label: "План", value: 500 }], rightAxis = false } = {},
) {
  const builder = (horizontal ? BarChart : LineChart)
    .make(host)
    .height(280)
    .labels(["Апр", "Май", "Июн"])
    .dataset("Факт", [800, 850, 900]);
  if (horizontal) {
    builder.horizontal();
  }
  if (!horizontal) {
    builder.area(true);
  }
  if (rightAxis) {
    builder.yAxis((axis) => axis.position("right"));
  }
  for (const marker of markers) {
    builder.marker(marker);
  }
  const chart = builder.render();
  charts.push(chart);
  return chart;
}

function isOverlapping(left, right) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function expectBounded(chart) {
  const bounds = chart.element.viewBox.baseVal;
  const labels = [...chart.element.querySelectorAll(".orchid-charts-marker-label")];
  expect(labels.length).toBeGreaterThan(0);
  for (const [index, label] of labels.entries()) {
    const box = label.getBBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 0.5);
    expect(box.y).toBeGreaterThanOrEqual(bounds.y - 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height + 0.5);
    const remainingLabels = labels.slice(index + 1);
    for (const other of remainingLabels) {
      expect(isOverlapping(box, other.getBBox())).toBe(false);
    }
    for (const axis of chart.element.querySelectorAll(".orchid-charts-label")) {
      expect(isOverlapping(box, axis.getBBox())).toBe(false);
    }
    const legend = chart.element.querySelector(".orchid-charts-legend-group");
    if (legend) {
      expect(label.getBoundingClientRect().bottom).toBeLessThan(legend.getBoundingClientRect().top);
    }
  }
}

function expectOutside(chart, { horizontal = false, start = false } = {}) {
  const label = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
  const reference = chart.element.querySelector(".orchid-charts-marker");
  if (horizontal && start) {
    expect(label.y).toBeGreaterThan(Number(reference.getAttribute("y2")));
  }
  if (horizontal && !start) {
    expect(label.y + label.height).toBeLessThan(Number(reference.getAttribute("y1")));
  }
  if (!horizontal && start) {
    expect(label.x + label.width).toBeLessThan(Number(reference.getAttribute("x1")));
  }
  if (!horizontal && !start) {
    expect(label.x).toBeGreaterThan(Number(reference.getAttribute("x2")));
  }
  expectBounded(chart);
}

afterEach(() => {
  for (const chart of charts.splice(0)) {
    chart.destroy();
  }
  document.body.replaceChildren();
});

describe("reference labels remain readable outside changing chart data", () => {
  it("reserves the default rail through the original positional marker API", () => {
    const chart = LineChart.make(mount())
      .labels(["Апр", "Май", "Июн"])
      .dataset("Факт", [800, 850, 900])
      .area(true)
      .marker("План", 500)
      .render();
    charts.push(chart);
    expectOutside(chart);
  });

  it.each([
    [false, "end"],
    [false, "start"],
    [true, "end"],
    [true, "start"],
  ])("reserves the %s orientation %s rail beyond the reference span and axes", (horizontal, position) => {
    const chart = render(mount(), {
      horizontal,
      markers: [{ label: "План", value: 500, labelPosition: position }],
    });
    expectOutside(chart, { horizontal, start: position === "start" });
  });

  it.each(["font-size: 14px;", "font: 700 20px monospace; letter-spacing: 2px;"])(
    "fits the caller's actual annotation typography %s with a right value axis",
    (typography) => {
      const chart = render(mount({ typography }), { rightAxis: true });
      expectOutside(chart);
      expect(getComputedStyle(chart.element.querySelector(".orchid-charts-marker-label")).fontSize).toBe(
        typography.includes("20px") ? "20px" : "14px",
      );
    },
  );

  it("keeps the default rail clear when an update reverses the filled data", () => {
    const chart = render(mount());
    expectOutside(chart);
    chart.update({
      labels: ["Апр", "Май", "Июн"],
      datasets: [{ name: "Факт", values: [200, 100, 0] }],
      markers: [{ label: "План", value: 500 }],
    });
    expectOutside(chart);
    const area = chart.element.querySelector(".orchid-charts-area").getBBox();
    expect(isOverlapping(area, chart.element.querySelector(".orchid-charts-marker-label").getBBox())).toBe(
      false,
    );
  });

  it("keeps an explicitly centered label inside the reference span", () => {
    const chart = render(mount(), { markers: [{ label: "План", value: 500, labelPosition: "center" }] });
    const box = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
    const reference = chart.element.querySelector(".orchid-charts-marker");
    expect(box.x).toBeGreaterThan(Number(reference.getAttribute("x1")));
    expect(box.x + box.width).toBeLessThan(Number(reference.getAttribute("x2")));
  });

  it.each([false, true])(
    "packs equal and adjacent values without obscuring labels in orientation %s",
    (horizontal) => {
      const markers = [500, 500, 501, 502, 503, 504].map((value, index) => ({
        label: `План ${index + 1}`,
        value,
      }));
      const chart = render(mount({ typography: "font: 700 20px monospace; letter-spacing: 1px;" }), {
        horizontal,
        markers,
      });
      expect(chart.element.querySelectorAll(".orchid-charts-marker-label")).toHaveLength(markers.length);
      expectBounded(chart);
      const references = [...chart.element.querySelectorAll(".orchid-charts-marker")];
      expect(references).toHaveLength(markers.length);
      expect(references[0].getAttribute(horizontal ? "x1" : "y1")).toBe(
        references[1].getAttribute(horizontal ? "x1" : "y1"),
      );
      expectOutside(chart, { horizontal });
      const leaders = [...chart.element.querySelectorAll(".orchid-charts-marker-leader")];
      expect(leaders.length).toBeGreaterThan(0);
      for (const leader of leaders) {
        const origin = leader.getPointAtLength(0);
        expect(
          references.some((reference) => {
            const endpoint = horizontal
              ? { x: Number(reference.getAttribute("x1")), y: Number(reference.getAttribute("y1")) }
              : { x: Number(reference.getAttribute("x2")), y: Number(reference.getAttribute("y2")) };
            return Math.hypot(origin.x - endpoint.x, origin.y - endpoint.y) < 1;
          }),
        ).toBe(true);
      }
    },
  );

  it("grows intrinsic height for a dense rail and keeps its legend below every label", () => {
    const host = mount({ typography: "font-size: 20px;" });
    const chart = render(host);
    const originalHeight = chart.element.viewBox.baseVal.height;
    const markers = Array.from({ length: 24 }, (_, index) => ({ label: `План ${index + 1}`, value: 500 }));
    chart.update({ datasets: [{ name: "Факт", values: [800, 850, 900] }], markers });
    expect(chart.element.querySelectorAll(".orchid-charts-marker-label")).toHaveLength(markers.length);
    expect(chart.element.viewBox.baseVal.height).toBeGreaterThan(originalHeight);
    expectBounded(chart);
  });

  it.each([false, true])(
    "bounds narrow long labels and retains their full accessible text in orientation %s",
    (horizontal) => {
      const fullText = "План подразделения по сопровождению корпоративных заказчиков";
      const chart = render(
        mount({ width: 240, typography: "font: 700 20px monospace; letter-spacing: 2px;" }),
        {
          horizontal,
          markers: [{ label: fullText, value: 500 }],
        },
      );
      expectOutside(chart, { horizontal });
      const label = chart.element.querySelector(".orchid-charts-marker-label");
      expect([
        label.textContent,
        label.getAttribute("aria-label"),
        label.querySelector("title")?.textContent,
      ]).toContain(fullText);
      const exported = new DOMParser().parseFromString(chart.toSvg(), "image/svg+xml");
      expect(exported.querySelector(".orchid-charts-marker-label").textContent).toContain(fullText);
      const exportedSvg = document.importNode(exported.documentElement, true);
      document.body.append(exportedSvg);
      expectOutside({ element: exportedSvg }, { horizontal });
      exportedSvg.remove();
    },
  );

  it("reserves no space for empty labels or excluded values outside the domain", () => {
    const chart = render(mount(), { markers: [] });
    const original = chart.element.querySelector(".orchid-charts-area").getBBox();
    chart.update({
      datasets: [{ name: "Факт", values: [800, 850, 900] }],
      markers: [
        { label: "Не показывать", value: 500, formatLabel: () => "" },
        { label: "Вне диапазона", value: 5000, includeInDomain: false },
      ],
    });
    const updated = chart.element.querySelector(".orchid-charts-area").getBBox();
    expect(updated.x).toBeCloseTo(original.x);
    expect(updated.width).toBeCloseTo(original.width);
    expect(
      [...chart.element.querySelectorAll(".orchid-charts-marker-label")].filter((label) =>
        label.textContent.trim(),
      ),
    ).toHaveLength(0);
    expect(chart.element.textContent).not.toContain("Вне диапазона");
  });

  it("measures labels after a hidden host becomes visible", async () => {
    const host = mount({ hidden: true, typography: "font: 700 20px monospace; letter-spacing: 2px;" });
    const chart = render(host);
    host.hidden = false;
    await expect.poll(() => chart.element.getBoundingClientRect().width).toBeGreaterThan(0);
    chart.update({
      datasets: [{ name: "Факт", values: [900, 850, 800] }],
      markers: [{ label: "План", value: 500 }],
    });
    expectOutside(chart);
  });
});
