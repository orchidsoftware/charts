import { beforeEach, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { RadarChart } from "../src/index.js";
import "../src/styles.css";

const labels = [
  "Performance",
  "Battery",
  "Camera",
  "Display",
  "Portability",
  "Value",
];
const current = [
  92,
  84,
  89,
  91,
  76,
  72,
];
const previous = [
  74,
  77,
  71,
  78,
  84,
  81,
];
const tooltip = () => document.querySelector(".orchid-charts-tooltip");

function phoneChart() {
  return RadarChart.make("#chart")
    .labels(labels)
    .height(320)
    .dataset({ name: "Current phone", values: current, color: "#2490ef" })
    .dataset({ name: "Previous phone", values: previous, color: "#8e8e93" });
}

function tap(mark) {
  for (const type of [
    "pointerdown",
    "pointerup",
    "pointerleave",
  ]) {
    mark.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "touch" }));
  }
}

beforeEach(async () => {
  await page.viewport(800, 700);
  document.body.innerHTML = '<div id="chart" style="width: 390px"></div><button>Outside</button>';
  await page.getByRole("button", { name: "Outside" }).hover();
});

it("hits both sides of every axis regardless of the overlapping profiles", async () => {
  const chart = phoneChart().render();
  const marks = chart.element.querySelectorAll(".orchid-charts-radar-axis");
  const line = marks[0].querySelector("line");
  const center = { x: Number(line.getAttribute("x1")), y: Number(line.getAttribute("y1")) };
  const radius = center.y - Number(line.getAttribute("y2"));
  for (const [
    index,
    label,
  ] of labels.entries()) {
    for (const offset of [
      -0.3,
      0.3,
    ]) {
      const angle = -Math.PI / 2 + (index * Math.PI) / 3 + offset;
      const position = {
        x: center.x + Math.cos(angle) * radius * 0.6,
        y: center.y + Math.sin(angle) * radius * 0.6,
      };
      // eslint-disable-next-line no-await-in-loop -- Each pointer position must be inspected before moving on.
      await page.elementLocator(chart.element).hover({ position });
      expect(tooltip().hidden).toBe(false);
      expect(tooltip().querySelector(".orchid-charts-tooltip-heading").textContent).toBe(label);
      expect(
        [
          ...tooltip().querySelectorAll("strong"),
        ].map((node) => node.textContent),
      ).toEqual([
        String(current[index]),
        String(previous[index]),
      ]);
      expect(chart.element.querySelectorAll(".is-hovered")).toHaveLength(1);
    }
  }
  await page.elementLocator(chart.element).hover({ position: center });
  expect(tooltip().hidden).toBe(true);
});

it("pins completed taps, switches measures and dismisses outside without treating scrolling as a tap", () => {
  const chart = phoneChart().render();
  const marks = chart.element.querySelectorAll(".orchid-charts-radar-axis");
  tap(marks[1]);
  expect(tooltip().hidden).toBe(false);
  expect(tooltip().textContent).toContain("Battery");
  tap(marks[2]);
  expect(tooltip().textContent).toContain("Camera");
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
  expect(tooltip().hidden).toBe(true);
  for (const type of [
    "pointerdown",
    "pointercancel",
    "pointerup",
  ]) {
    marks[3].dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "touch" }));
  }
  expect(tooltip().hidden).toBe(true);
});

