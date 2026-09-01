import { copyBuilderValue } from "./BuilderState.js";
import {
  validateBoolean,
  validateDash,
  validateFunction,
  validateGradient,
  validateLabelPosition,
  validateLineStyle,
  validateNumber,
  validateOpacity,
  validatePosition,
  validateText,
} from "./BuilderValidation.js";

const records = new WeakMap();

const ANNOTATION_PROPERTIES = new Set([
  "color",
  "opacity",
  "labelPosition",
  "labelColor",
  "includeInDomain",
  "formatLabel",
  "width",
  "lineStyle",
  "dash",
]);

const TOOLTIP_PROPERTIES = new Set([
  "formatDate",
  "formatDuration",
]);

/**
 * Owns one callback scope's record and lifetime.
 */
class ScopeState {
  #record;
  #name;
  #active = true;

  /**
   * Creates active state for one callback scope.
   *
   * @param {object} definition - Scope record and public name.
   * @param {object} definition.record - Detached record being configured.
   * @param {string} definition.name - Public scope name used by expiry errors.
   */
  constructor({ record, name }) {
    this.#record = record;
    this.#name = name;
  }

  /**
   * Writes a copied value while this scope remains active.
   *
   * @param {string} name - Record property being configured.
   * @param {unknown} value - Caller-controlled property value.
   * @returns {void} The record is updated in place.
   */
  write(name, value) {
    this.#assertActive();
    this.#record[name] = copyBuilderValue(value);
  }

  /**
   * Prevents every subsequent write through this callback scope.
   *
   * @returns {void} The scope becomes permanently inactive.
   */
  expire() {
    this.#active = false;
  }

  /**
   * Rejects access after the callback has finished.
   *
   * @returns {void} Active scopes continue unchanged.
   * @throws {TypeError} When the callback scope has expired.
   */
  #assertActive() {
    if (!this.#active) {
      throw new TypeError(`${this.#name} scope has expired`);
    }
  }
}

/**
 * Attaches fresh private state to a callback scope.
 *
 * @param {object} scope - Callback-only builder.
 * @param {object} definition - Scope record and public name.
 * @returns {void} The scope becomes active.
 */
function initializeScope(scope, definition) {
  records.set(scope, new ScopeState(definition));
}

/**
 * Reads callback state or reproduces the public expiry failure.
 *
 * @param {object} scope - Callback-only builder.
 * @param {string} fallbackName - Public name for invalid receivers.
 * @returns {ScopeState} Active private scope state.
 * @throws {TypeError} When the receiver is not an active scope.
 */
