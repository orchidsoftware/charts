import { afterEach, describe, expect, it } from "vitest";

import { BarChart, LineChart, RadarChart, TimesheetChart } from "../src/index.js";
import "../src/styles.css";

const charts = [];
const largeFont = "font: 700 20px monospace; letter-spacing: 1px;";

function mount(selector) {
  const host = document.createElement("div");
  host.style.width = "360px";
  const sheet = document.createElement("style");
  sheet.textContent = `.orchid-charts-host > .orchid-charts-chart ${selector} { ${largeFont} }`;
  document.body.replaceChildren(sheet, host);
  return host;
}

function track(builder) {
  const chart = builder.render();
  charts.push(chart);
  return chart;
}

function expectInsideViewport(chart, selector) {
  const labels = [...chart.element.querySelectorAll(selector)];
  expect(labels.length).toBeGreaterThan(0);
  const viewport = chart.element.viewBox.baseVal;
  for (const label of labels) {
    const bounds = label.getBBox();
    expect(bounds.x).toBeGreaterThanOrEqual(-0.5);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(bounds.y).toBeGreaterThanOrEqual(-0.5);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 0.5);
    expect(getComputedStyle(label).fontSize).toBe("20px");
  }
}

function expectHorizontalSeparation(labels) {
  for (let index = 1; index < labels.length; index += 1) {
    const previous = labels[index - 1].getBBox();
    expect(labels[index].getBBox().x).toBeGreaterThanOrEqual(previous.x + previous.width + 3);
  }
}

afterEach(() => {
  for (const chart of charts.splice(0)) {
    chart.destroy();
  }
  document.body.replaceChildren();
});

describe("CSS chart typography", () => {
  it("samples category labels using their rendered family, size, weight, and spacing", () => {
    const chart = track(
      LineChart.make(mount(".orchid-charts-label:not(.orchid-charts-value-label)"))
        .labels(["WWWW Apr", "WWWW May", "WWWW Jun", "WWWW Jul", "WWWW Aug", "WWWW Sep"])
        .dataset([20, 40, 30, 60, 50, 70])
        .legend(false),
    );
    const selector = ".orchid-charts-label:not(.orchid-charts-value-label)";
    const labels = [...chart.element.querySelectorAll(selector)];
    expectInsideViewport(chart, selector);
    expectHorizontalSeparation(labels);
    expect(chart.element.querySelectorAll(".orchid-charts-point")).toHaveLength(6);
  });

  it.each(["left", "right"])("reserves the actual numeric text gutter on the %s", (position) => {
    const chart = track(
      BarChart.make(mount(".orchid-charts-value-label"))
        .labels(["Apr", "May", "Jun"])
        .dataset([1200, 2400, 3200])
        .yAxis((axis) => axis.position(position).formatValue((value) => `$ ${value}`))
        .legend(false),
    );
    expectInsideViewport(chart, ".orchid-charts-value-label");
  });

  it("keeps horizontal numeric ticks separate at the actual CSS text width", () => {
    const chart = track(
      BarChart.make(mount(".orchid-charts-value-label"))
        .horizontal()
        .labels(["Apr", "May", "Jun"])
        .dataset([1200, 2400, 3200])
        .yAxis((axis) => axis.formatValue((value) => `$ ${value}`))
        .legend(false),
    );
    expectInsideViewport(chart, ".orchid-charts-value-label");
    expectHorizontalSeparation([...chart.element.querySelectorAll(".orchid-charts-value-label")]);
  });

  it("reads changed category CSS on update without retaining the previous font measurements", () => {
    const host = mount(".orchid-charts-label:not(.orchid-charts-value-label)");
    const sheet = document.querySelector("style");
    sheet.textContent = sheet.textContent.replace(largeFont, "font: 11px serif;");
    const labels = ["WWWW Apr", "WWWW May", "WWWW Jun", "WWWW Jul", "WWWW Aug", "WWWW Sep"];
    const chart = track(LineChart.make(host).labels(labels).dataset([20, 40, 30, 60, 50, 70]).legend(false));
    sheet.textContent = sheet.textContent.replace("font: 11px serif;", () => largeFont);
    chart.update({ labels, datasets: [{ values: [20, 40, 30, 60, 50, 70] }] });
    const selector = ".orchid-charts-label:not(.orchid-charts-value-label)";
    expectInsideViewport(chart, selector);
    expectHorizontalSeparation([...chart.element.querySelectorAll(selector)]);
    expect(host.querySelectorAll("svg")).toHaveLength(1);
  });

  it("wraps horizontal categories without clipping or overlapping their CSS-sized lines", () => {
    const chart = track(
      BarChart.make(mount(".orchid-charts-label:not(.orchid-charts-value-label)"))
        .height(360)
        .horizontal()
        .labels(["WWWW customer support", "WWWW product engineering"])
        .dataset([12, 24])
        .legend(false),
    );
    const selector = ".orchid-charts-label:not(.orchid-charts-value-label)";
    expectInsideViewport(chart, selector);
    const spans = [...chart.element.querySelectorAll(`${selector} tspan`)];
    expect(spans.length).toBeGreaterThan(2);
    for (let index = 1; index < spans.length; index += 1) {
      const previous = spans[index - 1].getBBox();
      expect(spans[index].getBBox().y).toBeGreaterThanOrEqual(previous.y + previous.height);
    }
  });

  it.each(["start", "center", "end"])("keeps a CSS-sized %s marker inside its original plot", (position) => {
    const chart = track(
      LineChart.make(mount(".orchid-charts-marker-label"))
        .height(260)
        .dataset([320, 410, 385, 530, 610, 684])
        .marker("План продаж", 500, (marker) => marker.labelPosition(position))
        .legend(false),
    );
    const line = chart.element.querySelector(".orchid-charts-marker");
    const label = chart.element.querySelector(".orchid-charts-marker-label");
    const bounds = label.getBBox();
    expectInsideViewport(chart, ".orchid-charts-marker-label");
    expect(bounds.x).toBeGreaterThanOrEqual(Number(line.getAttribute("x1")));
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(Number(line.getAttribute("x2")));
    expect(bounds.y + bounds.height).toBeLessThan(Number(line.getAttribute("y1")));
  });

  it("truncates radar categories at their actual CSS text width", () => {
    const chart = track(
      RadarChart.make(mount(".orchid-charts-label"))
        .height(280)
        .labels(["WWWW Design", "WWWW Engineering", "WWWW Support", "WWWW Research"])
        .dataset([60, 80, 50, 70])
        .legend(false),
    );
    expectInsideViewport(chart, ".orchid-charts-label");
    expect(chart.element.querySelector(".orchid-charts-label title")).not.toBeNull();
  });

  it("fits task labels and date ticks at the actual CSS text width", () => {
    const chart = track(
      TimesheetChart.make(mount(".orchid-charts-label"))
        .height(260)
        .task({ label: "WWWW Product design", start: "2026-01-01", end: "2026-01-08" })
        .task({ label: "WWWW Engineering", start: "2026-01-03", end: "2026-01-10" }),
    );
    expectInsideViewport(chart, ".orchid-charts-label");
    expectHorizontalSeparation([...chart.element.querySelectorAll(".orchid-charts-timesheet-tick")]);
    expect(chart.element.querySelector(".orchid-charts-timesheet-task-label title")).not.toBeNull();
  });
});
