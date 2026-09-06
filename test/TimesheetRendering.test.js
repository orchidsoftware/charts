import { beforeEach, describe, expect, it, vi } from "vitest";

import { TimesheetChart } from "../src/index.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".charts2-tooltip");

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});
describe("Timesheet Rendering", () => {
  it("renders, formats, updates, and selects timesheet work intervals", () => {
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
    expect(chart.element).toHaveClass("charts2-timesheet-chart");
    expect(chart.element.querySelectorAll(".charts2-timesheet-bar")).toHaveLength(2);
    expect(chart.element.querySelector(".charts2-timesheet-task-label title").textContent).toContain(
      "deliberately long",
    );
    expect(chart.element.querySelector(".charts2-timesheet-tick").textContent).toBe("T1");
    const firstBar = chart.element.querySelector(".charts2-timesheet-bar");
    const first = chart.element.querySelector(".charts2-timesheet-hit");
    expect(firstBar.getAttribute("rx")).toBe("3");
    expect(Number(first.getAttribute("width"))).toBeGreaterThan(Number(firstBar.getAttribute("width")));
    expect(first.dataset.tooltip).toBe(
      "Design review with a deliberately long label: D1 – D2, 24 hours, Design",
    );
    first.focus();
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-heading").textContent).toContain(
      "Design review",
    );
    expect(
      [
        ...tooltipFor(chart).querySelectorAll(".charts2-tooltip-row span"),
      ].map((node) => node.textContent),
    ).toEqual([
      "D1 – D2",
    ]);
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-row strong").textContent).toBe("24 hours");
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

    expect(
      chart.update({
        tasks: [
          { label: "Task 1", start: "2026-10-01T08:00:00Z", end: "2026-10-01T12:00:00Z" },
        ],
      }),
    ).toBe(chart);
    expect(chart.element.querySelector(".charts2-timesheet-task-label").textContent).toBe("Task 1");
    expect(chart.element.querySelector(".charts2-timesheet-hit").dataset.tooltip).toContain("4 hours");

    const square = TimesheetChart.make("#chart")
      .radius(0)
      .task({ label: "Task 1", start: "2026-10-01T08:00:00Z", end: "2026-10-01T12:00:00Z" })
      .render();
    expect(square.element.querySelector(".charts2-timesheet-bar").getAttribute("rx")).toBe("0");
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
  it("adapts timesheet tick units and can hide all labels", () => {
    const ranges = [
      [
        new Date("2026-01-01T00:00:00Z"),
        new Date("2026-01-02T00:00:00Z"),
      ],
      [
        "2026-01-01",
        "2026-01-12",
      ],
      [
        "2026-01-01",
        "2027-01-01",
      ],
      [
        "2020-01-01",
        "2025-01-01",
      ],
      [
        "2000-01-01",
        "2020-01-01",
      ],
    ];
    for (const [
      index,
      [
        start,
        end,
      ],
    ] of ranges.entries()) {
      const chart = TimesheetChart.make("#chart")
        .width(240)
        .valueLabels(index !== 4)
        .task({ label: `Task ${index + 1}`, start, end })
        .render();
      expect(chart.element.querySelectorAll(".charts2-timesheet-bar")).toHaveLength(1);
      if (index === 4) {
        expect(chart.element.querySelector(".charts2-timesheet-tick")).toBeNull();
        expect(chart.element.querySelector(".charts2-timesheet-task-label")).toBeNull();
      }

      if (index !== 4) {
        expect(chart.element.querySelector(".charts2-timesheet-tick")).not.toBeNull();
      }
      expect(chart.element.querySelector(".charts2-timesheet-hit").dataset.tooltip).toMatch(
        index === 0 ? /1 day/ : /days|year/,
      );
      chart.destroy();
    }

    const hours = TimesheetChart.make("#chart")
      .task({ label: "Task", start: "2026-01-01T08:00:00Z", end: "2026-01-01T12:00:00Z" })
      .render();
    expect(hours.element.querySelector(".charts2-timesheet-hit").dataset.tooltip).toContain("4 hours");

    const bare = TimesheetChart.make("#chart")
      .width(240)
      .axes(false)
      .grid(false)
      .valueLabels(false)
      .task({ label: "Task", start: "2026-01-01", end: "2026-01-02" })
      .render();
    expect(bare.element.querySelector(".charts2-grid")).toBeNull();
    expect(bare.element.querySelector(".charts2-axis")).toBeNull();
    expect(bare.element.querySelector("text")).toBeNull();
    expect(bare.element.querySelector(".charts2-timesheet-hit").getAttribute("x")).toBe("0");
  });
});
