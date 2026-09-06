import { beforeEach, describe, expect, it, vi } from "vitest";

import { TimesheetChart } from "../src/index.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});
describe("Timesheet Rendering", () => {
  it("renders formatted intervals and preserves selection through updates", () => {
    const onSelect = vi.fn();
    const chart = TimesheetChart.make("#chart")
      .width(320)
      .onSelect(onSelect)
      .formatTick((date) => `T${date.getDate()}`)
      .formatDate((date) => `D${date.getDate()}`)
      .formatDuration((milliseconds) => `${milliseconds / 3_600_000} hours`)
      .range("2026-09-01T00:00:00Z", "2026-09-05T00:00:00Z")
      .task({
        label: "Design review with a deliberately long label",
        start: "2026-09-01T00:00:00Z",
        end: "2026-09-02T00:00:00Z",
        group: "Design",
        color: "#af52de",
      })
      .task({ label: "Build", start: "2026-09-02T00:00:00Z", end: "2026-09-04T00:00:00Z" })
      .render();
    expect(chart.element).toHaveClass("orchid-charts-timesheet-chart");
    expect(chart.element.querySelectorAll(".orchid-charts-timesheet-bar")).toHaveLength(2);
    expect(chart.element.querySelector(".orchid-charts-timesheet-task-label title").textContent).toContain(
      "deliberately long",
    );
    expect(chart.element.querySelector(".orchid-charts-timesheet-tick").textContent).toBe("T1");
    const firstBar = chart.element.querySelector(".orchid-charts-timesheet-bar");
    const first = chart.element.querySelector(".orchid-charts-timesheet-hit");
    expect(firstBar.getAttribute("rx")).toBe("3");
    expect(Number(first.getAttribute("width"))).toBeGreaterThan(Number(firstBar.getAttribute("width")));
    expect(first.dataset.tooltip).toBe(
      "Design review with a deliberately long label: D1 – D2, 24 hours, Design",
    );
    first.focus();
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toContain(
      "Design review",
    );
    expect(
      [...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row span")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["D1 – D2"]);
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-row strong").textContent).toBe("24 hours");
    first.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(chart.point()).toEqual(chart.point(0));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "timesheet",
        label: "Design review with a deliberately long label",
        duration: 86_400_000,
        group: "Design",
        color: "#af52de",
      }),
    );
    expect(chart.point(1)).toMatchObject({ label: "Build", color: "#AF52DE" });
  });

  it("keeps duration formatting when replacing task intervals", () => {
    const chart = TimesheetChart.make("#chart")
      .formatDuration((milliseconds) => `${milliseconds / 3_600_000} hours`)
      .task({ label: "Build", start: "2026-09-02T00:00:00Z", end: "2026-09-04T00:00:00Z" })
      .render();
    expect(
      chart.update({
        tasks: [{ label: "Task 1", start: "2026-10-01T08:00:00Z", end: "2026-10-01T12:00:00Z" }],
      }),
    ).toBe(chart);
    expect(chart.element.querySelector(".orchid-charts-timesheet-task-label").textContent).toBe("Task 1");
    expect(chart.element.querySelector(".orchid-charts-timesheet-hit").dataset.tooltip).toContain("4 hours");
  });

  it("renders square task bars when radius is zero", () => {
    const square = TimesheetChart.make("#chart")
      .radius(0)
      .task({ label: "Task 1", start: "2026-10-01T08:00:00Z", end: "2026-10-01T12:00:00Z" })
      .render();
    expect(square.element.querySelector(".orchid-charts-timesheet-bar").getAttribute("rx")).toBe("0");
  });
  it("validates timesheet dates, bounds, and task structure", () => {
    expect(() => TimesheetChart.make("#chart").render()).toThrow("non-empty tasks");
    expect(() => TimesheetChart.make("#chart").render()).toThrow("non-empty tasks");
    expect(() => TimesheetChart.make("#chart").task(null).render()).toThrow("must be an object");
    expect(() =>
      TimesheetChart.make("#chart").task({ label: "Task", start: "bad", end: "2026-01-02" }).render(),
    ).toThrow("timezone offset or Z");
    expect(() =>
      TimesheetChart.make("#chart").task({ label: "Task", start: "2026-01-02", end: "bad" }).render(),
    ).toThrow("timezone offset or Z");
    expect(() =>
      TimesheetChart.make("#chart").task({ label: "Task", start: "2026-01-02", end: "2026-01-02" }).render(),
    ).toThrow("after start");
    expect(() =>
      TimesheetChart.make("#chart")
        .range("2026-02-01", "2026-01-01")
        .task({ label: "Task", start: "2026-01-01", end: "2026-01-02" })
        .render(),
    ).toThrow("after start");
    expect(() =>
      TimesheetChart.make("#chart")
        .range("2026-01-02")
        .task({ label: "Task", start: "2026-01-01", end: "2026-01-03" })
        .render(),
    ).toThrow("contain every task");
    expect(() =>
      TimesheetChart.make("#chart")
        .range(undefined, "2026-01-02")
        .task({ label: "Task", start: "2026-01-01", end: "2026-01-03" })
        .render(),
    ).toThrow("contain every task");
  });
  it.each([
    {
      name: "one day",
      start: new Date("2026-01-01T00:00:00Z"),
      end: new Date("2026-01-02T00:00:00Z"),
      duration: /1 day/,
    },
    { name: "eleven days", start: "2026-01-01", end: "2026-01-12", duration: /days|year/ },
    { name: "one year", start: "2026-01-01", end: "2027-01-01", duration: /days|year/ },
    { name: "five years", start: "2020-01-01", end: "2025-01-01", duration: /days|year/ },
  ])("adapts tick units to $name", ({ start, end, duration }) => {
    const chart = TimesheetChart.make("#chart").width(240).task({ label: "Task", start, end }).render();
    expect(chart.element.querySelectorAll(".orchid-charts-timesheet-bar")).toHaveLength(1);
    expect(chart.element.querySelector(".orchid-charts-timesheet-tick")).not.toBeNull();
    expect(chart.element.querySelector(".orchid-charts-timesheet-hit").dataset.tooltip).toMatch(duration);
  });

  it("hides tick and task labels on a twenty-year chart when value labels are disabled", () => {
    const chart = TimesheetChart.make("#chart")
      .width(240)
      .valueLabels(false)
      .task({ label: "Task 5", start: "2000-01-01", end: "2020-01-01" })
      .render();
    expect(chart.element.querySelectorAll(".orchid-charts-timesheet-bar")).toHaveLength(1);
    expect(chart.element.querySelector(".orchid-charts-timesheet-tick")).toBeNull();
    expect(chart.element.querySelector(".orchid-charts-timesheet-task-label")).toBeNull();
    expect(chart.element.querySelector(".orchid-charts-timesheet-hit").dataset.tooltip).toMatch(/days|year/);
  });
});

it("formats a four-hour duration by default", () => {
  const hours = TimesheetChart.make("#chart")
    .task({ label: "Task", start: "2026-01-01T08:00:00Z", end: "2026-01-01T12:00:00Z" })
    .render();
  expect(hours.element.querySelector(".orchid-charts-timesheet-hit").dataset.tooltip).toContain("4 hours");
});

it("removes axes, grids and text from a bare timesheet", () => {
  const bare = TimesheetChart.make("#chart")
    .width(240)
    .axes(false)
    .grid(false)
    .valueLabels(false)
    .task({ label: "Task", start: "2026-01-01", end: "2026-01-02" })
    .render();
  expect(bare.element.querySelector(".orchid-charts-grid")).toBeNull();
  expect(bare.element.querySelector(".orchid-charts-axis")).toBeNull();
  expect(bare.element.querySelector("text")).toBeNull();
  expect(bare.element.querySelector(".orchid-charts-timesheet-hit").getAttribute("x")).toBe("0");
});
