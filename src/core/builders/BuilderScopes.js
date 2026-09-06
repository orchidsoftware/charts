import { copyInput } from "../../support/data/Copy.js";

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

/**
 * Attaches fresh private state to a callback scope.
 *
 * @param {object} scope - Callback-only builder.
 * @param {object} definition - Scope record and public name.
 * @returns {void} The scope becomes active.
 */
function initializeScope(scope, definition) {
  records.set(scope, { ...definition, active: true });
}

/**
 * Reads callback state or reproduces the public expiry failure.
 *
 * @param {object} scope - Callback-only builder.
 * @returns {object} Active private scope state.
 * @throws {TypeError} When the receiver is not an active scope.
 */
function scopeState(scope) {
  const state = records.get(scope);

  if (!state?.active) {
    throw new TypeError(`${state?.name ?? "Builder"} scope has expired`);
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
  const state = scopeState(scope);
  state.record[name] = copyInput(value);
}

/**
 * Applies one field rule before writing into the active callback scope.
 *
 * @param {object} scope - Public callback scope.
 * @param {object} rule - Property name and shared validation function.
 * @param {unknown} value - Caller value.
 * @returns {object} The same scope for chaining.
 */
function validatedScopeValue(scope, rule, value) {
  rule.validate(value, rule.label ?? rule.name);
  writeScopeValue(scope, rule.name, value);

  return scope;
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
    return validatedScopeValue(this, { name: "color", validate: validateText }, value);
  }

  /**
   * Chooses dataset opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active dataset scope.
   */
  opacity(value) {
    return validatedScopeValue(this, { name: "opacity", validate: validateOpacity }, value);
  }

  /**
   * Formats this dataset's displayed values.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous display formatter.
   * @returns {this} Active dataset scope.
   */
  formatValue(formatter) {
    return validatedScopeValue(this, { name: "formatValue", validate: validateFunction }, formatter);
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
    return validatedScopeValue(
      this,
      { name: "tooltipFormatLabel", label: "formatLabel", validate: validateFunction },
      formatter,
    );
  }

  /**
   * Formats numeric values shown by the tooltip.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous value formatter.
   * @returns {this} Active tooltip scope.
   */
  formatValue(formatter) {
    return tooltipValue(this, formatter);
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
    writeScopeValue(this, "yAxisPosition", value);

    return this;
  }

  /**
   * Formats numeric value-axis ticks.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous tick formatter.
   * @returns {this} Active axis scope.
   */
  formatValue(formatter) {
    return validatedScopeValue(this, { name: "axisFormatValue", validate: validateFunction }, formatter);
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
    return validatedScopeValue(this, { name: "color", validate: validateText }, value);
  }

  /**
   * Chooses annotation opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active annotation scope.
   */
  opacity(value) {
    return validatedScopeValue(this, { name: "opacity", validate: validateOpacity }, value);
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
    return validatedScopeValue(this, { name: "labelColor", validate: validateText }, value);
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
    return validatedScopeValue(this, { name: "formatLabel", validate: validateFunction }, formatter);
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
    return validatedScopeValue(
      this,
      { name: "tooltipFormatDate", label: "formatDate", validate: validateFunction },
      formatter,
    );
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
    return tooltipValue(this, formatter);
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
    return validatedScopeValue(
      this,
      { name: "tooltipFormatDuration", label: "formatDuration", validate: validateFunction },
      formatter,
    );
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
    records.get(scope).active = false;
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

/**
 * Applies the numeric formatter shared by series and heatmap tooltip scopes.
 *
 * @param {object} scope - Active callback scope.
 * @param {(value: number, context: object) => string} formatter - Public numeric formatter.
 * @returns {object} The same scope for fluent chaining.
 */
function tooltipValue(scope, formatter) {
  return validatedScopeValue(
    scope,
    { name: "tooltipFormatValue", label: "formatValue", validate: validateFunction },
    formatter,
  );
}
