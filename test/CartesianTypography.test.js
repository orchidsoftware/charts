import { afterEach, beforeEach, expect, it } from "vitest";

import { BarChart, LineChart } from "../src/index.js";
import "../src/styles.css";

const scene = {};

beforeEach(() => {
  scene.host = document.createElement("div");
  const { host } = scene;
  host.className = "cartesian-type-test";
  host.style.width = "460px";
  scene.style = document.createElement("style");
  const { style } = scene;
  style.textContent = `
    .cartesian-type-test .orchid-charts-label { font: 18px monospace; letter-spacing: 2px; }
    .cartesian-type-test .orchid-charts-value-label { font-size: 24px; font-weight: 700; letter-spacing: 3px; }
    .cartesian-type-test .orchid-charts-annotation { font: italic 26px Georgia; letter-spacing: 2px; }
    .cartesian-type-test .orchid-charts-region-label { font-size: 22px; }
  `;
  document.head.append(style);
  document.body.append(host);
});

afterEach(() => {
  scene.chart?.destroy();
  scene.host.remove();
  scene.style.remove();
});

function expectInsideViewport(element, viewport) {
  const bounds = element.getBBox();
  expect(bounds.x).toBeGreaterThanOrEqual(-0.01);
  expect(bounds.y).toBeGreaterThanOrEqual(-0.01);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 0.01);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 0.01);
}

it("reserves numeric gutters and category clearance using their different CSS fonts", () => {
  const { host } = scene;
  const chart = LineChart.make(host)
    .labels(["January", "February", "March", "April", "May", "June"])
    .dataset("Actual", [1000, 2000, 3000, 4000, 5000, 6000])
    .render();
  scene.chart = chart;
  const axis = chart.element.querySelector(".orchid-charts-x-axis");
  const plotLeft = Number(axis.getAttribute("x1"));
  const plotBottom = Number(axis.getAttribute("y1"));
  const values = [...chart.element.querySelectorAll(".orchid-charts-value-label")];
  const categories = [
    ...chart.element.querySelectorAll("text.orchid-charts-label:not(.orchid-charts-value-label)"),
  ];

  expect(getComputedStyle(values[0]).fontSize).toBe("24px");
  expect(categories.length).toBeLessThan(6);
  for (const label of values) {
    const bounds = label.getBBox();
    expectInsideViewport(label, chart.element.viewBox.baseVal);
    expect(bounds.x + bounds.width).toBeLessThan(plotLeft);
  }
  for (const [index, label] of categories.entries()) {
    const bounds = label.getBBox();
    expect(bounds.y).toBeGreaterThan(plotBottom);
    expectInsideViewport(label, chart.element.viewBox.baseVal);
    if (index === 0) {
      continue;
    }
    const previous = categories[index - 1].getBBox();
    expect(bounds.x).toBeGreaterThan(previous.x + previous.width);
  }
});

it("uses CSS glyph widths and line spacing for wrapped horizontal categories", () => {
  scene.style.textContent += `.cartesian-type-test .orchid-charts-multiline-label { font-size: 22px; letter-spacing: 3px; }`;
  const { host } = scene;
  const chart = BarChart.make(host)
    .horizontal()
    .height(360)
    .labels(["Customer support services", "Product development", "Design"])
    .dataset("Actual", [20, 40, 60])
    .render();
  scene.chart = chart;
  const categories = [
    ...chart.element.querySelectorAll("text.orchid-charts-label:not(.orchid-charts-value-label)"),
  ];
  const plotLeft = Number(chart.element.querySelector(".orchid-charts-y-axis").getAttribute("x1"));

  expect(categories.some((label) => label.querySelectorAll("tspan").length > 1)).toBe(true);
  for (const label of categories) {
    expectInsideViewport(label, chart.element.viewBox.baseVal);
    expect(label.getBBox().x + label.getBBox().width).toBeLessThan(plotLeft);
    const lines = [...label.querySelectorAll("tspan")];
    for (let index = 1; index < lines.length; index += 1) {
      const previous = lines[index - 1].getBBox();
      expect(lines[index].getBBox().y).toBeGreaterThanOrEqual(previous.y + previous.height);
    }
  }
});

