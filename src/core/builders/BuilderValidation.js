import {
  isBoolean,
  isChoice,
  isNonEmptyText,
  isNumberAtLeast,
  isOpacity,
  isRecord,
  unknownKey,
} from "../../support/Validation.js";

const STRING_OPTIONS = new Set([
  "title",
  "description",
  "ariaLabel",
  "countLabel",
]);

const POSITIVE_OPTIONS = new Set([
  "width",
  "height",
]);

const NON_NEGATIVE_OPTIONS = new Set([
  "dotSize",
  "strokeWidth",
  "radius",
  "cornerRadius",
]);

const BOOLEAN_OPTIONS = new Set([
  "smooth",
  "dots",
  "line",
  "area",
  "frameless",
  "axes",
  "grid",
  "valueLabels",
  "legend",
  "tooltip",
  "stacked",
]);

const FUNCTION_OPTIONS = new Set([
  "onSelect",
  "formatLabel",
  "formatValue",
  "formatDate",
  "formatDuration",
  "formatTick",
  "axisFormatValue",
  "tooltipFormatDate",
  "tooltipFormatDuration",
  "tooltipFormatLabel",
  "tooltipFormatValue",
]);

const FULL_CIRCLE_DEGREES = 360;

/**
 * Requires a non-empty user-facing string.
 *
 * @param {unknown} value - Candidate label or text.
 * @param {string} name - Public concept named in failures.
 * @returns {void} Valid text passes unchanged.
 */
function validateText(value, name) {
  if (!isNonEmptyText(value)) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

/**
 * Requires a finite numeric value within a lower bound.
 *
 * @param {unknown} value - Candidate number.
 * @param {string} name - Public concept named in failures.
 * @param {number} minimum - Inclusive lower bound.
 * @returns {void} Valid numbers pass unchanged.
 */
function validateNumber(value, name, minimum) {
  if (!isNumberAtLeast(value, minimum)) {
    throw new TypeError(`${name} must be a finite number of at least ${minimum}`);
  }
}

/**
 * Requires an actual boolean rather than accepting truthy values.
 *
 * @param {unknown} value - Candidate switch.
 * @param {string} name - Public method name.
 * @returns {void} Boolean values pass unchanged.
 */
function validateBoolean(value, name) {
  if (!isBoolean(value)) {
    throw new TypeError(`${name} must be a boolean`);
  }
}

/**
 * Requires a synchronous formatter or callback function.
 *
 * @param {unknown} value - Candidate callback.
 * @param {string} name - Public concept named in failures.
 * @returns {void} Functions pass unchanged.
 */
function validateFunction(value, name) {
  if (typeof value !== "function") {
    throw new TypeError(`${name} must be a function`);
  }
}

/**
 * Validates independently decidable chart-level fluent arguments.
 *
 * @param {string} name - Internal option name matching the public concept.
 * @param {unknown} value - Candidate option value.
 * @returns {void} Valid values may be copied into builder state.
 */
function validateBuilderOption(name, value) {
  if (STRING_OPTIONS.has(name)) {
    validateText(value, name);
  }

  if (POSITIVE_OPTIONS.has(name)) {
    validateNumber(value, name, Number.EPSILON);
  }

  if (NON_NEGATIVE_OPTIONS.has(name)) {
    validateNumber(value, name, 0);
  }

  if (BOOLEAN_OPTIONS.has(name)) {
    validateBoolean(value, name);
  }

  if (FUNCTION_OPTIONS.has(name)) {
    validateFunction(value, name);
  }

  validateSpecialOption(name, value);
}

/**
 * Validates structured and bounded chart-level options.
 *
 * @param {string} name - Internal option name.
 * @param {unknown} value - Candidate option value.
 * @returns {void} Valid special options pass unchanged.
 */
function validateSpecialOption(name, value) {
  if (name === "colors") {
    validateColors(value);
  }

  if (name === "maxSlices" && (!Number.isSafeInteger(value) || !isNumberAtLeast(value, 1))) {
    throw new TypeError("maxSlices must be a positive integer");
  }

  if (name === "startAngle" && !Number.isFinite(value)) {
    throw new TypeError("startAngle must be a finite number");
  }

  if (name === "padAngle" && isInvalidPadAngle(value)) {
    throw new TypeError("padAngle must be a finite number from 0 up to 360");
  }

  if (name === "gradient") {
    validateGradient(value);
  }
}

/**
 * Detects a value outside the supported sector-gap interval.
 *
 * @param {unknown} value - Candidate angular gap.
 * @returns {boolean} Whether the value is not finite or outside one circle.
 */
function isInvalidPadAngle(value) {
  return !Number.isFinite(value) || value < 0 || value >= FULL_CIRCLE_DEGREES;
}

/**
 * Validates the palette's immediate structural contract.
 *
 * @param {unknown} values - Candidate color collection.
 * @returns {void} A non-empty string palette passes for render-time CSS checks.
 */
function validateColors(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError("colors must be a non-empty array");
  }

  for (const value of values) {
    validateText(value, "color");
  }
}

