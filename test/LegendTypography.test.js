import { afterEach, describe, expect, it, vi } from "vitest";

import { BarChart, DonutChart, LineChart, PercentageChart, PieChart, RadarChart } from "../src/index.js";
import "../src/styles.css";

const names = ["Дизайн · 42 %", "Разработка · 31 %", "Поддержка · 18 %", "Консалтинг · 9 %"];
const charts = [];

function mount(style, width = 360) {
  const parent = document.createElement("div");
  parent.style.width = `${width}px`;
  const sheet = document.createElement("style");
  sheet.textContent = `.orchid-charts-host > .orchid-charts-chart > .orchid-charts-legend-group > .orchid-charts-legend { ${style} }`;
  document.body.replaceChildren(sheet, parent);
  return parent;
}

function createChart(Definition, parent) {
  const builder = Definition.make(parent).height(320);
  if ([PieChart, DonutChart, PercentageChart].includes(Definition)) {
    builder.labels(names).dataset([42, 31, 18, 9]);
  }
  if (![PieChart, DonutChart, PercentageChart].includes(Definition)) {
    builder.labels(["Апр", "Май", "Июн"]);
    for (const name of names) {
      builder.dataset({ name, values: [20, 40, 30] });
    }
  }
  const chart = builder.render();
  charts.push(chart);
  return chart;
}

function expectSeparated(chart) {
  const labels = [...chart.element.querySelectorAll(".orchid-charts-legend")];
  const swatches = [...chart.element.querySelectorAll(".orchid-charts-legend-swatch")];
  const viewBox = chart.element.viewBox.baseVal;
  for (const [index, label] of labels.entries()) {
    const box = label.getBBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewBox.width + 0.5);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewBox.height + 0.5);
    const followingSwatches = swatches.slice(index + 1);
    for (const next of followingSwatches) {
      const other = next.getBBox();
      const isRowOverlap = box.y < other.y + other.height && box.y + box.height > other.y;
      expect(isRowOverlap && box.x + box.width > other.x).toBe(false);
    }
    const followingLabels = labels.slice(index + 1);
    for (const next of followingLabels) {
      const other = next.getBBox();
      expect(
        box.x < other.x + other.width &&
          box.x + box.width > other.x &&
          box.y < other.y + other.height &&
          box.y + box.height > other.y,
      ).toBe(false);
    }
  }
  const legend = chart.element.querySelector(".orchid-charts-legend-group").getBoundingClientRect();
  const marks = chart.element.querySelectorAll(
    ".orchid-charts-visual-mark, .orchid-charts-radar, .orchid-charts-percentage-segment, .orchid-charts-pie-slice, .orchid-charts-donut-slice",
  );
  expect(marks.length).toBeGreaterThan(0);
  for (const mark of marks) {
    expect(mark.getBoundingClientRect().bottom).toBeLessThan(legend.top);
  }
}

