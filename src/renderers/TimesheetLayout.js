import { DEFAULT_BAR_RADIUS } from "../support/Constants.js";
import { measuredTextWidth } from "../support/Dom.js";
import { scale } from "../support/Math.js";
import { formatTimeTick, formatTimesheetDate, formatTimesheetDuration, timeTicks } from "../support/Time.js";

const FRAME_INSET = 16;
const FRAME_TOP = 12;
const AXIS_HEIGHT = 28;
const MINIMUM_LABEL_WIDTH = 52;
const MAXIMUM_LABEL_WIDTH = 160;
const LABEL_WIDTH_RATIO = 0.36;
const LABEL_PADDING = 12;
const MINIMUM_PLOT_WIDTH = 20;
const MINIMUM_BAR_HEIGHT = 8;
const MAXIMUM_BAR_HEIGHT = 18;
const BAR_HEIGHT_RATIO = 0.5;
const MAXIMUM_TICKS = 7;
const PIXELS_PER_TICK = 68;
const MINIMUM_TICK_LABEL_WIDTH = 32;
const TICK_LABEL_GAP = 4;

/**
 * Calculates the maximum width available to task labels.
 *
 * @param {number} width - Requested chart width.
 * @returns {number} Bounded task-label width.
 */
function availableTaskLabelWidth(width) {
  return Math.max(MINIMUM_LABEL_WIDTH, Math.min(MAXIMUM_LABEL_WIDTH, width * LABEL_WIDTH_RATIO));
}

/**
 * Measures the widest normalized task label with its trailing padding.
 *
 * @param {Array<object>} tasks - Normalized timesheet tasks.
 * @returns {number} Required label-column width.
 */
function measuredTaskLabelWidth(tasks) {
  return Math.ceil(Math.max(...tasks.map((task) => measuredTextWidth(task.label))) + LABEL_PADDING);
}

/**
 * Calculates vertical timesheet bounds shared by every row.
 *
 * @param {object} chart - Frozen timesheet data and options.
 * @param {number} height - Requested chart height.
 * @returns {object} Bottom edge and row height.
 */
function timesheetVerticalFrame(chart, height) {
  return {
    bottom: height - AXIS_HEIGHT,
    rowHeight: (height - AXIS_HEIGHT - FRAME_TOP) / chart.timesheet.tasks.length,
  };
}

/**
 * Names the complete drawing and tooltip placement of one timesheet task.
 */
class TimesheetTaskPlacement {
  /**
   * Combines row, bar, and formatted temporal values.
   *
   * @param {object} row - Row top and vertical center.
   * @param {object} bar - Bar x position, width, and corner radius.
   * @param {object} text - Formatted start, end, and duration values.
   */
  constructor(row, bar, text) {
    this.rowTop = row.top;
    this.centerY = row.center;
    this.barX = bar.x;
    this.barWidth = bar.width;
    this.radius = bar.radius;
    this.dateStart = text.start;
    this.dateEnd = text.end;
    this.duration = text.duration;
  }
}

/**
 * Measures the optional task-label column.
 *
 * @param {object} chart - Frozen timesheet data and options.
 * @returns {number} Width reserved for task labels.
 */
function taskLabelWidth(chart) {
  if (!chart.options.valueLabels) {
    return 0;
  }

  const available = availableTaskLabelWidth(chart.options.width);
  const measured = measuredTaskLabelWidth(chart.timesheet.tasks);

  return Math.min(available, Math.max(MINIMUM_LABEL_WIDTH, measured));
}

/**
 * Resolves the frame and scalar endpoints shared by the layout.
 *
 * @param {object} chart - Frozen timesheet data and options.
 * @returns {object} Frame, timestamps, and tick budget.
 */
function timesheetGeometry(chart) {
  const { height, width } = chart.options;
  const labelWidth = taskLabelWidth(chart);

  const horizontal = {
    left: FRAME_INSET + labelWidth,
    right: Math.max(FRAME_INSET + labelWidth + MINIMUM_PLOT_WIDTH, width - FRAME_INSET),
  };

  const vertical = timesheetVerticalFrame(chart, height);
  const plotWidth = horizontal.right - horizontal.left;
  const values = { start: chart.timesheet.start.valueOf(), end: chart.timesheet.end.valueOf() };
  const maximumTicks = Math.max(2, Math.min(MAXIMUM_TICKS, Math.floor(plotWidth / PIXELS_PER_TICK) + 1));

  const frame = Object.freeze({
    width,
    height,
    inset: FRAME_INSET,
    top: FRAME_TOP,
    ...horizontal,
    ...vertical,
    plotWidth,
    barHeight: Math.max(
      MINIMUM_BAR_HEIGHT,
      Math.min(MAXIMUM_BAR_HEIGHT, vertical.rowHeight * BAR_HEIGHT_RATIO),
    ),
    labelWidth,
    span: values.end - values.start,
  });

  return { frame, values, maximumTicks };
}

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
    const geometry = timesheetGeometry(chart);

    this.#options = chart.options;
    this.#x = (value) =>
      scale(value, [geometry.values.start, geometry.values.end], [geometry.frame.left, geometry.frame.right]);
    this.#dateFormatter = chart.options.tooltipFormatDate ?? chart.options.formatDate;
    this.#tickFormatter = chart.options.formatTick ?? chart.options.formatDate;
    this.#durationFormatter = chart.options.tooltipFormatDuration ?? chart.options.formatDuration;
    this.ticks = Object.freeze(timeTicks(geometry.values.start, geometry.values.end, geometry.maximumTicks));
    this.frame = geometry.frame;
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
    }

    if (isLast) {
      labelX -= 2;
      anchor = "end";
    }

    return {
      position,
      label: formatTimeTick(tick, this.frame.span, this.#tickFormatter),
      labelX,
      anchor,
      maxWidth: Math.max(
        MINIMUM_TICK_LABEL_WIDTH,
        this.frame.plotWidth / Math.max(1, this.ticks.length - 1) - TICK_LABEL_GAP,
      ),
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

    const radius = Math.min(
      this.#options.radius ?? DEFAULT_BAR_RADIUS,
      barWidth / 2,
      this.frame.barHeight / 2,
    );

    return new TimesheetTaskPlacement(
      { top: rowTop, center: centerY },
      { x: barX, width: barWidth, radius },
      { start: dateStart, end: dateEnd, duration },
    );
  }
}
