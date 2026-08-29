import { copyBuilderValue } from "./BuilderState.js";
import { validateScopedValue } from "./BuilderValidation.js";

const annotations = new WeakMap();

/**
 * Registers one annotation callback scope against a detached input record.
 *
 * @param {object} scope - Marker or region builder passed to caller code.
 * @param {object} record - Annotation record being configured.
 * @param {string} name - Public scope name used by expiry errors.
 * @returns {void} The callback scope becomes active.
 */
function initializeAnnotation(scope, record, name) {
  annotations.set(scope, { record, name, active: true });
}

/**
 * Reads an annotation record while its callback remains active.
 *
 * @param {object} scope - Marker or region builder.
 * @returns {object} Detached annotation record.
 * @throws {TypeError} When caller code retained the scope after its callback.
 */
function annotationRecord(scope) {
  const entry = annotations.get(scope);

  if (!entry?.active) {
    throw new TypeError(`${entry?.name ?? "Annotation"} scope has expired`);
  }

  return entry.record;
}

/**
 * Writes one copied annotation property.
 *
 * @param {object} scope - Active annotation builder.
 * @param {string} name - Target property name.
 * @param {unknown} value - Caller-controlled property value.
 * @returns {void} The scoped override is retained.
 */
function writeAnnotation(scope, name, value) {
  validateScopedValue(name, value);
  annotationRecord(scope)[name] = copyBuilderValue(value);
}

/**
 * Common annotation presentation shared by markers and regions.
 */
class AnnotationBuilder {
  /**
   * Chooses the annotation's primary color.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active annotation scope.
   */
  color(value) {
    writeAnnotation(this, "color", value);

    return this;
  }

  /**
   * Chooses annotation opacity.
   *
   * @param {number} value - Opacity from zero through one.
   * @returns {this} Active annotation scope.
   */
  opacity(value) {
    writeAnnotation(this, "opacity", value);

    return this;
  }

  /**
   * Places the annotation label along its visual extent.
   *
   * @param {"start" | "center" | "end"} value - Logical label position.
   * @returns {this} Active annotation scope.
   */
  labelPosition(value) {
    writeAnnotation(this, "labelPosition", value);

    return this;
  }

  /**
   * Chooses annotation label color independently from its geometry.
   *
   * @param {string} value - Supported CSS color.
   * @returns {this} Active annotation scope.
   */
  labelColor(value) {
    writeAnnotation(this, "labelColor", value);

    return this;
  }

  /**
   * Chooses whether annotation values expand automatic domains.
   *
   * @param {boolean} isIncluded - Whether the annotation participates in domain calculation.
   * @returns {this} Active annotation scope.
   */
  includeInDomain(isIncluded) {
    writeAnnotation(this, "includeInDomain", isIncluded);

    return this;
  }

  /**
   * Formats visible and accessible annotation labels.
   *
   * @param {(...values: unknown[]) => string} formatter - Synchronous label formatter.
   * @returns {this} Active annotation scope.
   */
  formatLabel(formatter) {
    writeAnnotation(this, "formatLabel", formatter);

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
    super();
    initializeAnnotation(this, record, "Marker");
  }

  /**
   * Chooses marker stroke width.
   *
   * @param {number} value - Width in non-scaling CSS pixels.
   * @returns {this} Active marker scope.
   */
  width(value) {
    writeAnnotation(this, "width", value);

    return this;
  }

  /**
   * Chooses a named marker line pattern.
   *
   * @param {"solid" | "dashed" | "dotted"} value - Built-in line pattern.
   * @returns {this} Active marker scope.
   */
  lineStyle(value) {
    writeAnnotation(this, "lineStyle", value);

    return this;
  }

  /**
   * Chooses an explicit marker dash pattern.
   *
   * @param {readonly number[]} pattern - Alternating dash and gap lengths.
   * @returns {this} Active marker scope.
   */
  dash(pattern) {
    writeAnnotation(this, "dash", pattern);

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
    super();
    initializeAnnotation(this, record, "Region");
  }
}

/**
 * Invokes an annotation configurator and always expires its builder afterward.
 *
 * @param {object} scope - Marker or region callback builder.
 * @param {(scope: object) => void} configure - User configurator.
 * @returns {void} Callback return values are deliberately ignored.
 */
function runAnnotationScope(scope, configure) {
  try {
    configure(scope);
  } finally {
    annotations.get(scope).active = false;
  }
}

export { MarkerBuilder, RegionBuilder, runAnnotationScope };
