import { expect, it } from "vitest";

import { LineChart } from "../src/index.js";
import "../src/styles.css";

it("reserves a reference label rail outside a fully filled plot", () => {
  const host = document.createElement("div");
  host.style.width = "360px";
  document.body.append(host);
  const chart = LineChart.make(host)
    .labels(["A", "B", "C"])
    .dataset("Actual", [600, 700, 800])
    .marker("План", 500)
    .render();
  const label = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
  const line = chart.element.querySelector(".orchid-charts-marker");
  expect(label.x).toBeGreaterThan(Number(line.getAttribute("x2")));
  chart.destroy();
  host.remove();
});

it("clears caller-sized numeric labels on the right axis", () => {
  const host = document.createElement("div");
  host.style.width = "360px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-label { font-size: 20px; }";
  document.body.append(style, host);
  const chart = LineChart.make(host)
    .dataset("Actual", [600, 700, 800])
    .yAxis((axis) => axis.position("right"))
    .marker("План", 600)
    .render();
  const box = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
  for (const label of chart.element.querySelectorAll(".orchid-charts-value-label")) {
    const axis = label.getBBox();
    const isVerticalOverlap = box.y < axis.y + axis.height && box.y + box.height > axis.y;
    expect(isVerticalOverlap && box.x < axis.x + axis.width).toBe(false);
  }
  chart.destroy();
  host.remove();
  style.remove();
});

