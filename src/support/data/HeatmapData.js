import { isRecord } from "../Validation.js";

import { isDateOnly, isNumericKey, normalizeDate } from "./Dates.js";
import { validateObjectKeys } from "./InputValidation.js";

const ISO_DATE_LENGTH = 10;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_DAY = 86_400_000;
const UNIX_SECONDS_THRESHOLD = 100_000;

/**
 * Converts keyed heatmap values into sorted, date-addressable entries.
 *
 * @param {{start?: string | Date, end?: string | Date, points?: Record<string, number>}} [data={}] - Heatmap dates and values.
 * @returns {Array<{date: Date, key: string, value: number}>} Chronologically sorted daily entries.
 * @throws {TypeError} When bounds, dates, or values are invalid.
 */
function normalizeHeatmapData(data = {}) {
  validateObjectKeys(
    data,
    [
      "start",
      "end",
      "points",
    ],
    "heatmap data",
  );
  const source = data.points;

  validateHeatmapPoints(source);

  const entries = normalizedHeatmapEntries(source);
  const range = heatmapRange(data, entries);

  return continuousHeatmapDays(entries, range);
}

/**
 * Converts raw heatmap entries into validated UTC day records.
 *
 * @param {Record<string, number>} source - Caller-supplied keyed values.
 * @returns {Array<object>} Chronologically sorted day records.
 */
function normalizedHeatmapEntries(source) {
  return Object.entries(source)
    .map(
      ([
        key,
        value,
      ]) => {
        const date = heatmapDate(key);

        if (Number.isNaN(date.valueOf())) {
          throw new TypeError(`Invalid heatmap date: ${key}`);
        }

        date.setUTCHours(0, 0, 0, 0);

        return {
          date,
          key: date.toISOString().slice(0, ISO_DATE_LENGTH),
          value,
        };
      },
    )
    .toSorted((left, right) => left.date - right.date);
}

/**
 * Fills every missing UTC day in a validated heatmap range with zero.
 *
 * @param {Array<object>} entries - Sorted explicit values.
 * @param {{start: Date, end: Date}} range - Inclusive calendar bounds.
 * @returns {Array<object>} Continuous daily records.
 */
function continuousHeatmapDays(entries, range) {
  const values = new Map(
    entries.map((entry) => [
      entry.key,
      entry.value,
    ]),
  );

  const days = [];

  for (
    let timestamp = range.start.valueOf();
    timestamp <= range.end.valueOf();
    timestamp += MILLISECONDS_PER_DAY
  ) {
    const date = new Date(timestamp);
    const key = date.toISOString().slice(0, ISO_DATE_LENGTH);

    days.push({
      date,
      key,
      value: values.get(key) ?? 0,
    });
  }

  return days;
}

/**
 * Validates an optional explicit heatmap range against normalized UTC days.
 *
 * @param {object} data - Heatmap data containing optional bounds.
 * @param {Array<object>} entries - Sorted normalized point entries.
 * @returns {void} Ascending containing ranges pass unchanged.
 */
function heatmapRange(data, entries) {
  if (data.start === undefined && data.end === undefined) {
    return {
      start: entries[0].date,
      end: entries.at(-1).date,
    };
  }

  if (data.start === undefined || data.end === undefined) {
    throw new TypeError("Heatmap range requires both start and end");
  }

  const start = heatmapBound(data.start, "Heatmap range start");
  const end = heatmapBound(data.end, "Heatmap range end");

  if (start > end) {
    throw new TypeError("Heatmap range end cannot precede start");
  }

  if (entries[0].date < start || entries.at(-1).date > end) {
    throw new TypeError("Heatmap range must contain every point");
  }

  return {
    start,
    end,
  };
}

/**
 * Converts a heatmap range bound to its UTC calendar day.
 *
 * @param {unknown} value - Date or transitional date-only string.
 * @param {string} name - Public concept named in failures.
 * @returns {Date} Midnight UTC calendar bound.
 */
function heatmapBound(value, name) {
  const date = normalizeDate(value, name);

  return new Date(`${date.toISOString().slice(0, ISO_DATE_LENGTH)}T00:00:00Z`);
}

/**
 * Interprets a heatmap key as Unix seconds or an ISO calendar date.
 *
 * @param {string} key - Caller-supplied heatmap date key.
 * @returns {Date} Candidate date for subsequent validity checking.
 */
function heatmapDate(key) {
  if (isNumericKey(key)) {
    const numeric = Number(key);

    if (!Number.isFinite(numeric) || numeric <= UNIX_SECONDS_THRESHOLD) {
      return new Date(NaN);
    }

    return new Date(numeric * MILLISECONDS_PER_SECOND);
  }

  if (!isDateOnly(key)) {
    return new Date(NaN);
  }

  return new Date(`${key}T00:00:00Z`);
}

export { normalizeHeatmapData };

/**
 * Validates a non-empty heatmap point record.
 *
 * @param {unknown} value - Candidate date-to-count record.
 * @returns {void} Finite point collections pass unchanged.
 */
function validateHeatmapPoints(value) {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new TypeError("points must contain at least one entry");
  }

  if (Object.values(value).some((point) => !Number.isFinite(point))) {
    throw new TypeError("heatmap point values must be finite numbers");
  }
}

export { validateHeatmapPoints };
