import { afterEach, expect, it } from "vitest";

import { DonutChart, LineChart, RadarChart } from "../src/index.js";
import { labelElement, truncateText } from "../src/support/presentation/TextLayout.js";
import "../src/styles.css";

const charts = [];
const widthOf = (value) => String(value).length * 20;
const radarBuilder = (host) =>
  RadarChart.make(host)
    .labels(["North", "East", "South", "West"])
    .dataset("Actual", [40, 50, 60, 70])
    .dataset("Plan", [60, 50, 40, 80]);

afterEach(() => {
  for (const chart of charts.splice(0)) {
    chart.destroy();
  }
  document.body.replaceChildren();
});

it("fits an ellipsis or accessible empty text when the font exceeds the width budget", () => {
  expect(truncateText("Planning", 45, widthOf)).toBe("P…");
  expect(truncateText("Planning", 20, widthOf)).toBe("…");
  expect(truncateText("Planning", 10, widthOf)).toBe("");
  const label = labelElement({
    value: "Planning",
    attributes: { class: "orchid-charts-label" },
    measurement: { maxWidth: 10, widthOf },
  });
  expect(label.firstChild.nodeType).toBe(Node.TEXT_NODE);
  expect(label.firstChild.textContent).toBe("");
  expect(label.getAttribute("aria-label")).toBe("Planning");
  expect(label.querySelector("title").textContent).toBe("Planning");
});

it("reserves a CSS-sized title above the plot and preserves its accessible full text", () => {
  const host = document.createElement("div");
  host.style.width = "360px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-title { font: 700 32px monospace; letter-spacing: 2px; }";
  document.body.append(style, host);
  const chart = LineChart.make(host)
    .height(220)
    .title("A long revenue title for this chart")
    .dataset([10, 30, 20])
    .render();
  charts.push(chart);
  const title = chart.element.querySelector(".orchid-charts-title");
  const bounds = title.getBBox();
  const viewport = chart.element.viewBox.baseVal;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y).toBeGreaterThanOrEqual(viewport.y);
  expect(bounds.y + bounds.height).toBeLessThan(0);
  expect(viewport.height).toBe(220);
  expect(title.getAttribute("aria-label")).toBe("A long revenue title for this chart");
  expect(getComputedStyle(title).fontSize).toBe("32px");
  chart.update({ datasets: [{ values: [30, 50, 40] }] });
  expect(chart.element.viewBox.baseVal.height).toBe(viewport.height);
});

it("measures and truncates a custom-font donut total inside its center", () => {
  const host = document.createElement("div");
  host.style.width = "320px";
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-direct-value { font: 700 28px monospace; letter-spacing: 2px; }";
  document.body.append(style, host);
  const chart = DonutChart.make(host)
    .height(280)
    .labels(["A", "B"])
    .dataset([1_000_000, 2_000_000])
    .formatValue(() => "Very long total")
    .render();
  charts.push(chart);
  const label = chart.element.querySelector(".orchid-charts-direct-value");
  expect(label.querySelector("title").textContent).toBe("Very long total");
  expect(label.getBBox().width).toBeLessThan(120);
  expect(getComputedStyle(label).fontSize).toBe("28px");
});

it("translates radar tooltip bounds with the measured title band", () => {
  const style = document.createElement("style");
  style.textContent = ".orchid-charts-title { font: 700 32px monospace; }";
  document.body.append(style);
  const hosts = Array.from({ length: 2 }, () => {
    const host = document.createElement("div");
    host.style.width = "640px";
    document.body.append(host);
    return host;
  });
  const titled = radarBuilder(hosts[0]).height(320).title("Direction").render();
  const bandHeight = -titled.element.viewBox.baseVal.y;
  const plain = radarBuilder(hosts[1])
    .height(320 - bandHeight)
    .render();
  charts.push(titled, plain);
  const positions = [titled, plain].map((chart) => {
    chart.element
      .querySelector(".orchid-charts-radar-axis")
      .dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    const host = chart.element.parentElement;
    const tooltip = host.querySelector(".orchid-charts-tooltip").getBoundingClientRect();
    return {
      top: tooltip.top - host.getBoundingClientRect().top,
      bottom: tooltip.bottom - host.getBoundingClientRect().top,
    };
  });
  expect(positions[0].top).toBeCloseTo(positions[1].top + bandHeight, 1);
  const legendTop =
    titled.element.querySelector(".orchid-charts-legend-group").getBoundingClientRect().top -
    hosts[0].getBoundingClientRect().top;
  expect(positions[0].bottom).toBeLessThan(legendTop);
});
