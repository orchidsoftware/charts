/**
 * Reports whether a value is a record boundary.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} Whether the value is a non-array object.
 */
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Reports whether a value is non-empty text.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} Whether the value contains non-whitespace text.
 */
function isNonEmptyText(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * Reports whether a value is a finite number at or above a minimum.
 *
 * @param {unknown} value - Candidate value.
 * @param {number} minimum - Inclusive minimum.
 * @returns {boolean} Whether the value meets the numeric boundary.
 */
function isNumberAtLeast(value, minimum) {
  return Number.isFinite(value) && value >= minimum;
}

/**
 * Reports whether a value is a valid opacity.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} Whether the value is between zero and one.
 */
function isOpacity(value) {
  return isNumberAtLeast(value, 0) && value <= 1;
}

/**
 * Reports whether a value is boolean.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} Whether the value is boolean.
 */
function isBoolean(value) {
  return typeof value === "boolean";
}

/**
 * Finds the first key outside an allowed collection.
 *
 * @param {object} value - Record to inspect.
 * @param {Set<string>|string[]} allowed - Allowed keys.
 * @returns {string|undefined} First unknown key, when present.
 */
function unknownKey(value, allowed) {
  const names = allowed instanceof Set ? allowed : new Set(allowed);

  return Object.keys(value).find((key) => !names.has(key));
}

/**
 * Reports whether a value belongs to a fixed collection.
 *
 * @param {unknown} value - Candidate value.
 * @param {unknown[]} choices - Allowed values.
 * @returns {boolean} Whether the collection contains the value.
 */
function isChoice(value, choices) {
  return choices.includes(value);
}

/**
 * Reports whether an angle is inside one open full-circle interval.
 *
 * @param {unknown} value - Requested angular gap in degrees.
 * @returns {boolean} Whether the gap is finite, nonnegative and smaller than a circle.
 */
function isPadAngle(value) {
  const fullCircle = 360;

  return isNumberAtLeast(value, 0) && value < fullCircle;
}

export { isPadAngle, isBoolean, isChoice, isNonEmptyText, isNumberAtLeast, isOpacity, isRecord, unknownKey };
