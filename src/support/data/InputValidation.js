import { isNonEmptyText, isNumberAtLeast, unknownKey } from "../Validation.js";

/**
 * Verifies that a value is safe to use in geometry calculations.
 *
 * @param {unknown} value - Candidate numeric value from caller-controlled chart data.
 * @param {string} name - Human-readable field name included in validation errors.
 * @returns {number} Validated finite number.
 * @throws {TypeError} When the candidate is not a finite number.
 */
function requireFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }

  return value;
}

/**
 * Rejects unknown public input-object keys.
 *
 * @param {object} input - Candidate public record.
 * @param {string[]} allowed - Exhaustive supported keys.
 * @param {string} concept - Public concept named in failures.
 * @returns {void} Exhaustive records pass unchanged.
 */
function validateObjectKeys(input, allowed, concept) {
  const unknown = unknownKey(input, allowed);

  if (unknown) {
    throw new TypeError(`Unsupported ${concept} key: ${unknown}`);
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

export { validateNumber, requireFiniteNumber, validateObjectKeys };

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

export { validateText };