function scopeState(scope, fallbackName) {
  const state = records.get(scope);

  if (!state) {
    throw new TypeError(`${fallbackName} scope has expired`);
  }

  return state;
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
  let fallbackName = "Builder";

  if (ANNOTATION_PROPERTIES.has(name)) {
    fallbackName = "Annotation";
  }

  if (TOOLTIP_PROPERTIES.has(name)) {
    fallbackName = "Tooltip";
  }

  scopeState(scope, fallbackName).write(name, value);
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
    initializeScope(this, { record, name: "Dataset" });
  }

  /**
   * Chooses the dataset's explicit color.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active dataset scope.
   */
  color(value) {
    validateText(value, "color");
    scopeState(this, "Dataset").write("color", value);

    return this;
  }

  /**
   * Chooses dataset opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active dataset scope.
   */
  opacity(value) {
    validateOpacity(value, "opacity");
    scopeState(this, "Dataset").write("opacity", value);

    return this;
  }

  /**
   * Formats this dataset's displayed values.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous display formatter.
   * @returns {this} Active dataset scope.
   */
  formatValue(formatter) {
    validateFunction(formatter, "formatValue");
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
    validateGradient(isEnabled);
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
    validateBoolean(isEnabled, "smooth");
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
    validateBoolean(visible, "dots");
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
    validateNumber(value, "dotSize", 0);
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
    validateBoolean(visible, "line");
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
    validateBoolean(isEnabled, "area");
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
    validateNumber(value, "strokeWidth", 0);
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
    validateNumber(value, "radius", 0);
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
    initializeScope(this, { record, name: "Tooltip" });
  }

  /**
   * Formats category labels shown by the tooltip.
   *
   * @param {(label: string | number, context: object) => string} formatter - Synchronous label formatter.
   * @returns {this} Active tooltip scope.
   */
  formatLabel(formatter) {
    validateFunction(formatter, "formatLabel");
    scopeState(this, "Tooltip").write("formatLabel", formatter);

    return this;
  }

  /**
   * Formats numeric values shown by the tooltip.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous value formatter.
   * @returns {this} Active tooltip scope.
   */
  formatValue(formatter) {
    validateFunction(formatter, "tooltipValue");
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
    initializeScope(this, { record, name: "Y-axis" });
  }

  /**
   * Places the value axis on the requested side.
   *
   * @param {"left" | "right"} value - Logical axis position.
   * @returns {this} Active axis scope.
   */
  position(value) {
    validatePosition(value);
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
    validateFunction(formatter, "axisValue");
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
    initializeScope(this, { record, name });
  }

  /**
   * Chooses the annotation's primary color.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active annotation scope.
   */
  color(value) {
    validateText(value, "color");
    writeScopeValue(this, "color", value);

    return this;
  }

  /**
   * Chooses annotation opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active annotation scope.
   */
  opacity(value) {
    validateOpacity(value, "opacity");
    writeScopeValue(this, "opacity", value);

    return this;
  }

  /**
   * Places the annotation label along its visual extent.
   *
   * @param {"start" | "center" | "end"} value - Logical label position.
   * @returns {this} Active annotation scope.
   */
  labelPosition(value) {
    validateLabelPosition(value);
    writeScopeValue(this, "labelPosition", value);

    return this;
  }

  /**
   * Chooses annotation label color independently from its geometry.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active annotation scope.
   */
  labelColor(value) {
    validateText(value, "labelColor");
    writeScopeValue(this, "labelColor", value);

    return this;
  }

  /**
   * Chooses whether annotation values expand automatic domains.
   *
   * @param {boolean} isIncluded - Whether the annotation participates in domain calculation.
   * @returns {this} Active annotation scope.
   */
  includeInDomain(isIncluded) {
    validateBoolean(isIncluded, "includeInDomain");
    writeScopeValue(this, "includeInDomain", isIncluded);

    return this;
  }

  /**
   * Formats visible and accessible annotation labels.
   *
   * @param {(...values: unknown[]) => string} formatter - Synchronous label formatter.
   * @returns {this} Active annotation scope.
   */
  formatLabel(formatter) {
    validateFunction(formatter, "formatLabel");
    writeScopeValue(this, "formatLabel", formatter);

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
    validateNumber(value, "width", 0);
    writeScopeValue(this, "width", value);

    return this;
  }

  /**
   * Chooses a named marker line pattern.
   *
   * @param {"solid" | "dashed" | "dotted"} value - Built-in line pattern.
   * @returns {this} Active marker scope.
   */
  lineStyle(value) {
    validateLineStyle(value);
    writeScopeValue(this, "lineStyle", value);

    return this;
  }

  /**
   * Chooses an explicit marker dash pattern.
   *
   * @param {readonly number[]} pattern - Alternating dash and gap lengths.
   * @returns {this} Active marker scope.
   */
  dash(pattern) {
    validateDash(pattern);
    writeScopeValue(this, "dash", pattern);

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
    initializeScope(this, { record, name });
  }

  /**
   * Formats calendar dates shown by the tooltip.
   *
   * @param {(date: Date) => string} formatter - Synchronous date formatter.
   * @returns {this} Active temporal tooltip scope.
   */
  formatDate(formatter) {
    validateFunction(formatter, "formatDate");
    writeScopeValue(this, "formatDate", formatter);

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
    validateFunction(formatter, "formatValue");
    scopeState(this, "Heatmap tooltip").write("formatValue", formatter);

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
    validateFunction(formatter, "formatDuration");
    writeScopeValue(this, "formatDuration", formatter);

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
    scopeState(scope, "Builder").expire();
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
