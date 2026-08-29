import { CartesianChartBuilder } from "./Builder.js";
import { configuredDataset } from "./BuilderArguments.js";
import { BarDatasetBuilder, DatasetBuilder, LineDatasetBuilder } from "./BuilderScopes.js";
import { appendBuilderDataset, writeBuilderOption, writeExplicitOption } from "./BuilderState.js";
import { validateBoolean } from "./BuilderValidation.js";

/**
 * Adds bar orientation, stacking, and radius conventions to Cartesian authoring.
 */
class BarChartBuilder extends CartesianChartBuilder {
  /**
   * Appends one bar dataset with a bar-specific callback scope.
   *
   * @param {unknown} first - Values, name, or advanced dataset input.
   * @param {unknown} [second] - Values, color, or configurator.
   * @param {unknown} [third] - Named dataset color or configurator.
   * @returns {this} Current builder.
   */
  dataset(first, second, third) {
    appendBuilderDataset(this, configuredDataset([first, second, third], BarDatasetBuilder));

    return this;
  }

  /**
   * Chooses horizontal bar orientation.
   *
   * @param {boolean} [isEnabled=true] - Whether bars grow horizontally.
   * @returns {this} Current builder.
   */
  horizontal(isEnabled = true) {
    validateBoolean(isEnabled, "horizontal");
    writeBuilderOption(this, "orientation", isEnabled ? "horizontal" : "vertical");

    return this;
  }

  /**
   * Chooses stacked rather than grouped bars.
   *
   * @param {boolean} [isEnabled=true] - Whether datasets stack at each category.
   * @returns {this} Current builder.
   */
  stacked(isEnabled = true) {
    writeBuilderOption(this, "stacked", isEnabled);

    return this;
  }

  /**
   * Chooses whole-chart bar corner radius.
   *
   * @param {number} value - Radius in CSS pixels.
   * @returns {this} Current builder.
   */
  radius(value) {
    writeBuilderOption(this, "radius", value);

    return this;
  }
}

/**
 * Authors independently positioned scatter datasets.
 */
class ScatterChartBuilder extends CartesianChartBuilder {
  /**
   * Appends one scatter dataset with common dataset capabilities.
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

  /**
   * Chooses scatter-dot visibility.
   *
   * @param {boolean} visible - Whether scatter marks are displayed.
   * @returns {this} Current builder.
   */
  dots(visible) {
    writeExplicitOption(this, "dots", visible);

    return this;
  }
}

/**
 * Authors radius-encoded bubble datasets.
 */
class BubbleChartBuilder extends ScatterChartBuilder {}

/**
 * Authors explicitly typed datasets for the mixed Cartesian grammar.
 */
class MixedChartBuilder extends CartesianChartBuilder {
  /**
   * Appends a line dataset without requiring an object type tag.
   *
   * @param {string} name - Human-readable series name.
   * @param {readonly number[]} values - Ordered line values.
   * @param {string | ((dataset: LineDatasetBuilder) => void)} [colorOrConfigure] - Local line presentation.
   * @returns {this} Current builder.
   */
  line(name, values, colorOrConfigure) {
    const dataset = configuredDataset([name, values, colorOrConfigure], LineDatasetBuilder);
    appendBuilderDataset(this, { ...dataset, chartType: "line" });

    return this;
  }

  /**
   * Appends a bar dataset without requiring an object type tag.
   *
   * @param {string} name - Human-readable series name.
   * @param {readonly number[]} values - Ordered bar values.
   * @param {string | ((dataset: BarDatasetBuilder) => void)} [colorOrConfigure] - Local bar presentation.
   * @returns {this} Current builder.
   */
  bar(name, values, colorOrConfigure) {
    const dataset = configuredDataset([name, values, colorOrConfigure], BarDatasetBuilder);
    appendBuilderDataset(this, { ...dataset, chartType: "bar" });

    return this;
  }

  /**
   * Appends a scatter dataset without requiring an object type tag.
   *
   * @param {string} name - Human-readable series name.
   * @param {readonly unknown[]} values - Ordered scatter coordinates.
   * @param {string | ((dataset: DatasetBuilder) => void)} [colorOrConfigure] - Local scatter presentation.
   * @returns {this} Current builder.
   */
  scatter(name, values, colorOrConfigure) {
    const dataset = configuredDataset([name, values, colorOrConfigure], DatasetBuilder);
    appendBuilderDataset(this, { ...dataset, chartType: "scatter" });

    return this;
  }

  /**
   * Appends an advanced object dataset whose type selects callback capabilities.
   *
   * @param {object} input - Dataset input containing a required chart type.
   * @param {(dataset: object) => void} [configure] - Type-specific local configurator.
   * @returns {this} Current builder.
   */
  dataset(input, configure) {
    const scopes = { line: LineDatasetBuilder, bar: BarDatasetBuilder, scatter: DatasetBuilder };
    const Scope = scopes[input?.chartType];

    if (!Scope) {
      throw new TypeError("Mixed dataset chartType must be line, bar, or scatter");
    }

    appendBuilderDataset(this, configuredDataset([input, configure], Scope));

    return this;
  }

  /**
   * Enables gradient areas for every eligible mixed line dataset.
   *
   * @param {boolean | object} [isEnabled=true] - Gradient switch or opacity endpoints.
   * @returns {this} Current builder.
   */
  gradient(isEnabled = true) {
    writeBuilderOption(this, "gradient", isEnabled);

    return this;
  }
}

export { BarChartBuilder, BubbleChartBuilder, MixedChartBuilder, ScatterChartBuilder };
