import { HOUR, DAY, TIME_TICK_STEPS } from "../Constants.js";

import { formatterText } from "./Formatting.js";

const DAYS_PER_YEAR = 365;
const QUARTER_YEAR_DAYS = 90;

/**
 * Produces bounded timestamps while preserving the exact requested endpoints.
 *
 * @param {number} start - Inclusive range start as Unix milliseconds.
 * @param {number} end - Inclusive range end as Unix milliseconds.
 * @param {number} maximumTicks - Preferred upper bound for the number of ticks.
 * @returns {number[]} Ordered unique timestamps suitable for an axis.
 */
function timeTicks(start, end, maximumTicks) {
  const span = end - start;

  const step =
    TIME_TICK_STEPS.find((candidate) => span / candidate <= maximumTicks - 1) ?? TIME_TICK_STEPS.at(-1);

  const interior = [];

  for (let value = start + step; value < end; value += step) {
    interior.push(value);
  }

  return [
    ...new Set([
      start,
      ...interior,
      end,
    ]),
  ];
}

/**
 * Formats a time-axis timestamp at a precision appropriate for the visible span.
 *
 * @param {number} value - Timestamp to format as Unix milliseconds.
 * @param {number} span - Visible duration in milliseconds.
 * @param {((date: Date) => string) | undefined} formatter - Optional caller-provided formatter.
 * @returns {string} Localized or caller-formatted tick label.
 */
function formatTimeTick(value, span, formatter) {
  const date = new Date(value);

  if (formatter) {
    return formatterText(formatter(date), "Timesheet tick date");
  }

  const options = timeFormatOptions(span);

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

/**
 * Selects date-time fields appropriate for a visible time span.
 *
 * @param {number} span - Visible duration in milliseconds.
 * @returns {Intl.DateTimeFormatOptions} Bounded localized date-time format.
 */
function timeFormatOptions(span) {
  if (span <= 2 * DAY) {
    return {
      hour: "numeric",
      minute: "2-digit",
    };
  }

  if (span <= QUARTER_YEAR_DAYS * DAY) {
    return {
      month: "short",
      day: "numeric",
    };
  }

  if (span <= 2 * DAYS_PER_YEAR * DAY) {
    return {
      month: "short",
      year: "2-digit",
    };
  }

  return { year: "numeric" };
}

/**
 * Formats a task boundary for display in a timesheet tooltip.
 *
 * @param {Date | string | number} date - Task boundary accepted by the Date constructor.
 * @param {((date: Date) => string) | undefined} formatter - Optional caller-provided formatter.
 * @returns {string} Localized or caller-formatted task boundary.
 */
function formatTimesheetDate(date, formatter) {
  if (formatter) {
    return formatterText(formatter(new Date(date)), "Timesheet tooltip date");
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats a duration using a human-scale day or hour unit.
 *
 * @param {number} milliseconds - Non-negative task duration in milliseconds.
 * @param {((duration: number) => string) | undefined} formatter - Optional caller-provided formatter.
 * @returns {string} Localized or caller-formatted duration label.
 */
function formatTimesheetDuration(milliseconds, formatter) {
  if (formatter) {
    return formatterText(formatter(milliseconds), "Timesheet tooltip duration");
  }

  const isMeasuredInDays = milliseconds >= DAY;
  const value = milliseconds / (isMeasuredInDays ? DAY : HOUR);
  const unit = isMeasuredInDays ? "day" : "hour";

  return new Intl.NumberFormat(undefined, {
    style: "unit",
    unit,
    unitDisplay: "long",
    maximumFractionDigits: 1,
  }).format(value);
}

export { timeTicks, formatTimeTick, formatTimesheetDate, formatTimesheetDuration };
