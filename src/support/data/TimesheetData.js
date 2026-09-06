import { DEFAULT_COLORS } from "../Constants.js";
import { isRecord, unknownKey } from "../Validation.js";

import { normalizeDate } from "./Dates.js";
import { validateObjectKeys, validateText } from "./InputValidation.js";

/**
 * Assigns one encounter-ordered palette stream across grouped and ungrouped tasks.
 */
class TimesheetPalette {
  #colors;
  #groups = new Map();
  #next = 0;

  /**
   * Captures the effective chart palette.
   *
   * @param {readonly string[]} colors - Cyclic categorical colors.
   */
  constructor(colors) {
    this.#colors = colors;
  }

  /**
   * Resolves an explicit task color or its stable categorical color.
   *
   * @param {object} task - Validated task input.
   * @returns {string} Effective task color.
   */
  colorFor(task) {
    const index = this.#indexFor(task.group);

    return task.color ?? this.#colors[index % this.#colors.length];
  }

  /**
   * Resolves and advances the palette key stream.
   *
   * @param {string | undefined} group - Optional stable group key.
   * @returns {number} Palette position.
   */
  #indexFor(group) {
    if (group && this.#groups.has(group)) {
      return this.#groups.get(group);
    }

    const index = this.#next;
    this.#next += 1;
    if (group) {
      this.#groups.set(group, index);
    }

    return index;
  }
}

/**
 * Validates timesheet tasks and derives an enclosing time range when omitted.
 *
 * @param {{start?: string | number | Date, end?: string | number | Date, tasks?: Array<object>}} [data={}] - Timesheet bounds and task records.
 * @param {readonly string[]} [colors=DEFAULT_COLORS] - Effective categorical palette.
 * @returns {{start: Date, end: Date, tasks: Array<object>}} Canonical task collection enclosed by validated bounds.
 * @throws {TypeError} When tasks, dates, durations, or explicit bounds are invalid.
 */
function normalizeTimesheetData(data = {}, colors = DEFAULT_COLORS) {
  validateObjectKeys(
    data,
    [
      "start",
      "end",
      "tasks",
    ],
    "timesheet data",
  );
  if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
    throw new TypeError("Timesheet data requires a non-empty tasks array");
  }

  const palette = new TimesheetPalette(colors);
  const tasks = data.tasks.map((task, index) => normalizeTimesheetTask(task, index, palette));

  const taskStart = new Date(Math.min(...tasks.map((task) => task.start.valueOf())));
  const taskEnd = new Date(Math.max(...tasks.map((task) => task.end.valueOf())));
  const start = data.start === undefined ? taskStart : normalizeDate(data.start, "Timesheet start");
  const end = data.end === undefined ? taskEnd : normalizeDate(data.end, "Timesheet end");

  if (end <= start) {
    throw new TypeError("Timesheet end must be after start");
  }

  if (start > taskStart || end < taskEnd) {
    throw new TypeError("Timesheet bounds must contain every task");
  }

  return {
    start,
    end,
    tasks,
  };
}

/**
 * Normalizes one task against strict dates and the shared palette stream.
 *
 * @param {unknown} task - Candidate task input.
 * @param {number} index - Stable task position.
 * @param {TimesheetPalette} palette - Encounter-ordered palette state.
 * @returns {object} Normalized task snapshot.
 */
function normalizeTimesheetTask(task, index, palette) {
  validateTask(task);

  const start = normalizeDate(task.start, `Task ${index + 1} start`);
  const end = normalizeDate(task.end, `Task ${index + 1} end`);

  if (end <= start) {
    throw new TypeError("Timesheet task end must be after start");
  }

  return {
    label: task.label,
    start,
    end,
    group: task.group,
    color: palette.colorFor(task),
  };
}

export { normalizeTimesheetData };

/**
 * Validates the structured form of a timesheet task.
 *
 * @param {unknown} value - Candidate task record.
 * @returns {void} Supported task fields pass unchanged.
 */
function validateTask(value) {
  if (!isRecord(value)) {
    throw new TypeError("task must be an object or positional task arguments");
  }

  const allowed = new Set([
    "label",
    "start",
    "end",
    "group",
    "color",
  ]);

  const unknown = unknownKey(value, allowed);

  if (unknown) {
    throw new TypeError(`Unsupported task key: ${unknown}`);
  }

  validateText(value.label, "task label");
  if (value.group !== undefined) {
    validateText(value.group, "task group");
  }
}

export { validateTask };
