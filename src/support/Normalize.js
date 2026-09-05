import { AGGREGATION_TYPES, ChartType, DEFAULT_COLORS } from "./Constants.js";
import {
  isBoolean,
  isChoice,
  isNonEmptyText,
  isNumberAtLeast,
  isOpacity,
  isRecord,
  unknownKey,
} from "./Validation.js";

const DEFAULT_POINT_RADIUS = 5;
const ISO_DATE_LENGTH = 10;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_DAY = 86_400_000;
const UNIX_SECONDS_THRESHOLD = 100_000;
const YEAR_LENGTH = 4;
const YEAR_MONTH_LENGTH = 7;

const DATE_SEPARATOR_INDICES = new Set([
  YEAR_LENGTH,
  YEAR_MONTH_LENGTH,
]);

const TIMEZONE_OFFSET_LENGTH = 6;
const TIMEZONE_HOUR_END = 3;
const TIMEZONE_MINUTE_START = 4;

const DATASET_BASE_KEYS = [
  "name",
  "values",
  "color",
  "opacity",
  "formatValue",
];

const DATASET_LINE_KEYS = [
  ...DATASET_BASE_KEYS,
  "gradient",
  "smooth",
  "dots",
  "dotSize",
  "line",
  "area",
  "strokeWidth",
];

const DATASET_BAR_KEYS = [
  ...DATASET_BASE_KEYS,
  "radius",
];

const CARTESIAN_SERIES_TYPES = new Set([
  ChartType.LINE,
  ChartType.BAR,
  ChartType.SCATTER,
  ChartType.AXIS_MIXED,
  ChartType.BUBBLE,
]);

/**
 * Creates one normalized series while retaining local presentation.
 *
 * @param {object} dataset - Raw dataset input.
 * @param {number} datasetIndex - Stable palette position.
 * @returns {object} Immutable-shape renderer record.
 */
function normalizedDataset(dataset, datasetIndex) {
  return Object.freeze({
    name: dataset.name ?? `Series ${datasetIndex + 1}`,
    identityName: dataset.name,
    color: dataset.color,
    chartType: dataset.chartType ?? dataset.type,
    opacity: dataset.opacity,
    formatValue: dataset.formatValue,
    gradient: dataset.gradient,
    smooth: dataset.smooth,
    dots: dataset.dots,
    dotSize: dataset.dotSize,
    line: dataset.line,
    area: dataset.area,
    strokeWidth: dataset.strokeWidth,
    radius: dataset.radius,
    points: dataset.values.map((point, pointIndex) => normalizePoint(point, pointIndex)),
  });
}

/**
 * Assigns one encounter-ordered palette stream across grouped and ungrouped tasks.
 */
class TimesheetPalette {
  #colors;
  #groups = new Map();
  #next = 0;

  /**
   * Captures the effective chart palette.
   *
   * @param {readonly string[]} colors - Cyclic categorical colors.
   */
  constructor(colors) {
    this.#colors = colors;
  }

  /**
   * Resolves an explicit task color or its stable categorical color.
   *
   * @param {object} task - Validated task input.
   * @returns {string} Effective task color.
   */
  colorFor(task) {
    const index = this.#indexFor(task.group);

    return task.color ?? this.#colors[index % this.#colors.length];
  }

  /**
   * Resolves and advances the palette key stream.
   *
   * @param {string | undefined} group - Optional stable group key.
   * @returns {number} Palette position.
   */
  #indexFor(group) {
    if (group && this.#groups.has(group)) {
      return this.#groups.get(group);
    }

    const index = this.#next;
    this.#next += 1;
    if (group) {
      this.#groups.set(group, index);
    }

