import { SeriesChartBuilder } from "./Builder.js";
import { configuredDataset } from "./BuilderArguments.js";
import { DatasetBuilder } from "./BuilderScopes.js";
import { appendBuilderDataset, writeBuilderOption } from "./BuilderState.js";

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
    return appendBuilderDataset(
      this,
      configuredDataset(
        [
          first,
          second,
          third,
        ],
        DatasetBuilder,
      ),
    );
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
    return writeBuilderOption(this, "maxSlices", value);
  }

  /**
   * Rotates the first sector around the circle.
   *
   * @param {number} degrees - Finite clockwise angle in degrees.
   * @returns {this} Current builder.
   */
  startAngle(degrees) {
    return writeBuilderOption(this, "startAngle", degrees);
  }

  /**
   * Chooses angular spacing between sectors.
   *
   * @param {number} degrees - Finite gap angle below one circle.
   * @returns {this} Current builder.
   */
  padAngle(degrees) {
    return writeBuilderOption(this, "padAngle", degrees);
  }

  /**
   * Chooses sector corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  cornerRadius(value) {
    return writeBuilderOption(this, "cornerRadius", value);
  }
}

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
    return writeBuilderOption(this, "maxSlices", value);
  }

  /**
   * Chooses percentage-segment corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  radius(value) {
    return writeBuilderOption(this, "radius", value);
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
    return writeBuilderOption(this, "padAngle", degrees);
  }

  /**
   * Chooses polar-sector corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  cornerRadius(value) {
    return writeBuilderOption(this, "cornerRadius", value);
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
    return writeBuilderOption(this, "strokeWidth", value);
  }
}

export { PercentageChartBuilder, PolarAreaChartBuilder, RadarChartBuilder, SectorChartBuilder };
