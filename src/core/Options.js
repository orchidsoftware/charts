import {
  AGGREGATION_TYPES,
  ORIENTATION_VERTICAL,
  CHART_HEATMAP,
  CHART_POLAR_AREA,
  CHART_TIMESHEET,
  CHART_ORIENTATIONS,
  DEFAULT_PAD_ANGLE,
  TYPES,
  Y_AXIS_POSITIONS,
} from "../support/Constants.js";
import { measureParentWidth } from "../support/Dom.js";
import { chartColors } from "../support/Palette.js";
import {
  isChoice,
  isNonEmptyText,
  isNumberAtLeast,
  isPadAngle,
  isRecord,
  unknownKey,
} from "../support/Validation.js";

const DEFAULT_CHART_HEIGHT = 320;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_TIMESHEET_TASK_COUNT = 4;
const MINIMUM_TIMESHEET_HEIGHT = 220;
const TIMESHEET_FRAME_HEIGHT = 52;
const TIMESHEET_ROW_HEIGHT = 40;

const CSS_VARIABLE_PREFIX_LENGTH = 4;

const ANNOTATION_COLOR_PROPERTIES = Object.freeze([
  "color",
  "labelColor",
]);

const ALLOWED_OPTIONS = Object.freeze([
  "area",
  "ariaLabel",
  "axes",
  "axisFormatValue",
  "colors",
  "cornerRadius",
  "countLabel",
  "data",
  "description",
  "dots",
  "dotSize",
  "formatDate",
  "formatDuration",
  "gradient",
  "formatLabel",
  "formatTick",
  "formatValue",
  "grid",
  "height",
  "legend",
  "line",
  "maxSlices",
  "onSelect",
  "orientation",
  "padAngle",
  "radius",
  "smooth",
  "stacked",
  "startAngle",
  "strokeWidth",
  "title",
  "tooltip",
  "tooltipFormatDate",
  "tooltipFormatDuration",
  "tooltipFormatLabel",
  "tooltipFormatValue",
  "type",
  "valueLabels",
  "width",
  "yAxisPosition",
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
  if (value !== undefined && !isNumberAtLeast(value, 0)) {
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
  if (options.orientation && !isChoice(options.orientation, CHART_ORIENTATIONS)) {
    throw new TypeError("Bar orientation must be vertical or horizontal");
  }

  if (options.yAxisPosition && !isChoice(options.yAxisPosition, Y_AXIS_POSITIONS)) {
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
  if (options.padAngle !== undefined && !isPadAngle(options.padAngle)) {
    throw new TypeError("Pad angle must be a finite number from 0 up to 360 degrees");
  }

  for (const [
    value,
    name,
  ] of [
    [
      options.radius,
      "Radius",
    ],
    [
      options.cornerRadius,
      "Corner radius",
    ],
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
  if (!isRecord(options)) {
    throw new TypeError("Chart options must be an object");
  }

  const unknownOption = unknownKey(options, ALLOWED_OPTIONS);

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
  return Object.freeze({
    axes: options.axes ?? true,
    grid: options.grid ?? true,
    valueLabels: options.valueLabels ?? true,
    legend: shouldShowLegend(options),
    tooltip: options.tooltip ?? true,
    orientation: options.orientation ?? ORIENTATION_VERTICAL,
    ariaLabel: options.ariaLabel ?? options.title ?? `${options.type} chart`,
  });
}

/**
 * Resolves the legend default while preserving the timesheet contract.
 *
 * @param {object} options - Validated chart options.
 * @returns {boolean} Whether the selected chart family displays a legend.
 */
function shouldShowLegend(options) {
  if (options.type === CHART_TIMESHEET) {
    return false;
  }

  if (options.legend !== undefined) {
    return options.legend;
  }

  if (
    [
      ...AGGREGATION_TYPES,
      CHART_POLAR_AREA,
      CHART_HEATMAP,
    ].includes(options.type)
  ) {
    return true;
  }

  return options.data.datasets.length >= 2;
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

  const timesheetHeight = Math.max(
    MINIMUM_TIMESHEET_HEIGHT,
    taskCount * TIMESHEET_ROW_HEIGHT + TIMESHEET_FRAME_HEIGHT,
  );

  const defaultHeight = options.type === CHART_TIMESHEET ? timesheetHeight : DEFAULT_CHART_HEIGHT;

  return {
    width: options.width ?? measureParentWidth(host),
    height: options.height ?? defaultHeight,
  };
}

/**
 * Validates and normalizes configuration in one obvious entry point.
 *
 * @param {Element} host - Resolved chart host used for responsive dimensions.
 * @param {import("../index.js").ChartOptions} options - Candidate public chart configuration.
 * @returns {{options: object}} Renderer-ready options.
 * @throws {TypeError} When the configuration cannot produce a chart.
 */
function normalizeChartOptions(host, options) {
  validateChartOptions(options);
  validateChartColors(host, options);

  const normalized = {
    colors: options.colors
      ? [
          ...options.colors,
        ]
      : chartColors(options.type),
    strokeWidth: DEFAULT_STROKE_WIDTH,
    padAngle: options.padAngle ?? DEFAULT_PAD_ANGLE,
    ...options,
    ...presentationOptions(options),
    ...chartDimensions(host, options),
  };

  if (
    [
      normalized.width,
      normalized.height,
    ].some((value) => !isNumberAtLeast(value, Number.EPSILON))
  ) {
    throw new TypeError("Chart width and height must be positive finite numbers");
  }

  if (!Array.isArray(normalized.colors) || normalized.colors.length === 0) {
    throw new TypeError("Chart colors must be a non-empty array");
  }

  return {
    options: normalized,
  };
}

/**
 * Validates every palette and explicit input color in the parent CSS context.
 *
 * @param {Element} host - Chart parent supplying custom-property values.
 * @param {object} input - Options or update data containing color fields.
 * @returns {void} Every supplied color is supported by the browser.
 */
function validateChartColors(host, input) {
  const colors = collectColors(input);

  for (const color of colors) {
    validateCssColor(host, color);
  }
}

/**
 * Adds explicitly supplied color fields from one public record collection.
 *
 * @param {unknown[]} colors - Accumulator receiving explicit color values.
 * @param {unknown} records - Candidate dataset, annotation, or task collection.
 * @param {string[]} properties - Color fields supported by the record schema.
 * @returns {void} Missing and malformed collections add no colors.
 */
function appendRecordColors(colors, records, properties) {
  if (!Array.isArray(records)) {
    return;
  }

  for (const record of records) {
    if (!isRecord(record)) {
      continue;
    }

    for (const property of properties) {
      if (Object.hasOwn(record, property)) {
        colors.push(record[property]);
      }
    }
  }
}

/**
 * Collects colors only from fields declared by the public chart-data schemas.
 *
 * Numeric point collections are intentionally never traversed: colors can be
 * supplied by palettes, datasets, annotations, and timesheet tasks only.
 *
 * @param {unknown} input - Complete chart options or one public update payload.
 * @returns {unknown[]} Explicit color values awaiting browser validation.
 */
function collectColors(input) {
  if (!isRecord(input)) {
    return [];
  }

  const colors = [];

  if (Array.isArray(input.colors)) {
    colors.push(...input.colors);
  }

  const hasData = input.data && typeof input.data === "object";
  const data = hasData ? input.data : input;

  appendRecordColors(colors, data.datasets, [
    "color",
  ]);
  appendRecordColors(colors, data.markers, ANNOTATION_COLOR_PROPERTIES);
  appendRecordColors(colors, data.regions, ANNOTATION_COLOR_PROPERTIES);
  appendRecordColors(colors, data.tasks, [
    "color",
  ]);

  return colors;
}

/**
 * Resolves CSS variables and verifies one browser-supported color.
 *
 * @param {Element} host - Parent supplying custom properties.
 * @param {unknown} value - Candidate CSS color.
 * @returns {void} Supported colors pass unchanged.
 */
function validateCssColor(host, value) {
  if (!isNonEmptyText(value)) {
    throw new TypeError("Color must be a non-empty supported CSS color");
  }

  const color = resolvedColor(host, value.trim());
  const isSupported = globalThis.CSS?.supports?.("color", color) ?? supportsStyleColor(color);

  if (!isSupported) {
    throw new TypeError(`Unsupported CSS color: ${value}`);
  }
}

/**
 * Resolves one leading var() expression against the chart parent.
 *
 * @param {Element} host - Parent supplying custom properties.
 * @param {string} value - Candidate color expression.
 * @returns {string} Resolved color or unresolved original value.
 */
function resolvedColor(host, value) {
  if (!value.startsWith("var(") || !value.endsWith(")")) {
    return value;
  }

  const [
    name,
    ...fallbackParts
  ] = value.slice(CSS_VARIABLE_PREFIX_LENGTH, -1).split(",");

  const resolved = getComputedStyle(host).getPropertyValue(name.trim()).trim();
  const fallback = fallbackParts.join(",").trim();
  const candidate = resolved || fallback;

  if (!candidate) {
    throw new TypeError(`Unresolved CSS color variable: ${name.trim()}`);
  }

  return candidate;
}

/**
 * Uses detached style parsing when CSS.supports is unavailable.
 *
 * @param {string} color - Resolved candidate color.
 * @returns {boolean} Whether the browser accepts the declaration.
 */
function supportsStyleColor(color) {
  const probe = document.createElement("span");
  probe.style.color = color;

  return probe.style.color !== "";
}

export { normalizeChartOptions, validateChartColors, validateChartOptions };