    return index;
  }
}

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
    return {
      x: index,
      y: requireFiniteNumber(point, "Point"),
    };
  }

  if (!isRecord(point)) {
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
 * @param {readonly string[]} [colors=DEFAULT_COLORS] - Effective categorical palette.
 * @param {string} type - Immutable chart family.
 * @returns {Array<object>} Non-empty collection of canonical datasets and points.
 * @throws {TypeError} When datasets or their values are missing or malformed.
 */
function normalizeDatasets(data, colors = DEFAULT_COLORS, type) {
  if (!data || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    throw new TypeError("Chart data requires at least one dataset");
  }

  return data.datasets.map((dataset, datasetIndex) => {
    validateDatasetInput(dataset, type);
    if (!dataset || !Array.isArray(dataset.values) || dataset.values.length === 0) {
      throw new TypeError("Each dataset requires a non-empty array of values");
    }

    return normalizedDataset(
      { ...dataset, color: dataset.color ?? colors[datasetIndex % colors.length] },
      datasetIndex,
    );
  });
}

/**
 * Rejects unknown scene keys before any renderer-facing normalization occurs.
 *
 * @param {string} type - Immutable chart family.
 * @param {unknown} data - Candidate complete series scene.
 * @returns {void} Exhaustive public records pass unchanged.
 */
function validateSeriesScene(type, data) {
  if (!isRecord(data)) {
    throw new TypeError("Chart data must be an object");
  }

  const allowed = CARTESIAN_SERIES_TYPES.has(type)
    ? [
        "labels",
        "datasets",
        "markers",
        "regions",
      ]
    : [
        "labels",
        "datasets",
      ];

  validateObjectKeys(data, allowed, "chart data");
}

/**
 * Validates one dataset record using the exhaustive grammar for its family.
 *
 * @param {unknown} dataset - Candidate dataset object.
 * @param {string} type - Owning chart type.
 * @returns {void} Supported keys and independently decidable values pass.
 */
function validateDatasetInput(dataset, type) {
  if (!isRecord(dataset)) {
    throw new TypeError("Each dataset must be an object");
  }

  const subtype = type === ChartType.AXIS_MIXED ? dataset.chartType : type;

  if (
    type === ChartType.AXIS_MIXED &&
    !isChoice(subtype, [
      ChartType.LINE,
      ChartType.BAR,
      ChartType.SCATTER,
    ])
  ) {
    throw new TypeError("Mixed dataset chartType must be line, bar, or scatter");
  }

  const localKeys = datasetKeysFor(subtype);

  const allowed =
    type === ChartType.AXIS_MIXED
      ? [
          ...localKeys,
          "chartType",
        ]
      : localKeys;

  validateObjectKeys(dataset, allowed, "dataset");
  validateDatasetProperties(dataset, subtype);
}

/**
 * Selects exhaustive keys for one concrete dataset subtype.
 *
 * @param {string} type - Concrete dataset family.
 * @returns {string[]} Allowed dataset keys.
 */
function datasetKeysFor(type) {
  if (type === ChartType.LINE) {
    return DATASET_LINE_KEYS;
  }

  if (type === ChartType.BAR) {
    return DATASET_BAR_KEYS;
  }

  return DATASET_BASE_KEYS;
}

/**
 * Validates common and family-specific dataset properties.
 *
 * @param {object} dataset - Exhaustive dataset record.
 * @param {string} type - Concrete dataset family.
 * @returns {void} Presentation and point values satisfy public invariants.
 */
function validateDatasetProperties(dataset, type) {
  validateDatasetIdentity(dataset);
  validateDatasetPresentation(dataset);
  validateDatasetGradient(dataset.gradient);

  if (Array.isArray(dataset.values)) {
    for (const [
      index,
      value,
    ] of dataset.values.entries()) {
      validatePublicPoint(value, type, index);
    }
  }
}

/**
 * Validates optional dataset identity and formatter fields.
 *
 * @param {object} dataset - Candidate dataset input.
 * @returns {void} Identity fields are either absent or valid.
 */
function validateDatasetIdentity(dataset) {
  const hasName = dataset.name !== undefined;
  const isValidName = isNonEmptyText(dataset.name);

  if (hasName && !isValidName) {
    throw new TypeError("Dataset name must be a non-empty string");
  }

  if (dataset.formatValue !== undefined && typeof dataset.formatValue !== "function") {
    throw new TypeError("Dataset formatValue must be a function");
  }
}

/**
 * Validates optional dataset geometry and visibility fields.
 *
 * @param {object} dataset - Candidate dataset input.
 * @returns {void} Presentation fields are either absent or valid.
 */
function validateDatasetPresentation(dataset) {
  const hasOpacity = dataset.opacity !== undefined;
  const isValidOpacity = isOpacity(dataset.opacity);

  if (hasOpacity && !isValidOpacity) {
    throw new TypeError("Dataset opacity must be from 0 through 1");
  }

  for (const property of [
    "smooth",
    "dots",
    "line",
    "area",
  ]) {
    if (dataset[property] !== undefined && !isBoolean(dataset[property])) {
      throw new TypeError(`Dataset ${property} must be a boolean`);
    }
  }

  for (const property of [
    "dotSize",
    "strokeWidth",
    "radius",
  ]) {
    if (dataset[property] !== undefined && !isNumberAtLeast(dataset[property], 0)) {
      throw new TypeError(`Dataset ${property} must be a non-negative finite number`);
    }
  }
}

/**
 * Validates dataset-local gradient switches and endpoints.
 *
 * @param {unknown} gradient - Optional gradient configuration.
 * @returns {void} Supported gradient input passes unchanged.
 */
function validateDatasetGradient(gradient) {
  if (gradient === undefined || typeof gradient === "boolean") {
    return;
  }

  if (!isRecord(gradient)) {
    throw new TypeError("Dataset gradient must be a boolean or object");
  }

  validateObjectKeys(
    gradient,
    [
      "fromOpacity",
      "toOpacity",
    ],
    "gradient",
  );
  for (const value of Object.values(gradient)) {
    if (!isOpacity(value)) {
      throw new TypeError("Gradient opacity must be from 0 through 1");
    }
  }
}

/**
 * Rejects extra point keys and invalid family-specific coordinate values.
 *
 * @param {unknown} value - Candidate scalar or point.
 * @param {string} type - Concrete dataset type.
 * @param {number} index - Scalar scatter shorthand position.
 * @returns {void} Point input can be normalized without ambiguity.
 */
function validatePublicPoint(value, type, index) {
  if (type === ChartType.SCATTER && Number.isFinite(value)) {
    return;
  }

  const isPointSeries = isChoice(type, [
    ChartType.SCATTER,
    ChartType.BUBBLE,
  ]);

  if (!isPointSeries) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Dataset value ${index + 1} must be finite`);
    }

    return;
  }

  validateCoordinatePoint(value, type);
}

/**
 * Validates one explicit scatter or bubble coordinate object.
 *
 * @param {unknown} value - Candidate point object.
 * @param {string} type - Scatter or bubble family.
 * @returns {void} Exhaustive finite coordinates pass unchanged.
 */
function validateCoordinatePoint(value, type) {
  if (!isRecord(value)) {
    throw new TypeError(`${type} points must be objects with finite coordinates`);
  }

  const pointKeys =
    type === ChartType.BUBBLE
      ? [
          "x",
          "y",
          "r",
        ]
      : [
          "x",
          "y",
        ];

  validateObjectKeys(value, pointKeys, `${type} point`);
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    throw new TypeError(`${type} points must provide finite x and y`);
  }

  if (type === ChartType.BUBBLE && !isNumberAtLeast(value.r, 0)) {
    throw new TypeError("Bubble points must provide a finite non-negative r");
  }
}

/**
 * Converts keyed heatmap values into sorted, date-addressable entries.
 *
 * @param {{start?: string | Date, end?: string | Date, points?: Record<string, number>}} [data={}] - Heatmap dates and values.
 * @returns {Array<{date: Date, key: string, value: number}>} Chronologically sorted daily entries.
 * @throws {TypeError} When bounds, dates, or values are invalid.
 */
function normalizeHeatmapData(data = {}) {
  validateObjectKeys(
    data,
    [
      "start",
      "end",
      "points",
    ],
    "heatmap data",
  );
  const source = data.points;

  if (!isRecord(source) || Object.keys(source).length === 0) {
    throw new TypeError("Heatmap points must contain at least one entry");
  }

  const entries = normalizedHeatmapEntries(source);
  const range = heatmapRange(data, entries);

  return continuousHeatmapDays(entries, range);
}

/**
 * Converts raw heatmap entries into validated UTC day records.
 *
 * @param {Record<string, number>} source - Caller-supplied keyed values.
 * @returns {Array<object>} Chronologically sorted day records.
 */
function normalizedHeatmapEntries(source) {
  return Object.entries(source)
    .map(
      ([
        key,
        value,
      ]) => {
        requireFiniteNumber(value, "Heatmap value");
        const date = heatmapDate(key);

        if (Number.isNaN(date.valueOf())) {
          throw new TypeError(`Invalid heatmap date: ${key}`);
        }

        return {
          date,
          key: date.toISOString().slice(0, ISO_DATE_LENGTH),
          value,
        };
      },
    )
    .toSorted((left, right) => left.date - right.date);
}

/**
 * Fills every missing UTC day in a validated heatmap range with zero.
 *
 * @param {Array<object>} entries - Sorted explicit values.
 * @param {{start: Date, end: Date}} range - Inclusive calendar bounds.
 * @returns {Array<object>} Continuous daily records.
 */
function continuousHeatmapDays(entries, range) {
  const values = new Map(
    entries.map((entry) => [
      entry.key,
      entry.value,
    ]),
  );

  const days = [];

  for (
    let timestamp = range.start.valueOf();
    timestamp <= range.end.valueOf();
    timestamp += MILLISECONDS_PER_DAY
  ) {
    const date = new Date(timestamp);
    const key = date.toISOString().slice(0, ISO_DATE_LENGTH);

    days.push({
      date,
      key,
      value: values.get(key) ?? 0,
    });
  }

  return days;
}

/**
 * Validates an optional explicit heatmap range against normalized UTC days.
 *
 * @param {object} data - Heatmap data containing optional bounds.
 * @param {Array<object>} entries - Sorted normalized point entries.
 * @returns {void} Ascending containing ranges pass unchanged.
 */
function heatmapRange(data, entries) {
  if (data.start === undefined && data.end === undefined) {
    return {
      start: entries[0].date,
      end: entries.at(-1).date,
    };
  }

  if (data.start === undefined || data.end === undefined) {
    throw new TypeError("Heatmap range requires both start and end");
  }

  const start = heatmapBound(data.start, "Heatmap range start");
  const end = heatmapBound(data.end, "Heatmap range end");

  if (start > end) {
    throw new TypeError("Heatmap range end cannot precede start");
  }

  if (entries[0].date < start || entries.at(-1).date > end) {
    throw new TypeError("Heatmap range must contain every point");
  }

  return {
    start,
    end,
  };
}

/**
 * Converts a heatmap range bound to its UTC calendar day.
 *
 * @param {unknown} value - Date or transitional date-only string.
 * @param {string} name - Public concept named in failures.
 * @returns {Date} Midnight UTC calendar bound.
 */
function heatmapBound(value, name) {
  const date = normalizeDate(value, name);

  return new Date(`${date.toISOString().slice(0, ISO_DATE_LENGTH)}T00:00:00Z`);
}

/**
 * Interprets a heatmap key as Unix seconds or an ISO calendar date.
 *
 * @param {string} key - Caller-supplied heatmap date key.
 * @returns {Date} Candidate date for subsequent validity checking.
 */
function heatmapDate(key) {
  if (isNumericKey(key)) {
    const numeric = Number(key);

    if (!Number.isFinite(numeric) || numeric <= UNIX_SECONDS_THRESHOLD) {
      return new Date(NaN);
    }

    return new Date(numeric * MILLISECONDS_PER_SECOND);
  }

  if (!isDateOnly(key)) {
    return new Date(NaN);
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
  const normalized = normalizeDateInput(value, name);
  const date = value instanceof Date ? new Date(value.valueOf()) : new Date(normalized);

  if (Number.isNaN(date.valueOf())) {
    throw new TypeError(`${name} must be a valid date`);
  }

  return date;
}

/**
 * Rejects timezone-ambiguous strings and normalizes calendar dates to UTC.
 *
 * @param {unknown} value - Candidate date input.
 * @param {string} name - Public concept named in failures.
 * @returns {unknown} Date-constructor input with explicit timezone semantics.
 */
function normalizeDateInput(value, name) {
  if (typeof value !== "string") {
    return value;
  }

  if (isDateOnly(value)) {
    return `${value}T00:00:00Z`;
  }

  if (!hasExplicitTimezone(value)) {
    throw new TypeError(`${name} date-time string must include a timezone offset or Z`);
  }

  return value;
}

/**
 * Recognizes the exact timezone-free ISO calendar form.
 *
 * @param {string} value - Candidate date string.
 * @returns {boolean} Whether separators and decimal fields match YYYY-MM-DD.
 */
function isDateOnly(value) {
  if (value.length !== ISO_DATE_LENGTH || value[4] !== "-" || value[7] !== "-") {
    return false;
  }

  return [
    ...value,
  ].every((character, index) => DATE_SEPARATOR_INDICES.has(index) || (character >= "0" && character <= "9"));
}

/**
 * Recognizes supported decimal Unix-second keys without a permissive parser.
 *
 * @param {string} value - Candidate heatmap key.
 * @returns {boolean} Whether every character belongs to one decimal number.
 */
function isNumericKey(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || value.trim() !== value || value === "") {
    return false;
  }

  const body = value.startsWith("-") ? value.slice(1) : value;
  const parts = body.split(".");

  return (
    parts.length <= 2 &&
    parts.every(
      (part) =>
        part !== "" &&
        [
          ...part,
        ].every((character) => character >= "0" && character <= "9"),
    )
  );
}

/**
 * Detects a terminal Z or numeric offset on a date-time string.
 *
 * @param {string} value - Candidate date-time string.
 * @returns {boolean} Whether timezone semantics are explicit.
 */
function hasExplicitTimezone(value) {
  if (!value.includes("T")) {
    return false;
  }

  if (value.toUpperCase().endsWith("Z")) {
    return true;
  }

  const offset = value.slice(-TIMEZONE_OFFSET_LENGTH);
  const sign = offset[0];
  const digits = `${offset.slice(1, TIMEZONE_HOUR_END)}${offset.slice(TIMEZONE_MINUTE_START)}`;

  return (
    [
      "+",
      "-",
    ].includes(sign) &&
    offset[TIMEZONE_HOUR_END] === ":" &&
    [
      ...digits,
    ].every((character) => character >= "0" && character <= "9")
  );
}

/**
 * Rejects unknown public input-object keys.
 *
 * @param {object} input - Candidate public record.
 * @param {string[]} allowed - Exhaustive supported keys.
 * @param {string} concept - Public concept named in failures.
 * @returns {void} Exhaustive records pass unchanged.
 */
function validateObjectKeys(input, allowed, concept) {
  const unknown = unknownKey(input, allowed);

  if (unknown) {
    throw new TypeError(`Unsupported ${concept} key: ${unknown}`);
  }
}

/**
 * Validates timesheet tasks and derives an enclosing time range when omitted.
 *
 * @param {{start?: string | number | Date, end?: string | number | Date, tasks?: Array<object>}} [data={}] - Timesheet bounds and task records.
 * @param {readonly string[]} [colors=DEFAULT_COLORS] - Effective categorical palette.
 * @returns {{start: Date, end: Date, tasks: Array<object>}} Canonical task collection enclosed by validated bounds.
 * @throws {TypeError} When tasks, dates, durations, or explicit bounds are invalid.
 */
function normalizeTimesheetData(data = {}, colors = DEFAULT_COLORS) {
  validateObjectKeys(
    data,
    [
      "start",
      "end",
      "tasks",
    ],
    "timesheet data",
  );
  if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
    throw new TypeError("Timesheet data requires a non-empty tasks array");
  }

  const palette = new TimesheetPalette(colors);
  const tasks = data.tasks.map((task, index) => normalizeTimesheetTask(task, index, palette));

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

  return {
    start,
    end,
    tasks,
  };
}

/**
 * Normalizes one task against strict dates and the shared palette stream.
 *
 * @param {unknown} task - Candidate task input.
 * @param {number} index - Stable task position.
 * @param {TimesheetPalette} palette - Encounter-ordered palette state.
 * @returns {object} Normalized task snapshot.
 */
function normalizeTimesheetTask(task, index, palette) {
  if (!isRecord(task)) {
    throw new TypeError("Each timesheet task must be an object");
  }

  validateObjectKeys(
    task,
    [
      "label",
      "start",
      "end",
      "group",
      "color",
    ],
    "timesheet task",
  );
  if (!isNonEmptyText(task.label)) {
    throw new TypeError("Timesheet task label must be a non-empty string");
  }

  if (task.group !== undefined && !isNonEmptyText(task.group)) {
    throw new TypeError("Timesheet task group must be a non-empty string");
  }

  const start = normalizeDate(task.start, `Task ${index + 1} start`);
  const end = normalizeDate(task.end, `Task ${index + 1} end`);

  if (end <= start) {
    throw new TypeError("Timesheet task end must be after start");
  }

  return {
    label: task.label,
    start,
    end,
    group: task.group,
    color: palette.colorFor(task),
  };
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

  if (datasets.length > 1 && datasets.some((dataset) => dataset.identityName === undefined)) {
    throw new TypeError("An unnamed dataset is valid only for a single-series chart");
  }

  const hasGeneratedIndependentLabels =
    [
      ChartType.SCATTER,
      ChartType.BUBBLE,
    ].includes(type) && labels.every((label) => typeof label === "number");

  if (!hasGeneratedIndependentLabels && datasets.some((dataset) => dataset.points.length !== labels.length)) {
    throw new TypeError("Chart labels length must match every dataset");
  }

  if (
    [
      ...AGGREGATION_TYPES,
      ChartType.POLAR_AREA,
    ].includes(type) &&
    datasets.length !== 1
  ) {
    throw new TypeError(`${type} requires exactly one dataset`);
  }

  if (
    [
      ...AGGREGATION_TYPES,
      ChartType.POLAR_AREA,
      ChartType.RADAR,
    ].includes(type)
  ) {
    validateNonNegativeData(type, datasets);
  }
}

/**
 * Validates radial and composition values after numeric normalization.
 *
 * @param {string} type - Current chart type.
 * @param {Array<object>} datasets - Normalized datasets.
 * @returns {void} Non-negative data with a positive composition total passes.
 */
function validateNonNegativeData(type, datasets) {
  const values = datasets.flatMap((dataset) => dataset.points.map((point) => point.y));

  if (values.some((value) => value < 0)) {
    throw new TypeError(`${type} values must be non-negative`);
  }

  if (
    [
      ...AGGREGATION_TYPES,
      ChartType.POLAR_AREA,
    ].includes(type) &&
    values.every((value) => value === 0)
  ) {
    throw new TypeError(`${type} requires at least one positive value`);
  }
}

export {
  requireFiniteNumber,
  normalizePoint,
  normalizeDatasets,
  normalizeHeatmapData,
  normalizeDate,
  normalizeTimesheetData,
  validateObjectKeys,
  validateSeriesScene,
  validateChartData,
};