it("reads every named pair from one tab stop and closes a focus preview with Escape", async () => {
  const chart = phoneChart().render();
  const marks = chart.element.querySelectorAll(".orchid-charts-radar-axis");
  const start = document.createElement("button");
  start.textContent = "Start keyboard navigation";
  document.body.prepend(start);
  start.focus();
  await userEvent.tab();
  for (const [
    index,
    label,
  ] of labels.entries()) {
    expect(document.activeElement).toBe(marks[index]);
    expect(marks[index].getAttribute("aria-label")).toContain(`${label} — Current phone: ${current[index]}`);
    expect(marks[index].getAttribute("aria-label")).toContain(`Previous phone: ${previous[index]}`);
    expect(getComputedStyle(marks[index].querySelector(".orchid-charts-radar-guide")).opacity).toBe("1");
    expect(tooltip().hidden).toBe(false);
    // eslint-disable-next-line no-await-in-loop -- Keyboard focus must visit the categories in order.
    await userEvent.keyboard("{ArrowRight}");
  }
  await userEvent.keyboard("{Escape}");
  expect(tooltip().hidden).toBe(true);
  expect(chart.element.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
});

it("preserves measure selection and formatter identity after update", () => {
  const onSelect = vi.fn();
  const formatter = vi.fn((value, context) => `${context.datasetName}: ${value}`);
  const chart = phoneChart()
    .tooltip((options) => options.formatValue(formatter))
    .onSelect(onSelect)
    .render();
  let mark = chart.element.querySelectorAll(".orchid-charts-radar-axis")[1];
  mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onSelect.mock.lastCall[0]).toMatchObject({
    label: "Battery",
    values: [
      84,
      77,
    ],
  });
  expect(tooltip().querySelector("strong").textContent).toBe("Current phone: 84");
  expect(formatter).toHaveBeenCalledWith(
    77,
    expect.objectContaining({ index: 1, datasetIndex: 1, datasetName: "Previous phone", target: "tooltip" }),
  );
  chart.update({
    labels,
    datasets: [
      { name: "Current phone", values: current.map((value) => value + 1) },
      { name: "Previous phone", values: previous },
    ],
  });
  mark = chart.element.querySelectorAll(".orchid-charts-radar-axis")[1];
  expect(mark.getAttribute("aria-pressed")).toBe("true");
  expect(chart.point()).toEqual({
    index: 1,
    label: "Battery",
    values: [
      85,
      77,
    ],
  });
  expect(tooltip().querySelector("strong").textContent).toBe("Current phone: 85");
});

it.each([
  240,
  320,
  390,
])("keeps every pair inside a %ipx chart without obscuring the legend", async (width) => {
  document.querySelector("#chart").style.width = `${width}px`;
  const chart = phoneChart().render();
  const hostBox = document.querySelector("#chart").getBoundingClientRect();
  const legendBox = chart.element.querySelector(".orchid-charts-legend-group").getBoundingClientRect();
  for (const mark of chart.element.querySelectorAll(".orchid-charts-radar-axis")) {
    mark.focus();
    const box = tooltip().getBoundingClientRect();
    expect(box.left).toBeGreaterThanOrEqual(hostBox.left);
    expect(box.right).toBeLessThanOrEqual(hostBox.right);
    expect(box.top).toBeGreaterThanOrEqual(hostBox.top);
    expect(box.bottom).toBeLessThan(legendBox.top);
    expect(tooltip().scrollHeight).toBeLessThanOrEqual(tooltip().clientHeight);
  }
  await expect
    .element(page.elementLocator(document.querySelector("#chart")))
    .toMatchScreenshot(`phone-comparison-${width}`);
});

it("keeps long similar names distinct at enlarged text size", () => {
  document.querySelector("#chart").style.width = "280px";
  const chart = RadarChart.make("#chart")
    .height(320)
    .labels(labels)
    .dataset("Phone with an extended name — Current", current)
    .dataset("Phone with an extended name — Previous", previous)
    .render();
  tooltip().style.fontSize = "24px";
  chart.element.querySelector(".orchid-charts-radar-axis").focus();
  for (const name of tooltip().querySelectorAll(".orchid-charts-tooltip-row span")) {
    expect(getComputedStyle(name).whiteSpace).toBe("normal");
    expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
  }
  expect(tooltip().scrollHeight).toBeLessThanOrEqual(tooltip().clientHeight);
});

it.each([
  1,
  2,
])("inspects %i measures even when all values overlap at zero", async (count) => {
  const chart = RadarChart.make("#chart")
    .labels(labels.slice(0, count))
    .dataset(
      "Current",
      Array.from({ length: count }, () => 0),
    )
    .dataset(
      "Previous",
      Array.from({ length: count }, () => 0),
    )
    .render();
  const marks = chart.element.querySelectorAll(".orchid-charts-radar-axis");
  expect(marks).toHaveLength(count);
  await page.elementLocator(chart.element).hover({ position: { x: 195, y: 60 } });
  expect(tooltip().hidden).toBe(false);
  expect(
    [
      ...tooltip().querySelectorAll("strong"),
    ].map((node) => node.textContent),
  ).toEqual([
    "0",
    "0",
  ]);
});
