import { MULTILINE_LABEL_HEIGHT } from "../Constants.js";
import { svg } from "../Dom.js";

const DEFAULT_LABEL_FONT_SIZE = 11;
const BALANCE_OVERFLOW_WEIGHT = 10_000;
const MINIMUM_BALANCED_LABEL_LINES = 2;
const MAXIMUM_BALANCED_LABEL_LINES = 3;
const measurementSurface = { context: null };

/**
 * Scores a contiguous line partition by overflow first and raggedness second.
 *
 * @param {string[]} lines - Candidate text lines.
 * @param {number} maxWidth - Available width for every line.
 * @returns {number} Lower scores represent a better balanced partition.
 */
function lineBalanceScore(lines, maxWidth) {
  const widths = lines.map((line) => measuredTextWidth(line));
  const overflow = widths.reduce((sum, width) => sum + Math.max(0, width - maxWidth), 0);
  const widest = Math.max(...widths);
  const narrowest = Math.min(...widths);

  return overflow * BALANCE_OVERFLOW_WEIGHT + widest - narrowest;
}

/**
 * Finds the best two- or three-line contiguous partition for a word sequence.
 *
 * @param {string[]} words - Ordered label words.
 * @param {number} lineCount - Requested line count.
 * @param {number} maxWidth - Available width for every line.
 * @returns {string[]} Best balanced lines for the requested count.
 */
function balancedPartition(words, lineCount, maxWidth) {
  let best = [
    words.join(" "),
  ];
  let bestScore = Infinity;

  for (let first = 1; first < words.length; first += 1) {
    const lastStart = lineCount === MINIMUM_BALANCED_LABEL_LINES ? words.length : first + 1;

    for (let second = lastStart; second <= words.length; second += 1) {
      const lines = [
        words.slice(0, first).join(" "),
        words.slice(first, second).join(" "),
      ];

      if (lineCount === MAXIMUM_BALANCED_LABEL_LINES) {
        lines.push(words.slice(second).join(" "));
      }

      const score = lineBalanceScore(lines, maxWidth);

      if (lines.every(Boolean) && score < bestScore) {
        best = lines;
        bestScore = score;
      }
    }
  }

  return best;
}

/**
 * Balances an ordinary phrase into the fewest lines that fit its width budget.
 *
 * @param {string} value - Plain category label.
 * @param {number} maxWidth - Available width for every line.
 * @returns {string[]} One to three deterministic display lines.
 */
function balancedTextLines(value, maxWidth) {
  const text = value.trim();

  if (measuredTextWidth(text) <= maxWidth) {
    return [
      text,
    ];
  }

  const words = text.split(/\s+/u);

  if (words.length < 2) {
    return [
      text,
    ];
  }

  for (
    let lineCount = MINIMUM_BALANCED_LABEL_LINES;
    lineCount <= Math.min(MAXIMUM_BALANCED_LABEL_LINES, words.length);
    lineCount += 1
  ) {
    const lines = balancedPartition(words, lineCount, maxWidth);

    if (lines.every((line) => measuredTextWidth(line) <= maxWidth)) {
      return lines;
    }
  }

  return balancedPartition(words, Math.min(MAXIMUM_BALANCED_LABEL_LINES, words.length), maxWidth);
}

/**
 * Truncates text to a measured pixel budget and adds an ellipsis when needed.
 *
 * @param {unknown} value - Value converted to text before measurement.
 * @param {number} maxWidth - Maximum permitted rendered width in pixels.
 * @param {number} [fontSize=11] - Font size used by the measurement context.
 * @returns {string} Original text or the longest fitting ellipsized prefix.
 */