afterEach(() => {
  for (const chart of charts.splice(0)) {
    chart.destroy();
  }
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("CSS legend typography", () => {
  it.each([BarChart, LineChart, RadarChart, PieChart, DonutChart, PercentageChart])(
    "wraps %s legends at the actual 14px font size",
    (Definition) => {
      const chart = createChart(Definition, mount("font-size: 14px;"));
      expect(getComputedStyle(chart.element.querySelector(".orchid-charts-legend")).fontSize).toBe("14px");
      expectSeparated(chart);
    },
  );

  it.each([140, 240, 360])("fits 20px bold spaced monospace text within %spx", (width) => {
    const chart = createChart(PieChart, mount("font: 700 20px monospace; letter-spacing: 2px;", width));
    expectSeparated(chart);
    expect(chart.element.querySelector(".orchid-charts-legend title")).not.toBeNull();
  });

  it("reads changed CSS on update and responsive resize", () => {
    const parent = mount("font-size: 14px;");
    const chart = createChart(PercentageChart, parent);
    document.querySelector("style").textContent =
      ".orchid-charts-host .orchid-charts-legend { font: 700 20px monospace; letter-spacing: 2px; }";
    chart.update({ labels: names, datasets: [{ values: [40, 30, 20, 10] }] });
    expectSeparated(chart);
    parent.style.width = "240px";
    dispatchEvent(new Event("resize"));
    expect(chart.element.viewBox.baseVal.width).toBe(240);
    expectSeparated(chart);
    expect(parent.querySelectorAll("svg")).toHaveLength(1);
  });
});

it.each(["Дизайн Ёж", "العربية", "日本語", "🚀 Design"])("reserves row height for %s glyphs", (name) => {
  const parent = mount("font: 20px serif; letter-spacing: 1px;", 140);
  const chart = PieChart.make(parent)
    .height(320)
    .labels([name, `${name} Plus`, `${name} More`])
    .dataset([3, 2, 1])
    .render();
  charts.push(chart);
  expectSeparated(chart);
});

it.each(["block", "none"])(
  "removes measurement nodes and restores a %s host after a failed initial render",
  (display) => {
    const parent = mount("font-size: 20px;");
    parent.style.display = display;
    const original = document.createElement("span");
    original.textContent = "Keep this content";
    parent.append(original);
    expect(() =>
      PieChart.make(parent)
        .labels(names)
        .dataset([42, 31, 18, 9])
        .formatLabel(() => {
          throw new Error("formatter failed");
        })
        .render(),
    ).toThrow("formatter failed");
    expect(parent.childNodes).toHaveLength(1);
    expect(parent.firstChild).toBe(original);
    expect(parent.classList.contains("orchid-charts-host")).toBe(false);
    expect(document.querySelectorAll("svg")).toHaveLength(0);
  },
);

it("keeps the current chart intact after a failed update", () => {
  const parent = mount("font-size: 20px;");
  const formatter = vi.fn((value) => value);
  const chart = PieChart.make(parent).labels(names).dataset([42, 31, 18, 9]).formatLabel(formatter).render();
  charts.push(chart);
  const before = parent.getHTML();
  formatter.mockImplementation(() => {
    throw new Error("formatter failed");
  });
  expect(() => chart.update({ labels: names, datasets: [{ values: [4, 3, 2, 1] }] })).toThrow(
    "formatter failed",
  );
  expect(parent.getHTML()).toBe(before);
  expect(parent.classList.contains("orchid-charts-host")).toBe(true);
});

it("retains hidden-host rendering and omits disabled legends", () => {
  const parent = mount("font-size: 20px;");
  parent.style.display = "none";
  const chart = PieChart.make(parent)
    .height(320)
    .labels(names)
    .dataset([42, 31, 18, 9])
    .legend(false)
    .render();
  charts.push(chart);
  expect(parent.querySelectorAll("svg")).toHaveLength(1);
  expect(chart.element.querySelector(".orchid-charts-legend-group")).toBeNull();
  parent.style.display = "block";
  dispatchEvent(new Event("resize"));
  expect(chart.element.viewBox.baseVal.width).toBe(360);
});

it("measures relative font sizes inherited through the chart host on first render", () => {
  const parent = mount("font-size: 1.5em; font-weight: 600;");
  parent.style.fontSize = "16px";
  const chart = createChart(PieChart, parent);
  expect(getComputedStyle(chart.element.querySelector(".orchid-charts-legend")).fontSize).toBe("24px");
  expectSeparated(chart);
});

it.each(["explicit", "automatic"])(
  "lays out a visible legend while its %s-width host is hidden",
  (sizing) => {
    const parent = mount("font: 700 20px monospace; letter-spacing: 2px;", 640);
    parent.style.display = "none";
    const builder = PieChart.make(parent).height(320).labels(names).dataset([42, 31, 18, 9]);
    if (sizing === "explicit") {
      builder.width(640);
    }
    const chart = builder.render();
    charts.push(chart);
    parent.style.display = "block";
    expect(chart.element.viewBox.baseVal.width).toBe(640);
    expectSeparated(chart);
    expect(document.querySelectorAll("svg")).toHaveLength(1);
  },
);
