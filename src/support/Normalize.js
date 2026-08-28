import { ChartType, DEFAULT_COLORS } from "./Constants.js";

const DEFAULT_POINT_RADIUS = 5;
const ISO_DATE_LENGTH = 10;
const MILLISECONDS_PER_SECOND = 1000;
const UNIX_SECONDS_THRESHOLD = 100_000;

/**
 * Verifies that a value is safe to use in geometry calculations.
 *
 * @param {unknown} value - Candidate numeric value from caller-controlled chart data.
 * @param {string} name - Human-readable field name included in validation errors.
 * @returns {number} Validated finite number.
 * @throws {TypeError} When the candidate is not a finite number.
 */
function requireFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }

  return value;
}

/**
 * Converts a scalar or coordinate object into the chart's canonical point shape.
 *
 * @param {number | {x?: number, y: number, r?: number}} point - Source point supplied by a dataset.
 * @param {number} index - Zero-based position used as the default x coordinate.
 * @returns {{x: number, y: number, r?: number}} Normalized point with validated numeric coordinates.
 * @throws {TypeError} When the point shape or one of its numeric fields is invalid.
 */
function normalizePoint(point, index) {
  if (typeof point === "number") {
    return { x: index, y: requireFiniteNumber(point, "Point") };
  }

  if (!point || typeof point !== "object") {
    throw new TypeError("Each point must be a number or an object");
  }

  return {
    x: requireFiniteNumber(point.x ?? index, "Point x"),
    y: requireFiniteNumber(point.y, "Point y"),
    r: requireFiniteNumber(point.r ?? DEFAULT_POINT_RADIUS, "Point radius"),
  };
}

/**
 * Normalizes series names, colors, chart overrides, and values for rendering.
 *
 * @param {{datasets?: Array<object>}} data - Dataset container from chart options.
 * @returns {Array<object>} Non-empty collection of canonical datasets and points.
 * @throws {TypeError} When datasets or their values are missing or malformed.
 */
function normalizeDatasets(data) {
  if (!data || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    throw new TypeError("Chart data requires at least one dataset");
  }

  return data.datasets.map((dataset, datasetIndex) => {
    if (!dataset || !Array.isArray(dataset.values) || dataset.values.length === 0) {
      throw new TypeError("Each dataset requires a non-empty values array");
    }

    return {
      name: dataset.name ?? `Series ${datasetIndex + 1}`,
      color: dataset.color ?? DEFAULT_COLORS[datasetIndex % DEFAULT_COLORS.length],
      chartType: dataset.chartType ?? dataset.type,
      points: dataset.values.map((point, pointIndex) => normalizePoint(point, pointIndex)),
    };
  });
}

/**
 * Converts keyed heatmap values into sorted, date-addressable entries.
 *
 * @param {{start?: string | Date, end?: string | Date, dataPoints?: Record<string, number>}} [data={}] - Heatmap dates and values.
 * @returns {Array<{date: Date, key: string, value: number}>} Chronologically sorted daily entries.
 * @throws {TypeError} When bounds, dates, or values are invalid.
 */
function normalizeHeatmapData(data = {}) {
  if (data.start && data.end && new Date(data.start) > new Date(data.end)) {
    throw new TypeError("Heatmap start date cannot be after end date");
  }

  const entries = Object.entries(data.dataPoints ?? {}).map(([key, value]) => {
    requireFiniteNumber(value, "Heatmap value");
    const date = heatmapDate(key);

    if (Number.isNaN(date.valueOf())) {
      throw new TypeError(`Invalid heatmap date: ${key}`);
    }

    return { date, key: date.toISOString().slice(0, ISO_DATE_LENGTH), value };
  });

  return entries.toSorted((left, right) => left.date - right.date);
}

/**
 * Interprets a heatmap key as Unix seconds or an ISO calendar date.
 *
 * @param {string} key - Caller-supplied heatmap date key.
 * @returns {Date} Candidate date for subsequent validity checking.
 */
