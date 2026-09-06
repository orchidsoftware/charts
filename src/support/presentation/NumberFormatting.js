import { COMPACT_NUMBER_FORMATTER, SMALL_NUMBER_FORMATTER, STANDARD_NUMBER_FORMATTER } from "../Constants.js";

const COMPACT_NUMBER_THRESHOLD = 10_000;
const SMALL_NUMBER_THRESHOLD = 0.01;

/**
 * Formats chart numbers compactly while preserving useful small decimals.
 *
 * @param {number} value - Finite numeric value to present to a user.
 * @returns {string} Locale-aware compact, precise, or standard representation.
 */
function formatNumber(value) {
  const absolute = Math.abs(value);

  if (absolute >= COMPACT_NUMBER_THRESHOLD) {
    return COMPACT_NUMBER_FORMATTER.format(value);
  }

  if (absolute > 0 && absolute < SMALL_NUMBER_THRESHOLD) {
    return SMALL_NUMBER_FORMATTER.format(value);
  }

  return STANDARD_NUMBER_FORMATTER.format(value);
}

export { formatNumber };
