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
  if (
    options.padAngle !== undefined &&
    (!Number.isFinite(options.padAngle) || options.padAngle < 0 || options.padAngle >= 360)
  ) {
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
 * Resolves visibility, accessibility, and orientation defaults.
 *
 * @param {object} options - Validated caller options.
 * @returns {object} Complete presentation choices for every renderer.
 */
function presentationOptions(options) {
  return {
    showAxes: options.showAxes ?? true,
    showGrid: options.showGrid ?? true,
    showLabels: options.showLabels ?? true,
    showLegend: options.type === ChartType.TIMESHEET ? false : (options.showLegend ?? true),
    showTooltip: options.showTooltip ?? true,
    orientation: options.orientation ?? ChartOrientation.VERTICAL,
    ariaLabel: options.ariaLabel ?? `${options.type} chart`,
  };
}

/**
 * Resolves responsive width and chart-family-specific height defaults.
 *
 * @param {Element} host - Chart host used for responsive width measurement.
 * @param {object} options - Validated caller options.
 * @returns {{width: number, height: number}} Candidate dimensions for final validation.
 */
function chartDimensions(host, options) {
  const taskCount = options.data?.tasks?.length ?? 4;
  const defaultHeight = options.type === ChartType.TIMESHEET ? Math.max(220, taskCount * 40 + 52) : 320;
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
    strokeWidth: 2,
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
