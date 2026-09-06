const ISO_DATE_LENGTH = 10;
const YEAR_LENGTH = 4;
const YEAR_MONTH_LENGTH = 7;

const DATE_SEPARATOR_INDICES = new Set([
  YEAR_LENGTH,
  YEAR_MONTH_LENGTH,
]);

const TIMEZONE_OFFSET_LENGTH = 6;
const TIMEZONE_HOUR_END = 3;
const TIMEZONE_MINUTE_START = 4;

/**
 * Creates an independent valid Date from a supported date-like value.
 *
 * @param {string | number | Date} value - Date-like value accepted by the platform Date constructor.
 * @param {string} name - Human-readable field name included in validation errors.
 * @returns {Date} Defensive Date instance with a valid timestamp.
 * @throws {TypeError} When the value cannot be interpreted as a date.
 */
function normalizeDate(value, name) {
  const normalized = normalizeDateInput(value, name);
  const date = value instanceof Date ? new Date(value.valueOf()) : new Date(normalized);

  if (Number.isNaN(date.valueOf())) {
    throw new TypeError(`${name} must be a valid date`);
  }

  return date;
}

/**
 * Rejects timezone-ambiguous strings and normalizes calendar dates to UTC.
 *
 * @param {unknown} value - Candidate date input.
 * @param {string} name - Public concept named in failures.
 * @returns {unknown} Date-constructor input with explicit timezone semantics.
 */
function normalizeDateInput(value, name) {
  if (typeof value !== "string") {
    return value;
  }

  if (isDateOnly(value)) {
    return `${value}T00:00:00Z`;
  }

  if (!hasExplicitTimezone(value)) {
    throw new TypeError(`${name} date-time string must include a timezone offset or Z`);
  }

  return value;
}

/**
 * Recognizes the exact timezone-free ISO calendar form.
 *
 * @param {string} value - Candidate date string.
 * @returns {boolean} Whether separators and decimal fields match YYYY-MM-DD.
 */
function isDateOnly(value) {
  if (value.length !== ISO_DATE_LENGTH || value[4] !== "-" || value[7] !== "-") {
    return false;
  }

  return [
    ...value,
  ].every((character, index) => DATE_SEPARATOR_INDICES.has(index) || (character >= "0" && character <= "9"));
}

/**
 * Recognizes supported decimal Unix-second keys without a permissive parser.
 *
 * @param {string} value - Candidate heatmap key.
 * @returns {boolean} Whether every character belongs to one decimal number.
 */
function isNumericKey(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || value.trim() !== value || value === "") {
    return false;
  }

  const body = value.startsWith("-") ? value.slice(1) : value;
  const parts = body.split(".");

  return (
    parts.length <= 2 &&
    parts.every(
      (part) =>
        part !== "" &&
        [
          ...part,
        ].every((character) => character >= "0" && character <= "9"),
    )
  );
}

/**
 * Detects a terminal Z or numeric offset on a date-time string.
 *
 * @param {string} value - Candidate date-time string.
 * @returns {boolean} Whether timezone semantics are explicit.
 */
function hasExplicitTimezone(value) {
  if (!value.includes("T")) {
    return false;
  }

  if (value.toUpperCase().endsWith("Z")) {
    return true;
  }

  const offset = value.slice(-TIMEZONE_OFFSET_LENGTH);
  const sign = offset[0];
  const digits = `${offset.slice(1, TIMEZONE_HOUR_END)}${offset.slice(TIMEZONE_MINUTE_START)}`;

  return (
    [
      "+",
      "-",
    ].includes(sign) &&
    offset[TIMEZONE_HOUR_END] === ":" &&
    [
      ...digits,
    ].every((character) => character >= "0" && character <= "9")
  );
}

export { normalizeDate, isDateOnly, isNumericKey };
