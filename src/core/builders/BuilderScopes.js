import { copyBuilderValue } from "./BuilderState.js";
import { validateBuilderOption, validateScopedValue } from "./BuilderValidation.js";

const records = new WeakMap();

/**
 * Associates one callback-only scope with the record it is allowed to edit.
 *
 * @param {object} scope - Scoped builder instance.
 * @param {object} record - Detached record owned by the parent builder.
 * @param {string} name - Human-readable scope name for expiry errors.
 * @returns {void} The scope becomes active for the current callback.
 */
function initializeScope(scope, record, name) {
  records.set(scope, { record, name, active: true });
}

/**
 * Reads an active scoped record and rejects retained callback builders.
 *
 * @param {object} scope - Scoped builder used by caller code.
 * @param {string} fallbackName - Scope family used for an unknown receiver.
 * @returns {object} Mutable detached record for the active callback.
 * @throws {TypeError} When the callback has already returned.
 */
function activeScopeRecord(scope, fallbackName) {
  const entry = records.get(scope);

  if (!entry?.active) {
    throw new TypeError(`${entry?.name ?? fallbackName} scope has expired`);
  }

  return entry.record;
}

/**
 * Ends a callback scope without exposing an `.end()` method to user code.
 *
 * @param {object} scope - Scoped builder whose callback has completed.
 * @returns {void} Future calls through a retained reference will fail.
 */
function expireScope(scope) {
  records.get(scope).active = false;
}

/**
 * Writes one copied value into an active callback record.
 *
 * @param {object} scope - Active callback builder.
 * @param {string} name - Record property being configured.
 * @param {unknown} value - Caller-controlled property value.
 * @returns {void} The callback value becomes the local override.
 */
function writeScopeValue(scope, name, value) {
  validateScopedValue(name, value);
  activeScopeRecord(scope, "Builder")[name] = copyBuilderValue(value);
}

/**
 * Writes one validated annotation override into its active record.
 *
 * @param {object} scope - Marker or region callback builder.
 * @param {string} name - Annotation property name.
 * @param {unknown} value - Caller-controlled property value.
 * @returns {void} The copied override is retained by the annotation.
 */
function writeAnnotationValue(scope, name, value) {
  validateScopedValue(name, value);
  activeScopeRecord(scope, "Annotation")[name] = copyBuilderValue(value);
}

/**
 * Writes one validated temporal tooltip formatter into its active record.
 *
 * @param {object} scope - Heatmap or timesheet tooltip builder.
 * @param {string} name - Formatter option name.
 * @param {unknown} value - Caller-controlled formatter.
 * @returns {void} The formatter is retained by reference.
 */
function writeTemporalValue(scope, name, value) {
  validateBuilderOption(name, value);
  activeScopeRecord(scope, "Tooltip")[name] = copyBuilderValue(value);
}

/**
 * Common dataset configuration shared by every series family.
 */
class DatasetBuilder {
  /**
   * Creates a callback-only dataset builder.
   *
   * @param {object} record - Detached dataset being configured.
   */
  constructor(record) {
    initializeScope(this, record, "Dataset");
  }

  /**
   * Chooses the dataset's explicit color.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active dataset scope.
   */
  color(value) {
    writeScopeValue(this, "color", value);

    return this;
  }

  /**
   * Chooses dataset opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active dataset scope.
   */
  opacity(value) {
    writeScopeValue(this, "opacity", value);

    return this;
  }

  /**
   * Formats this dataset's displayed values.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous display formatter.
   * @returns {this} Active dataset scope.
   */
  formatValue(formatter) {
    writeScopeValue(this, "formatValue", formatter);

    return this;
  }
}

/**
 * Adds line-only dataset conventions to the common callback scope.
 */
class LineDatasetBuilder extends DatasetBuilder {
  /**
   * Enables or configures the dataset's gradient area.
   *
   * @param {boolean | object} [isEnabled=true] - Gradient switch or opacity endpoints.
   * @returns {this} Active line dataset scope.
   */
  gradient(isEnabled = true) {
    writeScopeValue(this, "gradient", isEnabled);

    return this;
  }