function truncateText(value, maxWidth, fontSize = 11) {
  const text = String(value);

  if (measuredTextWidth(text, fontSize) <= maxWidth) {
    return text;
  }

  let low = 1;
  let high = text.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, middle).trimEnd()}…`;

    if (measuredTextWidth(candidate, fontSize) <= maxWidth) {
      low = middle;

      continue;
    }

    high = middle - 1;
  }

  return `${text.slice(0, low).trimEnd()}…`;
}

/**
 * Creates an SVG text label with truncation and an accessible full-value fallback.
 *
 * @param {object} specification - Content and presentation values for one label.
 * @param {unknown} specification.value - Display value rendered into the text node.
 * @param {Record<string, string | number>} specification.attributes - SVG positioning and presentation attributes.
 * @param {object} specification.measurement - Width and typography used for truncation.
 * @param {unknown} [specification.originalValue=specification.value] - Unformatted value exposed to assistive technology.
 * @returns {SVGElement} Detached SVG text element ready for insertion.
 */
function labelElement({ value, attributes, measurement, originalValue = value }) {
  const element = svg("text", attributes);
  const visible = truncateText(value, measurement.maxWidth, measurement.fontSize ?? DEFAULT_LABEL_FONT_SIZE);
  element.textContent = visible;
  if (visible !== String(value)) {
    const title = svg("title");
    title.textContent = String(value);
    element.append(title);
  }

  if (String(originalValue) !== String(value) || visible !== String(value)) {
    element.setAttribute("aria-label", String(originalValue));
  }

  return element;
}

/**
 * Lazily creates the process-local canvas context shared by text measurements.
 *
 * @returns {CanvasRenderingContext2D} Detached measurement context.
 */
function textMeasurementContext() {
  measurementSurface.context ??= document.createElement("canvas").getContext("2d");

  return measurementSurface.context;
}

/**
 * Measures text using the same platform font stack as chart labels.
 *
 * @param {unknown} value - Value converted to text before measurement.
 * @param {number} [fontSize=11] - Font size used by the canvas context.
 * @returns {number} Measured text width in CSS pixels.
 */
function measuredTextWidth(value, fontSize = 11) {
  const context = textMeasurementContext();
  context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`;

  return context.measureText(String(value)).width;
}

/**
 * Measures legend text with the legend's default typography.
 *
 * @param {unknown} value - Legend label converted to text before measurement.
 * @returns {number} Measured legend-label width in CSS pixels.
 */
function measuredLegendTextWidth(value) {
  return measuredTextWidth(value);
}

/**
 * Creates a vertically centered multi-line SVG label with accessible source text.
 *
 * @param {object} specification - Content and presentation values for one multi-line label.
 * @param {string | string[]} specification.value - One or more requested display lines.
 * @param {Record<string, string | number>} specification.attributes - SVG positioning and presentation attributes.
 * @param {number} specification.maxWidth - Maximum permitted width for each rendered line.
 * @param {unknown} [specification.originalValue=specification.value] - Unformatted value exposed to assistive technology.
 * @returns {SVGElement} Detached SVG text element containing positioned tspan children.
 */
function wrappedLabelElement({ value, attributes, maxWidth, originalValue = value }) {
  const lines = Array.isArray(value)
    ? value.map((line) => line.trim())
    : balancedTextLines(String(value), maxWidth);

  const text = lines.join(" ");

  const visibleLines = lines.map((line) => truncateText(line, maxWidth));
  const element = svg("text", { ...attributes, class: `${attributes.class} charts2-multiline-label` });

  for (const [
    index,
    line,
  ] of visibleLines.entries()) {
    const tspan = svg("tspan", {
      x: attributes.x,
      dy: index === 0 ? (-MULTILINE_LABEL_HEIGHT * (visibleLines.length - 1)) / 2 : MULTILINE_LABEL_HEIGHT,
    });

    tspan.textContent = line;
    element.append(tspan);
  }

  if (visibleLines.some((line, index) => line !== lines[index])) {
    const title = svg("title");
    title.textContent = text;
    element.append(title);
  }

  if (
    Array.isArray(value) ||
    String(originalValue) !== text ||
    visibleLines.some((line, index) => line !== lines[index])
  ) {
    element.setAttribute("aria-label", String(originalValue));
  }

  return element;
}

export { truncateText, labelElement, measuredTextWidth, measuredLegendTextWidth, wrappedLabelElement };