it.each([false, true])("keeps large custom annotation glyphs inside their inline plot (%s)", (horizontal) => {
  const { host } = scene;
  const chart = BarChart.make(host)
    .horizontal(horizontal)
    .height(360)
    .labels(["A", "B", "C"])
    .dataset("Actual", [20, 40, 60])
    .marker("План", 40, (marker) => marker.labelPosition("end"))
    .marker("Начало", 20, (marker) => marker.labelPosition("start"))
    .marker("Центр", 60, (marker) => marker.labelPosition("center"))
    .region("Область", [20, 40])
    .render();
  scene.chart = chart;
  const lines = [...chart.element.querySelectorAll(".orchid-charts-marker")];
  const labels = [...chart.element.querySelectorAll(".orchid-charts-annotation")];
  const frame = horizontal
    ? {
        left: Number(lines[0].getAttribute("x1")),
        right: Number(lines[2].getAttribute("x1")),
        top: Number(lines[0].getAttribute("y1")),
        bottom: Number(lines[0].getAttribute("y2")),
      }
    : {
        left: Number(lines[0].getAttribute("x1")),
        right: Number(lines[0].getAttribute("x2")),
        top: Number(lines[2].getAttribute("y1")),
        bottom: Number(chart.element.querySelector(".orchid-charts-x-axis").getAttribute("y1")),
      };

  expect(getComputedStyle(chart.element.querySelector(".orchid-charts-marker-label")).fontSize).toBe("26px");
  for (const label of labels) {
    const bounds = label.getBBox();
    expect(bounds.y).toBeGreaterThanOrEqual(frame.top - 0.01);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(frame.bottom + 0.01);
    expectInsideViewport(label, chart.element.viewBox.baseVal);
  }
  expect(chart.element.querySelector(".orchid-charts-marker-label").getAttribute("text-anchor")).toBe("end");
});

it("samples crowded numeric ticks without removing their grid or changing the scale", () => {
  const { host } = scene;
  const chart = LineChart.make(host).height(150).dataset("Actual", [0, 100]).render();
  scene.chart = chart;
  const labels = [...chart.element.querySelectorAll(".orchid-charts-value-label")];
  const guides = [...chart.element.querySelectorAll(".orchid-charts-grid-horizontal")];

  expect(labels.length).toBeLessThan(guides.length);
  expect(guides).toHaveLength(6);
  expect(labels[0].textContent).toBe("100");
  expect(labels.at(-1).textContent).toBe("0");
  for (let index = 1; index < labels.length; index += 1) {
    const previous = labels[index - 1].getBBox();
    expect(labels[index].getBBox().y).toBeGreaterThan(previous.y + previous.height);
  }
});

it("samples crowded wrapped rows while preserving every bar and tooltip value", () => {
  const { host } = scene;
  const chart = BarChart.make(host)
    .horizontal()
    .height(320)
    .labels(Array.from({ length: 12 }, (_, index) => `Customer support services ${index}`))
    .dataset(
      "Actual",
      Array.from({ length: 12 }, (_, index) => index + 1),
    )
    .render();
  scene.chart = chart;
  const labels = [...chart.element.querySelectorAll(".orchid-charts-multiline-label")];

  expect(labels.length).toBeGreaterThan(1);
  expect(labels.length).toBeLessThan(12);
  expect(chart.element.querySelectorAll(".orchid-charts-bar")).toHaveLength(12);
  expect(chart.point(11).label).toBe("Customer support services 11");
  for (let index = 1; index < labels.length; index += 1) {
    const previous = labels[index - 1].getBBox();
    expect(labels[index].getBBox().y).toBeGreaterThan(previous.y + previous.height);
  }
});

it("allows formatters to hide inline annotation text", () => {
  const { host } = scene;
  const chart = LineChart.make(host)
    .dataset([1, 2])
    .marker("Plan", 1, (marker) => marker.formatLabel(() => ""))
    .region("Band", [1, 2], (region) => region.formatLabel(() => ""))
    .render();
  scene.chart = chart;
  expect(chart.element.querySelectorAll(".orchid-charts-annotation")).toHaveLength(2);
  expect(chart.element.querySelector(".orchid-charts-marker-label").textContent).toBe("");
});

it("contains italic category overhangs at both chart edges", () => {
  const { host, style } = scene;
  host.style.width = "400px";
  style.textContent = `.cartesian-type-test .orchid-charts-label { font: italic 40px Georgia; }`;
  const chart = LineChart.make(host).height(250).labels(["j", "ff", "f"]).dataset([20, 40, 60]).render();
  scene.chart = chart;
  const labels = [
    ...chart.element.querySelectorAll("text.orchid-charts-label:not(.orchid-charts-value-label)"),
  ];

  expect(labels).toHaveLength(3);
  for (const label of labels) {
    expectInsideViewport(label, chart.element.viewBox.baseVal);
  }
});