  /**
   * Chooses curve smoothing for this dataset.
   *
   * @param {boolean} [isEnabled=true] - Whether smoothing is enabled.
   * @returns {this} Active line dataset scope.
   */
  smooth(isEnabled = true) {
    writeScopeValue(this, "smooth", isEnabled);

    return this;
  }

  /**
   * Chooses dot visibility for this dataset.
   *
   * @param {boolean} visible - Whether points are drawn.
   * @returns {this} Active line dataset scope.
   */
  dots(visible) {
    writeScopeValue(this, "dots", visible);

    return this;
  }

  /**
   * Chooses the dot radius for this dataset.
   *
   * @param {number} value - Dot radius in CSS pixels.
   * @returns {this} Active line dataset scope.
   */
  dotSize(value) {
    writeScopeValue(this, "dotSize", value);

    return this;
  }

  /**
   * Chooses line visibility while retaining other marks.
   *
   * @param {boolean} visible - Whether the line stroke is drawn.
   * @returns {this} Active line dataset scope.
   */
  line(visible) {
    writeScopeValue(this, "line", visible);

    return this;
  }

  /**
   * Enables or disables a solid area fill.
   *
   * @param {boolean} [isEnabled=true] - Whether an area is drawn.
   * @returns {this} Active line dataset scope.
   */
  area(isEnabled = true) {
    writeScopeValue(this, "area", isEnabled);

    return this;
  }

  /**
   * Chooses this dataset's stroke width.
   *
   * @param {number} value - Stroke width in CSS pixels.
   * @returns {this} Active line dataset scope.
   */
  strokeWidth(value) {
    writeScopeValue(this, "strokeWidth", value);

    return this;
  }
}

/**
 * Adds bar-only corner radius to the common dataset scope.
 */
class BarDatasetBuilder extends DatasetBuilder {
  /**
   * Chooses corner radius for this bar dataset.
   *
   * @param {number} value - Radius in CSS pixels.
   * @returns {this} Active bar dataset scope.
   */
  radius(value) {
    writeScopeValue(this, "radius", value);

    return this;
  }
}

/**
 * Configures chart tooltip display formatting inside one callback.
 */
class SeriesTooltipBuilder {
  /**
   * Creates a callback-only tooltip builder.
   *
   * @param {object} record - Detached tooltip configuration.
   */
  constructor(record) {
    initializeScope(this, record, "Tooltip");
  }

  /**
   * Formats category labels shown by the tooltip.
   *
   * @param {(label: string | number, context: object) => string} formatter - Synchronous label formatter.
   * @returns {this} Active tooltip scope.
   */
  formatLabel(formatter) {
    writeScopeValue(this, "formatLabel", formatter);

    return this;
  }

  /**
   * Formats numeric values shown by the tooltip.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous value formatter.
   * @returns {this} Active tooltip scope.
   */
  formatValue(formatter) {
    writeScopeValue(this, "tooltipValue", formatter);

    return this;
  }
}

/**
 * Configures the Cartesian value axis inside one callback.
 */
class AxisBuilder {
  /**
   * Creates a callback-only axis builder.
   *
   * @param {object} record - Detached axis configuration.
   */
  constructor(record) {
    initializeScope(this, record, "Y-axis");
  }

  /**
   * Places the value axis on the requested side.
   *
   * @param {"left" | "right"} value - Logical axis position.
   * @returns {this} Active axis scope.
   */
  position(value) {
    writeScopeValue(this, "position", value);

    return this;
  }

  /**
   * Formats numeric value-axis ticks.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous tick formatter.
   * @returns {this} Active axis scope.
   */
  formatValue(formatter) {
    writeScopeValue(this, "axisValue", formatter);

    return this;
  }
}

/**
 * Common annotation presentation shared by markers and regions.
 */
class AnnotationBuilder {
  /**
   * Creates one callback-only annotation builder.
   *
   * @param {object} record - Detached annotation input.
   * @param {string} name - Public scope name used by expiry errors.
   */
  constructor(record, name) {
    initializeScope(this, record, name);
  }

  /**
   * Chooses the annotation's primary color.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active annotation scope.
   */
  color(value) {
    writeAnnotationValue(this, "color", value);

    return this;
  }

