import {
  ChartOrientation,
  ChartType,
  CHART_ORIENTATIONS,
  DEFAULT_COLORS,
  DEFAULT_PAD_ANGLE,
  TYPES,
  Y_AXIS_POSITIONS,
} from "../support/Constants.js";
import { measureParentWidth } from "../support/Dom.js";

const DEFAULT_CHART_HEIGHT = 320;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_TIMESHEET_TASK_COUNT = 4;
const FULL_CIRCLE_DEGREES = 360;
const MINIMUM_TIMESHEET_HEIGHT = 220;
const TIMESHEET_FRAME_HEIGHT = 52;
const TIMESHEET_ROW_HEIGHT = 40;

const ALLOWED_OPTIONS = Object.freeze([
  "ariaLabel",
  "axisOptions",
  "barOptions",
  "colors",
  "countLabel",
  "data",
  "description",
  "gradient",
  "height",
  "lineOptions",
  "maxSlices",
  "onSelect",
  "orientation",
  "padAngle",
  "radius",
  "sectorOptions",
  "showAxes",
  "showDots",
  "showGrid",
  "showLabels",
  "showLegend",
  "showTooltip",
  "startAngle",
  "strokeWidth",
  "timesheetOptions",
  "title",
  "tooltipOptions",
  "type",
  "width",
]);

/**
 * Validates one optional renderer radius.
 *
 * @param {unknown} value - Optional radius supplied by renderer configuration.
 * @param {string} name - Human-readable option name used in validation errors.
 * @returns {void} Missing and non-negative finite radii are accepted.
 * @throws {TypeError} When a supplied radius is negative or non-finite.
 */
function validateRadius(value, name) {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new TypeError(`${name} must be a non-negative finite number`);
  }
}

/**
 * Validates configuration values drawn from closed vocabularies.
 *
 * @param {object} options - Structurally valid chart options.
 * @returns {void} Choice validation completes without transforming input.
 * @throws {TypeError} When orientation or axis placement is unsupported.
 */
function validateChoices(options) {
  if (options.orientation && !CHART_ORIENTATIONS.includes(options.orientation)) {
    throw new TypeError("Bar orientation must be vertical or horizontal");
  }

  if (options.axisOptions?.yAxisPosition && !Y_AXIS_POSITIONS.includes(options.axisOptions.yAxisPosition)) {
    throw new TypeError("Y-axis position must be left or right");
  }
}

/**
 * Validates angles and radii shared by renderer families.
 *
 * @param {object} options - Structurally valid chart options.
 * @returns {void} Geometry validation completes without transforming input.
 * @throws {TypeError} When an angle or radius is outside its supported range.
 */
function validateGeometry(options) {
  if (isInvalidPadAngle(options.padAngle)) {
    throw new TypeError("Pad angle must be a finite number from 0 up to 360 degrees");
  }

  for (const [value, name] of [
    [options.barOptions?.radius, "Bar radius"],
    [options.sectorOptions?.cornerRadius, "Sector corner radius"],
    [options.timesheetOptions?.radius, "Timesheet radius"],
  ]) {
    validateRadius(value, name);
  }
}

/**
 * Detects unsupported optional sector padding.
 *
 * @param {unknown} value - Optional padding angle in degrees.
 * @returns {boolean} True when a supplied angle is non-finite or outside one circle.
 */
function isInvalidPadAngle(value) {
  if (value === undefined) {
    return false;
  }

  if (!Number.isFinite(value)) {
    return true;
  }

  return value < 0 || value >= FULL_CIRCLE_DEGREES;
}

/**
 * Rejects unsupported choices and invalid renderer geometry.
 *
 * @param {object} options - Candidate public chart options.
 * @returns {void} Validation returns only when the complete contract is satisfied.
 * @throws {TypeError} When a name, type, choice, angle, or radius is invalid.
 */
function validateChartOptions(options) {
  if (!options || typeof options !== "object") {
    throw new TypeError("Chart options must be an object");
  }

  const unknownOption = Object.keys(options).find((name) => !ALLOWED_OPTIONS.includes(name));

  if (unknownOption) {
    throw new TypeError(`Unsupported chart option: ${unknownOption}`);
  }

  if (!TYPES.includes(options.type)) {
    throw new TypeError(`Chart type must be one of: ${TYPES.join(", ")}`);
  }

  validateChoices(options);
  validateGeometry(options);
}

/**
 * Names the renderer-facing presentation defaults as one cohesive value.
 */
class PresentationOptions {
  /**
   * Resolves every presentation choice from validated caller options.
   *
   * @param {object} options - Validated caller options.
   */
  constructor(options) {
    this.showAxes = options.showAxes ?? true;
    this.showGrid = options.showGrid ?? true;
    this.showLabels = options.showLabels ?? true;
    this.showLegend = shouldShowLegend(options);
    this.showTooltip = options.showTooltip ?? true;
    this.orientation = options.orientation ?? ChartOrientation.VERTICAL;
    this.ariaLabel = options.ariaLabel ?? `${options.type} chart`;
  }
}

/**
 * Resolves visibility, accessibility, and orientation defaults.
 *
 * @param {object} options - Validated caller options.
 * @returns {PresentationOptions} Complete presentation choices for every renderer.
 */
function presentationOptions(options) {
  return new PresentationOptions(options);
}

/**
 * Resolves the legend default while preserving the timesheet contract.
 *
 * @param {object} options - Validated chart options.
 * @returns {boolean} Whether the selected chart family displays a legend.
 */
function shouldShowLegend(options) {
  if (options.type === ChartType.TIMESHEET) {
    return false;
  }

  return options.showLegend ?? true;
}

/**
 * Resolves responsive width and chart-family-specific height defaults.
 *
 * @param {Element} host - Chart host used for responsive width measurement.
 * @param {object} options - Validated caller options.
 * @returns {{width: number, height: number}} Candidate dimensions for final validation.
 */
function chartDimensions(host, options) {
  const taskCount = options.data?.tasks?.length ?? DEFAULT_TIMESHEET_TASK_COUNT;
  const timesheetHeight = Math.max(MINIMUM_TIMESHEET_HEIGHT, taskCount * TIMESHEET_ROW_HEIGHT + TIMESHEET_FRAME_HEIGHT);
  const defaultHeight = options.type === ChartType.TIMESHEET ? timesheetHeight : DEFAULT_CHART_HEIGHT;

  return { width: options.width ?? measureParentWidth(host), height: options.height ?? defaultHeight };
}

/**
 * Validates and normalizes configuration in one obvious entry point.
 *
 * @param {Element} host - Resolved chart host used for responsive dimensions.
 * @param {import("../index.js").ChartOptions} options - Candidate public chart configuration.
 * @returns {{options: object, hasCustomColors: boolean}} Renderer-ready options and palette provenance.
 * @throws {TypeError} When the configuration cannot produce a chart.
 */
function normalizeChartOptions(host, options) {
  validateChartOptions(options);

  const normalized = {
    colors: options.colors ? [...options.colors] : DEFAULT_COLORS,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    padAngle: options.padAngle ?? DEFAULT_PAD_ANGLE,
    ...options,
    ...presentationOptions(options),
    ...chartDimensions(host, options),
  };

  if ([normalized.width, normalized.height].some((value) => !(Number.isFinite(value) && value > 0))) {
    throw new TypeError("Chart width and height must be positive finite numbers");
  }

  if (!Array.isArray(normalized.colors) || normalized.colors.length === 0) {
    throw new TypeError("Chart colors must be a non-empty array");
  }

  return { options: normalized, hasCustomColors: options.colors !== undefined };
}

export { normalizeChartOptions };
