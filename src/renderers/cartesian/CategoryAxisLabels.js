import { truncateText } from "../../support/presentation/TextLayout.js";

const LABEL_GAP = 8;

/**
 * Measures the text that can actually be shown within this axis.
 *
 * @param {string} value - Complete formatted label.
 * @param {object} specification - Axis span and its CSS text measurements.
 * @returns {object} Glyph bounds and native text advance.
 */
function labelBounds(value, specification) {
  const visible = truncateText(
    value,
    Math.max(0, specification.right - specification.left),
    specification.widthOf,
  );

  if (specification.boundsOf) {
    return specification.boundsOf(visible);
  }

  const width = specification.widthOf(visible);

  return {
    x: 0,
    width,
    advance: width,
  };
}

/**
 * Measures a complete label and bounds its placement inside the plot.
 *
 * @param {number} index - Source category index.
 * @param {object} specification - Labels and category geometry.
 * @param {Array<string | string[]>} specification.labels - Formatted category labels.
 * @param {(index: number) => number} specification.positionAt - Category coordinate.
 * @param {(value: string) => number} specification.widthOf - Rendered category text width.
 * @param {(value: string) => object} [specification.boundsOf] - Exact glyph bounds for native SVG anchoring.
 * @param {number} specification.left - Plot start.
 * @param {number} specification.right - Plot end.
 * @returns {object} Label with its occupied horizontal interval.
 */
function placeLabel(index, specification) {
  const { labels, positionAt, left, right } = specification;
  const label = labels[index];
  const position = positionAt(index);
  const value = Array.isArray(label) ? label.join(" ") : label;
  const bounds = labelBounds(value, specification);
  const width = bounds.width;
  const start = Math.max(left, Math.min(position - width / 2, right - width));
  let anchor = "middle";

  if (position - width / 2 < left) {
    anchor = "start";
  }

  if (position + width / 2 > right) {
    anchor = "end";
  }

  const offset = anchor === "middle" ? bounds.advance / 2 : 0;
  let x = start - bounds.x + offset;

  if (anchor === "end") {
    x += bounds.advance;
  }

  return {
    index,
    value,
    width,
    start,
    anchor,
    x,
  };
}

/**
 * Chooses the densest balanced sampling that fits the actual formatted text.
 * Only labels are sampled; the category scale and interactive marks are untouched.
 *
 * @param {object} specification - Formatted labels and category geometry.
 * @param {(string | string[])[]} specification.labels - Display labels in source order.
 * @param {(index: number) => number} specification.positionAt - Category scale.
 * @param {(value: string) => number} specification.widthOf - Rendered category text width.
 * @param {(value: string) => object} [specification.boundsOf] - Exact glyph bounds for native SVG anchoring.
 * @param {number} specification.left - Plot start.
 * @param {number} specification.right - Plot end.
 * @returns {object[]} Visible labels with bounded positions and width budgets.
 */
export function categoryAxisLabels(specification) {
  const { labels, left, right } = specification;

  if (labels.length === 0) {
    return [];
  }

  const labelAt = (index) => placeLabel(index, specification);
  const first = labelAt(0);
  // Even zero-width labels need a gap; larger candidate counts cannot fit.
  const maximumCount = Math.min(labels.length, Math.floor((right - left) / LABEL_GAP) + 1);

  for (let count = maximumCount; count >= 2; count -= 1) {
    const visible = [
      first,
    ];

    for (let slot = 1; slot < count; slot += 1) {
      const index = Math.round((slot * (labels.length - 1)) / (count - 1));
      const label = labelAt(index);
      const previous = visible.at(-1);

      if (label.start < previous.start + previous.width + LABEL_GAP) {
        // eslint-disable-next-line unicorn/no-break-in-nested-loop -- Reject this count and continue the bounded label search.
        break;
      }

      visible.push(label);
    }

    if (visible.length === count) {
      return visible;
    }
  }

  return [
    first,
  ];
}
