import { svg } from "../Dom.js";

const BALANCE_OVERFLOW_WEIGHT = 10_000;
const MINIMUM_BALANCED_LABEL_LINES = 2;
const MAXIMUM_BALANCED_LABEL_LINES = 3;
const MAXIMUM_BALANCED_WORDS = 24;

/**
 * Scores a contiguous line partition by overflow first and raggedness second.
 *
 * @param {string[]} lines - Candidate text lines.
 * @param {number} maxWidth - Available width for every line.
 * @param {(value: unknown) => number} widthOf - Contextual text measurement.
 * @returns {number} Lower scores represent a better balanced partition.
 */
function lineBalanceScore(lines, maxWidth, widthOf) {
  const widths = lines.map((line) => widthOf(line));
  const overflow = widths.reduce((sum, width) => sum + Math.max(0, width - maxWidth), 0);
  const widest = Math.max(...widths);
  const narrowest = Math.min(...widths);

  return overflow * BALANCE_OVERFLOW_WEIGHT + widest - narrowest;
}

/**
 * Finds the best two- or three-line contiguous partition for a word sequence.
 *
 * @param {string[]} words - Ordered label words.
 * @param {object} specification - Requested lines, available width and SVG typography.
 * @param {number} specification.lineCount - Requested line count.
 * @param {number} specification.maxWidth - Available width for every line.
 * @param {(value: unknown) => number} specification.widthOf - Contextual text measurement.
 * @returns {string[]} Best balanced lines for the requested count.
 */
function balancedPartition(words, { lineCount, maxWidth, widthOf }) {
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
        ...(lineCount === MAXIMUM_BALANCED_LABEL_LINES
          ? [
              words.slice(second).join(" "),
            ]
          : []),
      ];

      const score = lineBalanceScore(lines, maxWidth, widthOf);

      if (lines.every(Boolean) && score < bestScore) {
        [
          best,
          bestScore,
        ] = [
          lines,
          score,
        ];
      }
    }
  }

  return best;
}

/**
 * Wraps long input with bounded measurement work and retains the tail for ellipsis.
 *
 * @param {string[]} words - Original words in reading order.
 * @param {number} maxWidth - Available width per line.
 * @param {(value: unknown) => number} widthOf - Contextual text measurement.
 * @returns {string[]} At most three lines containing the complete source text.
 */
function greedyTextLines(words, maxWidth, widthOf) {
  const lines = [];
  let start = 0;
  let end = 1;

  while (end < words.length && lines.length < MAXIMUM_BALANCED_LABEL_LINES - 1) {
    const candidate = words.slice(start, end + 1).join(" ");

    if (widthOf(candidate) > maxWidth) {
      lines.push(words.slice(start, end).join(" "));
      start = end;
    }

    end += 1;
  }

  lines.push(words.slice(start).join(" "));

  return lines;
}

/**
 * Balances an ordinary phrase into the fewest lines that fit its width budget.
 *
 * @param {string} value - Plain category label.
 * @param {number} maxWidth - Available width for every line.
 * @param {(value: unknown) => number} widthOf - Contextual text measurement.
 * @returns {string[]} One to three deterministic display lines.
 */
function balancedTextLines(value, maxWidth, widthOf) {
  const text = value.trim();

  if (widthOf(text) <= maxWidth) {
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

  if (words.length > MAXIMUM_BALANCED_WORDS) {
    return greedyTextLines(words, maxWidth, widthOf);
  }

  let lines;

  for (
    let lineCount = MINIMUM_BALANCED_LABEL_LINES;
    lineCount <= Math.min(MAXIMUM_BALANCED_LABEL_LINES, words.length);
    lineCount += 1
  ) {
    lines = balancedPartition(words, { lineCount, maxWidth, widthOf });

    if (lines.every((line) => widthOf(line) <= maxWidth)) {
      return lines;
    }
  }

  return lines;
}

/**
 * Truncates text to a measured pixel budget and adds an ellipsis when needed.
 *
 * @param {unknown} value - Value converted to text before measurement.
 * @param {number} maxWidth - Maximum permitted rendered width in pixels.
 * @param {(value: unknown) => number} widthOf - Contextual SVG width measurement.
 * @returns {string} Original text or the longest fitting ellipsized prefix.
 */
function truncateText(value, maxWidth, widthOf) {
  const text = String(value);

  if (widthOf(text) <= maxWidth) {
    return text;
  }

  if (widthOf("…") > maxWidth) {
    return "";
  }

  let low = 0;
  let high = text.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, middle).trimEnd()}…`;

    if (widthOf(candidate) <= maxWidth) {
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

  const visible = truncateText(value, measurement.maxWidth, measurement.widthOf);

  element.append(document.createTextNode(visible));
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
 * Creates a vertically centered multi-line SVG label with accessible source text.
 *
 * @param {object} specification - Content and presentation values for one multi-line label.
 * @param {string | string[]} specification.value - One or more requested display lines.
 * @param {Record<string, string | number>} specification.attributes - SVG positioning and presentation attributes.
 * @param {number} specification.maxWidth - Maximum permitted width for each rendered line.
 * @param {object} specification.typography - Contextual width and line-height measurements.
 * @param {unknown} [specification.originalValue=specification.value] - Unformatted value exposed to assistive technology.
 * @returns {SVGElement} Detached SVG text element containing positioned tspan children.
 */
function wrappedLabelElement(specification) {
  const { value, attributes, maxWidth, typography, originalValue = value } = specification;

  const lines = Array.isArray(value)
    ? value.map((line) => line.trim())
    : balancedTextLines(String(value), maxWidth, typography.widthOf);

  const text = lines.join(" ");

  const visibleLines = lines.map((line) => truncateText(line, maxWidth, typography.widthOf));
  const element = svg("text", { ...attributes, class: `${attributes.class} orchid-charts-multiline-label` });

  for (const [
    index,
    line,
  ] of visibleLines.entries()) {
    const tspan = svg("tspan", {
      x: attributes.x,
      dy: index === 0 ? (-typography.lineHeight * (visibleLines.length - 1)) / 2 : typography.lineHeight,
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

export { truncateText, labelElement, wrappedLabelElement };
