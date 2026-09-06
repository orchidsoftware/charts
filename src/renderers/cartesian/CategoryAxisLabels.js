import { measuredTextWidth } from "../../support/presentation/TextLayout.js";

const LABEL_GAP = 8;

/**
 * Measures a complete label and bounds its placement inside the plot.
 *
 * @param {object} specification - Formatted content and plot geometry.
 * @param {string | string[]} specification.label - Formatted category label.
 * @param {number} specification.index - Source category index.
 * @param {number} specification.position - Unchanged category coordinate.
 * @param {object} specification.frame - Plot boundaries.
 * @returns {object} Label with its occupied horizontal interval.
 */
function placeLabel({ label, index, position, frame }) {
  const { left, right } = frame;
  const value = Array.isArray(label) ? label.join(" ") : String(label);
  const width = Math.min(measuredTextWidth(value), Math.max(0, right - left));
  const start = Math.max(left, Math.min(position - width / 2, right - width));
  let anchor = "middle";
  let x = start + width / 2;

  if (position - width / 2 < left) {
    anchor = "start";
    x = start;
  }

  if (position + width / 2 > right) {
    anchor = "end";
    x = start + width;
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
 * Distributes a requested label count across the complete category range.
 *
 * @param {object[]} labels - Measured labels ordered by source index.
 * @param {number} count - Requested number of labels, including both endpoints.
 * @returns {object[]} Balanced candidates, or an empty array on collision.
 */
function sampleLabels(labels, count) {
  const visible = [
    labels[0],
  ];

  for (let slot = 1; slot < count; slot += 1) {
    const index = Math.round((slot * (labels.length - 1)) / (count - 1));
    const label = labels[index];
    const previous = visible.at(-1);

    if (label.start < previous.start + previous.width + LABEL_GAP) {
      return [];
    }

    visible.push(label);
  }

  return visible;
}

/**
 * Chooses the densest balanced sampling that fits the actual formatted text.
 * Only labels are sampled; the category scale and interactive marks are untouched.
 *
 * @param {object} specification - Formatted labels and category geometry.
 * @param {(string | string[])[]} specification.labels - Display labels in source order.
 * @param {(index: number) => number} specification.positionAt - Category scale.
 * @param {number} specification.left - Plot start.
 * @param {number} specification.right - Plot end.
 * @returns {object[]} Visible labels with bounded positions and width budgets.
 */
export function categoryAxisLabels({ labels, positionAt, left, right }) {
  const measured = labels.map((label, index) =>
    placeLabel({ label, index, position: positionAt(index), frame: { left, right } }),
  );

  if (measured.length < 2) {
    return measured;
  }

  if (measured[0].start + measured[0].width + LABEL_GAP > measured.at(-1).start) {
    return [
      measured[0],
    ];
  }

  for (let count = measured.length; count > 2; count -= 1) {
    const visible = sampleLabels(measured, count);

    if (visible.length > 0) {
      return visible;
    }
  }

  return [
    measured[0],
    measured.at(-1),
  ];
}