/**
 * Validates gradient switches and opacity endpoints.
 *
 * @param {unknown} value - Boolean switch or endpoint record.
 * @returns {void} Supported gradient values pass unchanged.
 */
function validateGradient(value) {
  if (typeof value === "boolean") {
    return;
  }

  if (!isRecord(value)) {
    throw new TypeError("gradient must be a boolean or GradientOptions object");
  }

  const unknown = unknownKey(value, [
    "fromOpacity",
    "toOpacity",
  ]);

  if (unknown) {
    throw new TypeError(`Unsupported gradient option: ${unknown}`);
  }

  for (const endpoint of Object.values(value)) {
    validateNumber(endpoint, "gradient opacity", 0);
    if (!isOpacity(endpoint)) {
      throw new TypeError("gradient opacity must be from 0 through 1");
    }
  }
}

/**
 * Validates category labels at the fluent call boundary.
 *
 * @param {unknown} labels - Candidate ordered labels.
 * @returns {void} A copied array can safely enter builder state.
 */
function validateLabels(labels) {
  if (!Array.isArray(labels)) {
    throw new TypeError("labels must be an array");
  }

  for (const label of labels) {
    validateText(label, "label");
  }
}

/**
 * Validates a non-empty heatmap point record.
 *
 * @param {unknown} value - Candidate date-to-count record.
 * @returns {void} Finite point collections pass unchanged.
 */
function validateHeatmapPoints(value) {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new TypeError("points must contain at least one entry");
  }

  if (Object.values(value).some((point) => !Number.isFinite(point))) {
    throw new TypeError("heatmap point values must be finite numbers");
  }
}

/**
 * Validates the structured form of a timesheet task.
 *
 * @param {unknown} value - Candidate task record.
 * @returns {void} Supported task fields pass unchanged.
 */
function validateTask(value) {
  if (!isRecord(value)) {
    throw new TypeError("task must be an object or positional task arguments");
  }

  const allowed = new Set([
    "label",
    "start",
    "end",
    "group",
    "color",
  ]);

  const unknown = unknownKey(value, allowed);

  if (unknown) {
    throw new TypeError(`Unsupported task key: ${unknown}`);
  }

  validateText(value.label, "task label");
  if (value.group !== undefined) {
    validateText(value.group, "task group");
  }
}

/**
 * Validates one opacity value against its closed interval.
 *
 * @param {unknown} value - Candidate opacity.
 * @param {string} name - Public property name.
 * @returns {void} Values from zero through one pass unchanged.
 */
function validateOpacity(value, name) {
  validateNumber(value, name, 0);
  if (!isOpacity(value)) {
    throw new TypeError(`${name} must be from 0 through 1`);
  }
}

/**
 * Validates a value-axis position.
 *
 * @param {unknown} value - Candidate logical side.
 * @returns {void} Supported positions pass unchanged.
 */
function validatePosition(value) {
  if (
    !isChoice(value, [
      "left",
      "right",
    ])
  ) {
    throw new TypeError("position must be left or right");
  }
}

/**
 * Validates a named annotation line pattern.
 *
 * @param {unknown} value - Candidate line style.
 * @returns {void} Supported styles pass unchanged.
 */
function validateLineStyle(value) {
  if (
    !isChoice(value, [
      "solid",
      "dashed",
      "dotted",
    ])
  ) {
    throw new TypeError("lineStyle must be solid, dashed, or dotted");
  }
}

/**
 * Validates an annotation label position.
 *
 * @param {unknown} value - Candidate logical position.
 * @returns {void} Supported positions pass unchanged.
 */
function validateLabelPosition(value) {
  if (
    !isChoice(value, [
      "start",
      "center",
      "end",
    ])
  ) {
    throw new TypeError("labelPosition must be start, center, or end");
  }
}

/**
 * Validates one explicit marker dash sequence.
 *
 * @param {unknown} value - Candidate dash and gap lengths.
 * @returns {void} A usable non-negative pattern passes unchanged.
 */
function validateDash(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError("dash must be a non-empty array");
  }

  if (value.some((part) => !Number.isFinite(part) || part < 0) || value.every((part) => part === 0)) {
    throw new TypeError("dash values must be non-negative with at least one positive value");
  }
}

export {
  validateBoolean,
  validateBuilderOption,
  validateDash,
  validateFunction,
  validateGradient,
  validateHeatmapPoints,
  validateLabelPosition,
  validateLabels,
  validateLineStyle,
  validateNumber,
  validateOpacity,
  validatePosition,
  validateTask,
  validateText,
};
