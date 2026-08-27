import { labelElement, markMetadata, svg, titled } from "../support/Dom.js";

import TimesheetLayout from "./TimesheetLayout.js";

/**
 * Renders tasks against a shared temporal axis.
 */
export default class TimesheetRenderer {
  #chart;
  #surface;

  /**
   * Captures the chart snapshot and its owned SVG surface.
   *
   * @param {object} rendering - Collaborators for one timesheet pass.
   * @param {object} rendering.chart - Frozen timesheet data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Renders time-bounded tasks as grouped rows on a shared temporal axis.
   *
   * @returns {void} Axis ticks, row labels, and interactive task bars are appended.
   */
  render() {
    const layout = new TimesheetLayout(this.#chart);
    this.#renderTicks(layout);
    this.#renderTasks(this.#chart.timesheet.tasks, layout);
    if (this.#chart.options.showAxes) {
      const { bottom, left, right } = layout.frame;
      this.#surface.append("line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        class: "charts2-axis charts2-x-axis",
        "aria-hidden": "true",
      });
    }
  }

  /**
   * Renders temporal grid lines and their bounded labels.
   *
   * @param {TimesheetLayout} layout - Resolved temporal scale and viewport geometry.
   * @returns {void} Tick lines and labels are appended to the chart SVG.
   */
  #renderTicks(layout) {
    const { bottom, height, top } = layout.frame;
    for (const [index, value] of layout.ticks.entries()) {
      const tick = layout.tickAt(value, index);
      if (this.#chart.options.showGrid) {
        this.#surface.append("line", {
          x1: tick.position,
          y1: top,
          x2: tick.position,
          y2: bottom,
          class: "charts2-grid charts2-grid-vertical",
          "aria-hidden": "true",
        });
      }
      if (this.#chart.options.showLabels) {
        this.#surface.append(
          labelElement({
            value: tick.label,
            attributes: {
              x: tick.labelX,
              y: height - 8,
              "text-anchor": tick.anchor,
              class: "charts2-label charts2-timesheet-tick",
            },
            maxWidth: tick.maxWidth,
          }),
        );
      }
    }
  }

  /**
   * Renders task rows, labels, bars, and full-row interaction targets.
   *
   * @param {Array<object>} tasks - Ordered normalized task records.
   * @param {TimesheetLayout} layout - Resolved temporal and row geometry.
   * @returns {void} Task rows are appended to the chart SVG.
   */
  #renderTasks(tasks, layout) {
    const { barHeight, inset, labelWidth, left, plotWidth, right, rowHeight } = layout.frame;
    for (const [index, task] of tasks.entries()) {
      const row = layout.taskAt(task, index);
      if (this.#chart.options.showGrid && index > 0) {
        this.#surface.append("line", {
          x1: inset,
          y1: row.rowTop,
          x2: right,
          y2: row.rowTop,
          class: "charts2-grid charts2-grid-horizontal",
          "aria-hidden": "true",
        });
      }
      if (this.#chart.options.showLabels) {
        this.#surface.append(
          labelElement({
            value: task.label,
            attributes: {
              x: left - 8,
              y: row.centerY + 4,
              "text-anchor": "end",
              class: "charts2-label charts2-timesheet-task-label",
            },
            maxWidth: labelWidth - 8,
          }),
        );
      }
      this.#surface.append("rect", {
        x: row.barX,
        y: row.centerY - barHeight / 2,
        width: row.barWidth,
        height: barHeight,
        rx: row.radius,
        fill: task.color,
        class: "charts2-timesheet-bar charts2-visual-mark",
        "aria-hidden": "true",
      });
      const hit = markMetadata(
        svg("rect", {
          x: left,
          y: row.rowTop,
          width: plotWidth,
          height: rowHeight,
          fill: "transparent",
          class: "charts2-x-hit charts2-timesheet-hit charts2-mark",
          style: `color:${task.color}`,
        }),
        0,
        index,
      );
      hit.dataset.tooltipHeading = task.label;
      hit.dataset.tooltipItems = JSON.stringify([
        {
          name: `${row.dateStart} – ${row.dateEnd}`,
          value: row.duration,
          color: task.color,
        },
      ]);
      hit.dataset.tooltipAnchorX = String(row.barX + row.barWidth / 2);
      hit.dataset.tooltipAnchorY = String(row.centerY - barHeight / 2);
      const group = task.group ? `, ${task.group}` : "";
      this.#surface.append(titled(hit, `${task.label}: ${row.dateStart} – ${row.dateEnd}, ${row.duration}${group}`));
    }
  }
}
