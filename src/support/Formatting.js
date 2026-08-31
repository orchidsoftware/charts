import { formatNumber } from "./Dom.js";

/**
 * Creates one frozen formatter context with a frozen point when present.
 *
 * @param {object} options - Current chart options.
 * @param {string} target - Display surface requesting text.
 * @param {object} [details={}] - Dataset and point identity.
 * @returns {object} Frozen public formatter context.
 */
function formatContext(options, target, details = {}) {
  const point = details.point ? Object.freeze({ ...details.point }) : undefined;

  return Object.freeze({ target, chartType: publicChartType(options.type), ...details, point });
}

/**
 * Hides the transitional internal mixed renderer name from callbacks.
 *
 * @param {string} type - Internal renderer chart type.
 * @returns {string} Renderer-only mixed naming mapped onto the public union.
 */
function publicChartType(type) {
  return type;
}

/**
 * Requires formatter results to remain plain synchronous strings.
 *
 * @param {unknown} value - Formatter result.
 * @param {string} scope - Public formatter scope.
 * @returns {string} Valid display text.
 */
function formatterText(value, scope) {
  if (typeof value !== "string") {
    throw new TypeError(`${scope} formatter must return a string`);
  }

  return value;
}

/**
 * Accepts either one label or explicit lines for a wrapped category label.
 *
 * @param {unknown} value - Label formatter result.
 * @returns {string | readonly string[]} Valid display label.
 */
function formatterLabel(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0 && value.every((line) => typeof line === "string")) {
    return Object.freeze([
      ...value,
    ]);
  }

  throw new TypeError("Label formatter must return a string or a non-empty string array");
}

/**
 * Formats one category label for an axis, visible label, or tooltip.
 *
 * @param {object} options - Current chart options.
 * @param {unknown} label - Raw category label.
 * @param {object} details - Target and source identity.
 * @returns {string | readonly string[]} Display text or explicit axis-label lines.
 */
function formatLabel(options, label, details) {
  const tooltipFormatter = details.target === "tooltip" ? options.tooltipFormatLabel : undefined;
  const formatter = tooltipFormatter ?? options.formatLabel;

  if (!formatter) {
    return String(label);
  }

  const formatted = formatterLabel(
    formatter(label, formatContext(options, details.target, { ...details, label })),
  );

  if (Array.isArray(formatted) && details.target !== "axis") {
    return formatted.join(" ");
  }

  return formatted;
}

/**
 * Formats one numeric value using dataset, surface, chart, then built-in precedence.
 *
 * @param {object} options - Current chart options.
 * @param {number} value - Raw numeric value.
 * @param {object} details - Target, dataset, and point identity.
 * @returns {string} Plain display text.
 */
function formatValue(options, value, details) {
  const datasetFormatter = details.target === "axis" ? undefined : details.dataset?.formatValue;
  const tooltipFormatter = details.target === "tooltip" ? options.tooltipFormatValue : undefined;
  const axisFormatter = details.target === "axis" ? options.axisFormatValue : undefined;

  const formatter = [
    datasetFormatter,
    tooltipFormatter,
    axisFormatter,
    options.formatValue,
  ].find((candidate) => typeof candidate === "function");

  if (!formatter) {
    return formatNumber(value);
  }

  const contextDetails = { ...details };
  Reflect.deleteProperty(contextDetails, "dataset");

  return formatterText(formatter(value, formatContext(options, details.target, contextDetails)), "Value");
}

export { formatContext, formatLabel, formatValue, formatterLabel, formatterText };