it.each([false, true])(
  "bounds explicit inside center labels at the last value in orientation %s",
  async (horizontal) => {
    const { BarChart } = await import("../src/index.js");
    const host = document.createElement("div");
    host.style.width = "240px";
    document.body.append(host);
    const builder = (horizontal ? BarChart : LineChart).make(host).dataset("Actual", [0, 500, 1000]);
    if (horizontal) {
      builder.horizontal();
    }
    const chart = builder.marker({ label: "Target", value: 1000, labelPosition: "center" }).render();
    const box = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
    const frame = chart.element.querySelector(".orchid-charts-marker");
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(chart.element.viewBox.baseVal.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    const insideRight = horizontal
      ? Number(frame.getAttribute("x1"))
      : chart.element.viewBox.baseVal.width + 1;
    expect(box.x + box.width).toBeLessThan(insideRight);
    chart.destroy();
    host.remove();
  },
);

it("keeps Arabic glyph bearings outside the plot", () => {
  const host = document.createElement("div");
  host.style.width = "360px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-marker-label { font-size: 20px; direction: rtl; }";
  document.body.append(style, host);
  const chart = LineChart.make(host).dataset("Actual", [600, 700, 800]).marker("الخطة", 600).render();
  const box = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
  expect(box.x).toBeGreaterThan(
    Number(chart.element.querySelector(".orchid-charts-marker").getAttribute("x2")),
  );
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  chart.destroy();
  host.remove();
  style.remove();
});

it("budgets both narrow side rails without inverting the data frame", () => {
  const host = document.createElement("div");
  host.style.width = "100px";
  document.body.append(host);
  const chart = LineChart.make(host)
    .dataset("Actual", [600, 700, 800])
    .marker({ label: "Start", value: 400, labelPosition: "start" })
    .marker("End", 600)
    .render();
  const line = chart.element.querySelector(".orchid-charts-marker");
  expect(Number(line.getAttribute("x2"))).toBeGreaterThan(Number(line.getAttribute("x1")));
  for (const label of chart.element.querySelectorAll(".orchid-charts-marker-label")) {
    const box = label.getBBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(chart.element.viewBox.baseVal.width);
    expect(label.textContent.length).toBeGreaterThan(0);
  }
  chart.destroy();
  host.remove();
});

it("routes dense horizontal leaders around every label", async () => {
  const { BarChart } = await import("../src/index.js");
  const host = document.createElement("div");
  host.style.width = "360px";
  document.body.append(host);
  const chart = BarChart.make(host)
    .horizontal()
    .dataset("Actual", [800, 900, 1000])
    .marker("One", 500)
    .marker("Two", 500)
    .marker("Three", 500)
    .render();
  const labels = [...chart.element.querySelectorAll(".orchid-charts-marker-label")].map((label) =>
    label.getBBox(),
  );
  const leaders = chart.element.querySelectorAll(".orchid-charts-marker-leader");
  expect(leaders.length).toBeGreaterThan(0);
  for (const leader of leaders) {
    for (let step = 0; step <= 200; step += 1) {
      const point = leader.getPointAtLength((leader.getTotalLength() * step) / 200);
      for (const box of labels) {
        expect(
          point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height,
        ).toBe(false);
      }
    }
  }
  chart.destroy();
  host.remove();
});

it("keeps a narrow horizontal frame positive with long category and reference labels", async () => {
  const { BarChart } = await import("../src/index.js");
  const host = document.createElement("div");
  host.style.width = "100px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-marker-label { font-size: 20px; }";
  document.body.append(style, host);
  const chart = BarChart.make(host)
    .horizontal()
    .labels(["Long category", "Other category"])
    .dataset("Actual", [600, 800])
    .marker("Very long end marker", 400)
    .marker({ label: "Very long start marker", value: 500, labelPosition: "start" })
    .render();
  const bars = chart.element.querySelectorAll(".orchid-charts-bar");
  for (const bar of bars) {
    expect(bar.getBBox().width).toBeGreaterThan(0);
  }
  for (const label of chart.element.querySelectorAll(".orchid-charts-marker-label")) {
    const box = label.getBBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(chart.element.viewBox.baseVal.width);
    expect(box.width).toBeGreaterThan(0);
  }
  chart.destroy();
  host.remove();
  style.remove();
});

it("grows only the intrinsic size required by large glyphs and preserves the legend", () => {
  const host = document.createElement("div");
  host.style.width = "100px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-marker-label { font-size: 80px; }";
  document.body.append(style, host);
  const builder = LineChart.make(host)
    .height(220)
    .dataset("Actual", [600, 700, 800])
    .dataset("Previous", [500, 600, 700]);
  for (let index = 0; index < 8; index += 1) {
    builder.marker({
      label: `Reference ${index}`,
      value: 600,
      labelPosition: index % 2 === 0 ? "start" : "end",
    });
  }
  const chart = builder.render();
  const frame = chart.element.querySelector(".orchid-charts-marker");
  expect(Number(frame.getAttribute("x2"))).toBeGreaterThan(Number(frame.getAttribute("x1")));
  expect(chart.element.viewBox.baseVal.width).toBeGreaterThan(100);
  const legend = chart.element.querySelector(".orchid-charts-legend-group").getBBox();
  for (const label of chart.element.querySelectorAll(".orchid-charts-marker-label")) {
    const box = label.getBBox();
    expect(getComputedStyle(label).fontSize).toBe("80px");
    expect(box.x).toBeGreaterThanOrEqual(-0.01);
    expect(box.x + box.width).toBeLessThanOrEqual(chart.element.viewBox.baseVal.width + 0.01);
    expect(box.y + box.height).toBeLessThan(legend.y);
  }
  chart.destroy();
  host.remove();
  style.remove();
});

it("keeps sparse bottom references compact and routes endpoint leaders clear of glyphs", async () => {
  const { BarChart } = await import("../src/index.js");
  const host = document.createElement("div");
  host.style.width = "360px";
  document.body.append(host);
  const chart = BarChart.make(host)
    .height(220)
    .horizontal()
    .dataset("Actual", [600, 800])
    .marker({ label: "Floor", value: 0, labelPosition: "start" })
    .marker({ label: "Ceiling", value: 800, labelPosition: "start" })
    .render();
  const labels = [...chart.element.querySelectorAll(".orchid-charts-marker-label")].map((label) =>
    label.getBBox(),
  );
  expect(labels[0].y).toBeCloseTo(labels[1].y);
  expect(chart.element.viewBox.baseVal.height).toBe(220);
  expect(labels[0].x + labels[0].width).toBeLessThan(labels[1].x);
  for (const leader of chart.element.querySelectorAll(".orchid-charts-marker-leader")) {
    for (let step = 0; step <= 200; step += 1) {
      const point = leader.getPointAtLength((leader.getTotalLength() * step) / 200);
      for (const box of labels) {
        expect(
          point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height,
        ).toBe(false);
      }
    }
  }
  chart.destroy();
  host.remove();
});

it.each([false, true])("keeps a long explicit center label bounded in orientation %s", async (horizontal) => {
  const { BarChart } = await import("../src/index.js");
  const host = document.createElement("div");
  host.style.width = "140px";
  document.body.append(host);
  const builder = (horizontal ? BarChart : LineChart).make(host).dataset("Actual", [600, 700, 800]);
  if (horizontal) {
    builder.horizontal();
  }
  const label = "Reference for the entire organization";
  const chart = builder.marker({ label, value: 500, labelPosition: "center" }).render();
  const element = chart.element.querySelector(".orchid-charts-marker-label");
  const box = element.getBBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(chart.element.viewBox.baseVal.width);
  expect(element.getAttribute("aria-label")).toBe(label);
  chart.destroy();
  host.remove();
});

it("clears large numeric tick descenders from the horizontal bottom rail", async () => {
  const { BarChart } = await import("../src/index.js");
  const host = document.createElement("div");
  host.style.width = "600px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-value-label { font-size:100px; }";
  document.body.append(style, host);
  const chart = BarChart.make(host)
    .height(280)
    .horizontal()
    .labels(["A", "B"])
    .dataset("Actual", [600, 800])
    .marker({ label: "Plan", value: 500, labelPosition: "start" })
    .render();
  const marker = chart.element.querySelector(".orchid-charts-marker-label").getBBox();
  for (const value of chart.element.querySelectorAll(".orchid-charts-value-label")) {
    const box = value.getBBox();
    expect(marker.y).toBeGreaterThan(box.y + box.height);
  }
  chart.destroy();
  host.remove();
  style.remove();
});
