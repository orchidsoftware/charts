import { formatNumber } from "./NumberFormatting.js";

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

  // eslint-disable-next-line sonarjs/no-unused-vars -- Dataset is internal formatter dispatch state.
  const { dataset: _dataset, ...identity } = details;

  return Object.freeze({ target, chartType: options.type, ...identity, point });
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

  const surfaceFormatter = tooltipFormatter ?? axisFormatter;
  const formatter = datasetFormatter ?? surfaceFormatter ?? options.formatValue;

  if (!formatter) {
    return formatNumber(value);
  }

  // eslint-disable-next-line sonarjs/no-unused-vars -- Rest projection deliberately excludes dataset metadata.
  const { dataset: _dataset, ...contextDetails } = details;

  return formatterText(formatter(value, formatContext(options, details.target, contextDetails)), "Value");
}

export { formatContext, formatLabel, formatValue, formatterLabel, formatterText };

/**
 * Resolves complete formatter identity from one series address.
 *
 * @param {object} chart - Normalized series collections.
 * @param {number} datasetIndex - Dataset address.
 * @param {number} index - Point address.
 * @returns {object} Canonical dataset and point context.
 */
function seriesContext(chart, datasetIndex, index) {
  const dataset = chart.datasets[datasetIndex];
  const point = dataset.points[index];

  return {
    dataset,
    datasetIndex,
    datasetName: dataset.name,
    index,
    point,
    label: chart.labels[index] ?? point.x,
  };
}

export { seriesContext };
