import { copyBuilderValue } from "./BuilderState.js";
import { validateBuilderOption } from "./BuilderValidation.js";

const temporalScopes = new WeakMap();

/**
 * Registers a callback-only temporal tooltip scope.
 *
 * @param {object} scope - Tooltip builder passed to caller code.
 * @param {object} record - Detached formatter record.
 * @param {string} name - Human-readable scope name.
 * @returns {void} The scope becomes active for one callback.
 */
function initializeTemporalScope(scope, record, name) {
  temporalScopes.set(scope, { record, name, active: true });
}

/**
 * Writes a formatter while the temporal callback remains active.
 *
 * @param {object} scope - Active temporal tooltip builder.
 * @param {string} name - Formatter property name.
 * @param {unknown} value - Caller formatter retained by reference.
 * @returns {void} The formatter becomes the local tooltip override.
 */
function writeTemporalScope(scope, name, value) {
  validateBuilderOption(name, value);
  const entry = temporalScopes.get(scope);

  if (!entry?.active) {
    throw new TypeError(`${entry?.name ?? "Tooltip"} scope has expired`);
  }

  entry.record[name] = copyBuilderValue(value);
}

/**
 * Configures heatmap date and count formatting.
 */
class DateTooltipBuilder {
  /**
   * Creates an active date-aware tooltip scope.
   *
   * @param {object} record - Detached tooltip formatter record.
   * @param {string} name - Public scope name used by expiry errors.
   */
  constructor(record, name) {
    initializeTemporalScope(this, record, name);
  }

  /**
   * Formats calendar dates shown by the tooltip.
   *
   * @param {(date: Date) => string} formatter - Synchronous date formatter.
   * @returns {this} Active temporal tooltip scope.
   */
  formatDate(formatter) {
    writeTemporalScope(this, "formatDate", formatter);

    return this;
  }
}

/**
 * Configures heatmap date and count formatting.
 */
class HeatmapTooltipBuilder extends DateTooltipBuilder {
  /**
   * Creates an active heatmap tooltip scope.
   *
   * @param {object} record - Detached tooltip formatter record.
   */
  constructor(record) {
    super(record, "Heatmap tooltip");
  }

  /**
   * Formats heatmap counts shown by the tooltip.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous value formatter.
   * @returns {this} Active heatmap tooltip scope.
   */
  formatValue(formatter) {
    writeTemporalScope(this, "formatValue", formatter);

    return this;
  }
}

/**
 * Configures timesheet dates and durations shown by the tooltip.
 */
class TimesheetTooltipBuilder extends DateTooltipBuilder {
  /**
   * Creates an active timesheet tooltip scope.
   *
   * @param {object} record - Detached tooltip formatter record.
   */
  constructor(record) {
    super(record, "Timesheet tooltip");
  }

  /**
   * Formats task durations shown by the tooltip.
   *
   * @param {(milliseconds: number) => string} formatter - Synchronous duration formatter.
   * @returns {this} Active timesheet tooltip scope.
   */
  formatDuration(formatter) {
    writeTemporalScope(this, "formatDuration", formatter);

    return this;
  }
}

/**
 * Runs a temporal tooltip callback and expires its scope on every exit path.
 *
 * @param {object} scope - Heatmap or timesheet tooltip builder.
 * @param {(scope: object) => void} configure - User formatter callback.
 * @returns {void} Callback return values are deliberately ignored.
 */
function runTemporalScope(scope, configure) {
  try {
    configure(scope);
  } finally {
    temporalScopes.get(scope).active = false;
  }
}

export { HeatmapTooltipBuilder, TimesheetTooltipBuilder, runTemporalScope };