  /**
   * Chooses annotation opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active annotation scope.
   */
  opacity(value) {
    writeAnnotationValue(this, "opacity", value);

    return this;
  }

  /**
   * Places the annotation label along its visual extent.
   *
   * @param {"start" | "center" | "end"} value - Logical label position.
   * @returns {this} Active annotation scope.
   */
  labelPosition(value) {
    writeAnnotationValue(this, "labelPosition", value);

    return this;
  }

  /**
   * Chooses annotation label color independently from its geometry.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active annotation scope.
   */
  labelColor(value) {
    writeAnnotationValue(this, "labelColor", value);

    return this;
  }

  /**
   * Chooses whether annotation values expand automatic domains.
   *
   * @param {boolean} isIncluded - Whether the annotation participates in domain calculation.
   * @returns {this} Active annotation scope.
   */
  includeInDomain(isIncluded) {
    writeAnnotationValue(this, "includeInDomain", isIncluded);

    return this;
  }

  /**
   * Formats visible and accessible annotation labels.
   *
   * @param {(...values: unknown[]) => string} formatter - Synchronous label formatter.
   * @returns {this} Active annotation scope.
   */
  formatLabel(formatter) {
    writeAnnotationValue(this, "formatLabel", formatter);

    return this;
  }
}

/**
 * Configures line-specific marker presentation.
 */
class MarkerBuilder extends AnnotationBuilder {
  /**
   * Creates an active marker callback scope.
   *
   * @param {object} record - Detached marker input.
   */
  constructor(record) {
    super(record, "Marker");
  }

  /**
   * Chooses marker stroke width.
   *
   * @param {number} value - Width in non-scaling CSS pixels.
   * @returns {this} Active marker scope.
   */
  width(value) {
    writeAnnotationValue(this, "width", value);

    return this;
  }

  /**
   * Chooses a named marker line pattern.
   *
   * @param {"solid" | "dashed" | "dotted"} value - Built-in line pattern.
   * @returns {this} Active marker scope.
   */
  lineStyle(value) {
    writeAnnotationValue(this, "lineStyle", value);

    return this;
  }

  /**
   * Chooses an explicit marker dash pattern.
   *
   * @param {readonly number[]} pattern - Alternating dash and gap lengths.
   * @returns {this} Active marker scope.
   */
  dash(pattern) {
    writeAnnotationValue(this, "dash", pattern);

    return this;
  }
}

/**
 * Configures range-region presentation.
 */
class RegionBuilder extends AnnotationBuilder {
  /**
   * Creates an active region callback scope.
   *
   * @param {object} record - Detached region input.
   */
  constructor(record) {
    super(record, "Region");
  }
}

/**
 * Configures date formatting shared by temporal tooltips.
 */
class DateTooltipBuilder {
  /**
   * Creates an active date-aware tooltip scope.
   *
   * @param {object} record - Detached tooltip formatter record.
   * @param {string} name - Public scope name used by expiry errors.
   */
  constructor(record, name) {
    initializeScope(this, record, name);
  }

  /**
   * Formats calendar dates shown by the tooltip.
   *
   * @param {(date: Date) => string} formatter - Synchronous date formatter.
   * @returns {this} Active temporal tooltip scope.
   */
  formatDate(formatter) {
    writeTemporalValue(this, "formatDate", formatter);

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
    writeTemporalValue(this, "formatValue", formatter);

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
    writeTemporalValue(this, "formatDuration", formatter);

    return this;
  }
}

/**
 * Invokes a scoped configurator and expires its builder on every exit path.
 *
 * @param {object} scope - Callback-only builder.
 * @param {(scope: object) => void} configure - User configurator.
 * @returns {void} Callback return values are deliberately ignored.
 */
function runScope(scope, configure) {
  try {
    configure(scope);
  } finally {
    expireScope(scope);
  }
}

export {
  AxisBuilder,
  BarDatasetBuilder,
  DatasetBuilder,
  HeatmapTooltipBuilder,
  LineDatasetBuilder,
  MarkerBuilder,
  RegionBuilder,
  SeriesTooltipBuilder,
  TimesheetTooltipBuilder,
  runScope,
};
