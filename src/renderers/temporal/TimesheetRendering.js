import { labelElement } from "../../support/presentation/TextLayout.js";

import TimesheetLayout from "./TimesheetLayout.js";

const AXIS_LABEL_OFFSET = 8;
const TASK_LABEL_BASELINE_OFFSET = 4;
const TASK_LABEL_GAP = 8;

/**
 * Renders tasks against a shared temporal axis.
 */
class TimesheetRenderer {
  #chart;
  #surface;

  /**
   * Captures the chart snapshot and its owned SVG surface.
   *
   * @param {object} rendering - Collaborators for one timesheet pass.
   * @param {object} rendering.chart - Frozen timesheet data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
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
    if (this.#chart.options.axes) {
      const { bottom, left, right } = layout.frame;
      this.#surface.append("line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        class: "orchid-charts-axis orchid-charts-x-axis",
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

    for (const [
      index,
      value,
    ] of layout.ticks.entries()) {
      const tick = layout.tickAt(value, index);

      if (this.#chart.options.grid) {
        this.#surface.append("line", {
          x1: tick.position,
          y1: top,
          x2: tick.position,
          y2: bottom,
          class: "orchid-charts-grid orchid-charts-grid-vertical",
          "aria-hidden": "true",
        });
      }

      if (this.#chart.options.valueLabels) {
        this.#surface.append(
          labelElement({
            value: tick.label,
            attributes: {
              x: tick.labelX,
              y: height - AXIS_LABEL_OFFSET,
              "text-anchor": tick.anchor,
              class: "orchid-charts-label orchid-charts-timesheet-tick",
            },
            measurement: { maxWidth: tick.maxWidth },
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
    for (const [
      index,
      task,
    ] of tasks.entries()) {
      this.#renderTask(task, index, layout);
    }
  }

  /**
   * Renders one complete task row.
   *
   * @param {object} task - Normalized task record.
   * @param {number} index - Zero-based row position.
   * @param {TimesheetLayout} layout - Resolved temporal and row geometry.
   * @returns {void} Row visuals and interaction target are appended.
   */
  #renderTask(task, index, layout) {
    const row = layout.taskAt(task, index);

    this.#renderRowGrid(row, index, layout.frame);
    this.#renderTaskLabel(task, row, layout.frame);
    const visualElement = this.#renderTaskBar(task, row, layout.frame.barHeight);

    const state = { task, row, index, frame: layout.frame, visualElement };
    this.#taskHit(state);
  }

  /**
   * Draws the separator above a non-first task row when grid lines are enabled.
   *
   * @param {object} row - Resolved row geometry.
   * @param {number} index - Zero-based task position.
   * @param {object} frame - Shared timesheet frame.
   * @returns {void} An optional horizontal line is appended.
   */
  #renderRowGrid(row, index, frame) {
    if (!this.#chart.options.grid || index === 0) {
      return;
    }

    this.#surface.append("line", {
      x1: frame.inset,
      y1: row.rowTop,
      x2: frame.right,
      y2: row.rowTop,
      class: "orchid-charts-grid orchid-charts-grid-horizontal",
      "aria-hidden": "true",
    });
  }

  /**
   * Draws the optional task label beside its row.
   *
   * @param {object} task - Normalized task record.
   * @param {object} row - Resolved row geometry.
   * @param {object} frame - Shared timesheet frame.
   * @returns {void} A bounded label is appended when enabled.
   */
  #renderTaskLabel(task, row, frame) {
    if (!this.#chart.options.valueLabels) {
      return;
    }

    this.#surface.append(
      labelElement({
        value: task.label,
        attributes: {
          x: frame.left - TASK_LABEL_GAP,
          y: row.centerY + TASK_LABEL_BASELINE_OFFSET,
          "text-anchor": "end",
          class: "orchid-charts-label orchid-charts-timesheet-task-label",
        },
        measurement: { maxWidth: frame.labelWidth - TASK_LABEL_GAP },
      }),
    );
  }

  /**
   * Draws the visible duration bar for one task.
   *
   * @param {object} task - Normalized task record.
   * @param {object} row - Resolved row geometry.
   * @param {number} barHeight - Shared visible bar height.
   * @returns {void} One decorative bar is appended.
   */
  #renderTaskBar(task, row, barHeight) {
    return this.#surface.append("rect", {
      x: row.barX,
      y: row.centerY - barHeight / 2,
      width: row.barWidth,
      height: barHeight,
      rx: row.radius,
      fill: task.color,
      class: "orchid-charts-timesheet-bar orchid-charts-visual-mark",
      "aria-hidden": "true",
    });
  }

  /**
   * Builds the full-row interaction target and tooltip metadata.
   *
   * @param {object} state - Task, row, index, and shared frame.
   * @returns {void} Appends the interactive row with its visual peer.
   */
  #taskHit(state) {
    const { task, row, index, frame, visualElement } = state;
    const group = task.group ? `, ${task.group}` : "";
    this.#surface.mark(
      "rect",
      {
        x: frame.left,
        y: row.rowTop,
        width: frame.plotWidth,
        height: frame.rowHeight,
        fill: "transparent",
        class: "orchid-charts-x-hit orchid-charts-timesheet-hit orchid-charts-mark",
        style: `color:${task.color}`,
      },
      {
        kind: "task",
        dataset: 0,
        point: index,
        visualElement,
        title: `${task.label}: ${row.dateStart} – ${row.dateEnd}, ${row.duration}${group}`,
        tooltip: {
          heading: task.label,
          items: [
            { name: `${row.dateStart} – ${row.dateEnd}`, value: row.duration, color: task.color },
          ],
        },
        anchor: { x: row.barX + row.barWidth / 2, y: row.centerY - frame.barHeight / 2 },
      },
    );
  }
}

/**
 * Renders one timesheet through its family renderer.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Timesheet content is appended to the chart SVG.
 */
function renderTimesheetChart(rendering) {
  new TimesheetRenderer(rendering).render();
}

export { renderTimesheetChart };
