import { SeriesChartBuilder } from "./Builder.js";
import { configuredDataset } from "./BuilderArguments.js";
import { DatasetBuilder } from "./BuilderScopes.js";
import { appendBuilderDataset, writeBuilderOption } from "./BuilderState.js";

/**
 * Applies a shared slice limit while preserving fluent identity.
 *
 * @param {object} builder - Composition builder receiving the limit.
 * @param {number} value - Positive maximum visible item count.
 * @returns {object} The same builder for fluent chaining.
 */
function limitSlices(builder, value) {
  writeBuilderOption(builder, "maxSlices", value);

  return builder;
}

/**
 * Applies shared polar padding while preserving fluent identity.
 *
 * @param {object} builder - Polar builder receiving the gap.
 * @param {number} degrees - Finite angular gap.
 * @returns {object} The same builder for fluent chaining.
 */
function padSectors(builder, degrees) {
  writeBuilderOption(builder, "padAngle", degrees);

  return builder;
}

/**
 * Applies shared polar corner treatment while preserving fluent identity.
 *
 * @param {object} builder - Polar builder receiving the radius.
 * @param {number} value - Non-negative corner radius.
 * @returns {object} The same builder for fluent chaining.
 */
function roundSectors(builder, value) {
  writeBuilderOption(builder, "cornerRadius", value);

  return builder;
}

/**
 * Adds one-or-more numeric dataset authoring to radial and composition charts.
 */
class NumericSeriesBuilder extends SeriesChartBuilder {
  /**
   * Appends one numeric dataset with common local presentation.
   *
   * @param {unknown} first - Values, name, or advanced dataset input.
   * @param {unknown} [second] - Values, color, or configurator.
   * @param {unknown} [third] - Named dataset color or configurator.
   * @returns {this} Current builder.
   */
  dataset(first, second, third) {
    appendBuilderDataset(this, configuredDataset([first, second, third], DatasetBuilder));

    return this;
  }
}

/**
 * Authors pie and donut sector conventions shared by both circular forms.
 */
class SectorChartBuilder extends NumericSeriesBuilder {
  /**
   * Limits visible slices and combines the remainder.
   *
   * @param {number} value - Positive maximum slice count.
   * @returns {this} Current builder.
   */
  maxSlices(value) {
    return limitSlices(this, value);
  }

  /**
   * Rotates the first sector around the circle.
   *
   * @param {number} degrees - Finite clockwise angle in degrees.
   * @returns {this} Current builder.
   */
  startAngle(degrees) {
    writeBuilderOption(this, "startAngle", degrees);

    return this;
  }

  /**
   * Chooses angular spacing between sectors.
   *
   * @param {number} degrees - Finite gap angle below one circle.
   * @returns {this} Current builder.
   */
  padAngle(degrees) {
    return padSectors(this, degrees);
  }

  /**
   * Chooses sector corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  cornerRadius(value) {
    return roundSectors(this, value);
  }
}

/**
 * Authors a standard pie chart.
 */
class PieChartBuilder extends SectorChartBuilder {}

/**
 * Authors a ring-shaped donut chart.
 */
class DonutChartBuilder extends SectorChartBuilder {}

/**
 * Authors a compact percentage composition strip.
 */
class PercentageChartBuilder extends NumericSeriesBuilder {
  /**
   * Limits visible segments and combines the remainder.
   *
   * @param {number} value - Positive maximum segment count.
   * @returns {this} Current builder.
   */
  maxSlices(value) {
    writeBuilderOption(this, "maxSlices", value);

    return this;
  }

  /**
   * Chooses percentage-segment corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  radius(value) {
    writeBuilderOption(this, "radius", value);

    return this;
  }
}

/**
 * Authors radius-encoded polar-area sectors.
 */
class PolarAreaChartBuilder extends NumericSeriesBuilder {
  /**
   * Chooses angular spacing between polar sectors.
   *
   * @param {number} degrees - Finite gap angle below one circle.
   * @returns {this} Current builder.
   */
  padAngle(degrees) {
    writeBuilderOption(this, "padAngle", degrees);

    return this;
  }

  /**
   * Chooses polar-sector corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  cornerRadius(value) {
    writeBuilderOption(this, "cornerRadius", value);

    return this;
  }
}

/**
 * Authors comparable radial radar datasets.
 */
class RadarChartBuilder extends NumericSeriesBuilder {
  /**
   * Chooses radar polygon stroke width.
   *
   * @param {number} value - Non-negative width in CSS pixels.
   * @returns {this} Current builder.
   */
  strokeWidth(value) {
    writeBuilderOption(this, "strokeWidth", value);

    return this;
  }
}

export {
  DonutChartBuilder,
  PercentageChartBuilder,
  PieChartBuilder,
  PolarAreaChartBuilder,
  RadarChartBuilder,
};