function heatmapDate(key) {
  const numeric = Number(key);

  if (Number.isFinite(numeric) && numeric > UNIX_SECONDS_THRESHOLD) {
    return new Date(numeric * MILLISECONDS_PER_SECOND);
  }

  return new Date(`${key}T00:00:00Z`);
}

/**
 * Creates an independent valid Date from a supported date-like value.
 *
 * @param {string | number | Date} value - Date-like value accepted by the platform Date constructor.
 * @param {string} name - Human-readable field name included in validation errors.
 * @returns {Date} Defensive Date instance with a valid timestamp.
 * @throws {TypeError} When the value cannot be interpreted as a date.
 */
function normalizeDate(value, name) {
  const date = value instanceof Date ? new Date(value.valueOf()) : new Date(value);

  if (Number.isNaN(date.valueOf())) {
    throw new TypeError(`${name} must be a valid date`);
  }

  return date;
}

/**
 * Validates timesheet tasks and derives an enclosing time range when omitted.
 *
 * @param {{start?: string | number | Date, end?: string | number | Date, tasks?: Array<object>}} [data={}] - Timesheet bounds and task records.
 * @returns {{start: Date, end: Date, tasks: Array<object>}} Canonical task collection enclosed by validated bounds.
 * @throws {TypeError} When tasks, dates, durations, or explicit bounds are invalid.
 */
function normalizeTimesheetData(data = {}) {
  if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
    throw new TypeError("Timesheet data requires a non-empty tasks array");
  }

  const tasks = data.tasks.map((task, index) => {
    if (!task || typeof task !== "object") {
      throw new TypeError("Each timesheet task must be an object");
    }

    const start = normalizeDate(task.start, `Task ${index + 1} start`);
    const end = normalizeDate(task.end, `Task ${index + 1} end`);

    if (end <= start) {
      throw new TypeError("Timesheet task end must be after start");
    }

    return {
      label: String(task.label ?? `Task ${index + 1}`),
      start,
      end,
      group: task.group === undefined ? undefined : String(task.group),
      color: task.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
  });

  const taskStart = new Date(Math.min(...tasks.map((task) => task.start.valueOf())));
  const taskEnd = new Date(Math.max(...tasks.map((task) => task.end.valueOf())));
  const start = data.start === undefined ? taskStart : normalizeDate(data.start, "Timesheet start");
  const end = data.end === undefined ? taskEnd : normalizeDate(data.end, "Timesheet end");

  if (end <= start) {
    throw new TypeError("Timesheet end must be after start");
  }

  if (start > taskStart || end < taskEnd) {
    throw new TypeError("Timesheet bounds must contain every task");
  }

  return { start, end, tasks };
}

/**
 * Applies invariants that depend on the selected chart renderer.
 *
 * @param {string} type - Canonical chart type selected for rendering.
 * @param {Array<{points: Array<{r?: number}>}>} datasets - Normalized datasets to validate.
 * @param {unknown} labels - Candidate category labels supplied with the data.
 * @returns {void} This function returns after all renderer-specific invariants pass.
 * @throws {TypeError} When labels or chart-specific dataset constraints are invalid.
 */
function validateChartData(type, datasets, labels) {
  if (!Array.isArray(labels)) {
    throw new TypeError("Chart labels must be an array");
  }

  if (type === ChartType.RADAR && datasets.some((dataset) => dataset.points.length !== datasets[0].points.length)) {
    throw new TypeError("Radar datasets must have equal lengths");
  }

  if (type === ChartType.POLAR_AREA && datasets.length !== 1) {
    throw new TypeError(`${type} requires exactly one dataset`);
  }

  if (type === ChartType.BUBBLE && datasets.some((dataset) => dataset.points.some((point) => point.r < 0))) {
    throw new TypeError("Bubble radii cannot be negative");
  }
}

export {
  requireFiniteNumber,
  normalizePoint,
  normalizeDatasets,
  normalizeHeatmapData,
  normalizeDate,
  normalizeTimesheetData,
  validateChartData,
};
