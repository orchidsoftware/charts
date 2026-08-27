import { DEFAULT_BAR_RADIUS } from "../support/Constants.js";
import { measuredTextWidth } from "../support/Dom.js";
import { scale } from "../support/Math.js";
import { formatTimeTick, formatTimesheetDate, formatTimesheetDuration, timeTicks } from "../support/Time.js";

/**
 * Owns temporal scaling, row geometry, and bounded label placement for a timesheet.
 */
export default class TimesheetLayout {
  #dateFormatter;
  #durationFormatter;
  #options;
  #tickFormatter;
  #x;

  /**
   * Resolves the complete immutable time-range layout for one render.
   *
   * @param {object} chart - Frozen timesheet data and options.
   */
  constructor(chart) {
    const { height, width } = chart.options;
    const { end, start, tasks } = chart.timesheet;
    const inset = 16;
    const top = 12;
    const axisHeight = 28;
    const availableLabelWidth = Math.max(52, Math.min(160, width * 0.36));
    const labelWidth = chart.options.showLabels
      ? Math.min(
          availableLabelWidth,
          Math.max(52, Math.ceil(Math.max(...tasks.map((task) => measuredTextWidth(task.label))) + 12)),
        )
      : 0;
    const left = inset + labelWidth;
    const right = Math.max(left + 20, width - inset);
    const plotWidth = right - left;
    const bottom = height - axisHeight;
    const rowHeight = (bottom - top) / tasks.length;
    const barHeight = Math.max(8, Math.min(18, rowHeight * 0.5));
    const startValue = start.valueOf();
    const endValue = end.valueOf();
    const span = endValue - startValue;
    const maximumTicks = Math.max(2, Math.min(7, Math.floor(plotWidth / 68) + 1));

    this.#options = chart.options;
    this.#x = (value) => scale(value, [startValue, endValue], [left, right]);
    this.#dateFormatter = chart.options.timesheetOptions?.formatDate;
    this.#tickFormatter = chart.options.timesheetOptions?.formatTick ?? this.#dateFormatter;
    this.#durationFormatter = chart.options.timesheetOptions?.formatDuration;
    this.ticks = Object.freeze(timeTicks(startValue, endValue, maximumTicks));
    this.frame = Object.freeze({
      width,
      height,
      inset,
      top,
      right,
      bottom,
      left,
      plotWidth,
      rowHeight,
      barHeight,
      labelWidth,
      span,
    });
    Object.freeze(this);
  }

  /**
   * Presents one temporal tick with bounded label placement.
   *
   * @param {number} tick - Tick timestamp in milliseconds.
   * @param {number} index - Position within the visible tick collection.
   * @returns {{position: number, label: string, labelX: number, anchor: string, maxWidth: number}} Tick drawing values.
   */
  tickAt(tick, index) {
    const position = this.#x(tick);
    const isFirst = index === 0;
    const isLast = index === this.ticks.length - 1;
    let labelX = position;
    let anchor = "middle";
    if (isFirst) {
      labelX += 2;
      anchor = "start";
    } else if (isLast) {
      labelX -= 2;
      anchor = "end";
    }
    return {
      position,
      label: formatTimeTick(tick, this.frame.span, this.#tickFormatter),
      labelX,
      anchor,
      maxWidth: Math.max(32, this.frame.plotWidth / Math.max(1, this.ticks.length - 1) - 4),
    };
  }

  /**
   * Presents one normalized task as row, bar, label, and tooltip geometry.
   *
   * @param {object} task - Normalized task record.
   * @param {number} index - Zero-based row position.
   * @returns {object} Complete task drawing and accessible presentation values.
   */
  taskAt(task, index) {
    const rowTop = this.frame.top + this.frame.rowHeight * index;
    const centerY = rowTop + this.frame.rowHeight / 2;
    const barX = this.#x(task.start.valueOf());
    const barWidth = Math.max(2, this.#x(task.end.valueOf()) - barX);
    const dateStart = formatTimesheetDate(task.start, this.#dateFormatter);
    const dateEnd = formatTimesheetDate(task.end, this.#dateFormatter);
    const duration = formatTimesheetDuration(task.end - task.start, this.#durationFormatter);
    return {
      rowTop,
      centerY,
      barX,
      barWidth,
      radius: Math.min(
        this.#options.timesheetOptions?.radius ?? DEFAULT_BAR_RADIUS,
        barWidth / 2,
        this.frame.barHeight / 2,
      ),
      dateStart,
      dateEnd,
      duration,
    };
  }
}
