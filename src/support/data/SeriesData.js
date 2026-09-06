import { AGGREGATION_TYPES, ChartType, DEFAULT_COLORS } from "../Constants.js";
import { isBoolean, isChoice, isNonEmptyText, isNumberAtLeast, isOpacity, isRecord } from "../Validation.js";

import { validateGradient } from "./Gradient.js";
import { requireFiniteNumber, validateObjectKeys } from "./InputValidation.js";

const DEFAULT_POINT_RADIUS = 5;

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
    gradient: isRecord(dataset.gradient) ? { ...dataset.gradient } : dataset.gradient,
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
  if (dataset.gradient !== undefined) {
    validateGradient(dataset.gradient);
  }

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

export { normalizePoint, normalizeDatasets, validateSeriesScene, validateChartData };
