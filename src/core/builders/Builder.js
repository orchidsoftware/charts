import { lineDataset, markerInput, regionInput } from "./BuilderArguments.js";
import { AxisBuilder, SeriesTooltipBuilder, runScope } from "./BuilderScopes.js";
import { builderOption, builderState, initializeBuilder } from "./BuilderState.js";

/**
 * Owns common chart authoring state without resolving DOM until `render()`.
 */
class CommonChartBuilder {
  /**
   * Creates a fresh single-use builder for one internal chart type.
   *
   * @param {string | Element} parent - Deferred chart host reference.
   * @param {string} type - Internal renderer type.
   * @param {(parent: string | Element, options: object) => object} mount - Mounted chart factory.
   */
  constructor(parent, type, mount) {
    initializeBuilder(this, { parent, type, mount });
  }

  /**
   * Sets a visible chart heading.
   *
   * @param {string} value - Human-readable chart title.
   * @returns {this} Current builder.
   */
  title(value) {
    return builderOption(this, "title", value);
  }

  /**
   * Sets accessible descriptive text.
   *
   * @param {string} value - Concise chart description.
   * @returns {this} Current builder.
   */
  description(value) {
    return builderOption(this, "description", value);
  }

  /**
   * Overrides the generated accessible name.
   *
   * @param {string} value - Accessible chart label.
   * @returns {this} Current builder.
   */
  ariaLabel(value) {
    return builderOption(this, "ariaLabel", value);
  }

  /**
   * Fixes chart width instead of following the parent.
   *
   * @param {number} value - Width in CSS pixels.
   * @returns {this} Current builder.
   */
  width(value) {
    return builderOption(this, "width", value);
  }

  /**
   * Chooses chart height in CSS pixels.
   *
   * @param {number} value - Positive finite height.
   * @returns {this} Current builder.
   */
  height(value) {
    return builderOption(this, "height", value);
  }

  /**
   * Chooses the ordered whole-chart palette.
   *
   * @param {readonly string[]} values - Non-empty CSS color palette.
   * @returns {this} Current builder.
   */
  colors(values) {
    return builderOption(this, "colors", values);
  }

  /**
   * Configures tooltip visibility or scoped formatting.
   *
   * @param {boolean | ((tooltip: SeriesTooltipBuilder) => void)} value - Visibility switch or tooltip configurator.
   * @returns {this} Current builder.
   */
  tooltip(value) {
    if (typeof value !== "function") {
      builderState(this).explicitOption("tooltip", value);

      return this;
    }

    const tooltip = {};
    runScope(new SeriesTooltipBuilder(tooltip), value);
    const state = builderState(this);
    state.explicitOption("tooltip", true);

    if (tooltip.formatLabel !== undefined) {
      state.option("tooltipFormatLabel", tooltip.formatLabel);
    }

    if (tooltip.tooltipValue !== undefined) {
      state.option("tooltipFormatValue", tooltip.tooltipValue);
    }

    return this;
  }

  /**
   * Enables persistent selection and registers its callback.
   *
   * @param {(selection: object | undefined) => void} callback - Selection observer.
   * @returns {this} Current builder.
   */
  onSelect(callback) {
    return builderOption(this, "onSelect", callback);
  }

  /**
   * Validates, mounts, and consumes this builder after a successful commit.
   *
   * @returns {import("./Chart.js").default} Mounted chart lifecycle façade.
   */
  render() {
    const state = builderState(this);
    const { parent, options, mount } = state.compile();
    const chart = mount(parent, options);
    state.consume();

    return chart;
  }
}

/**
 * Adds ordered category and dataset authoring to a common chart builder.
 */
class SeriesChartBuilder extends CommonChartBuilder {
  /**
   * Chooses legend visibility instead of the dataset-count convention.
   *
   * @param {boolean} visible - Whether the legend is displayed.
   * @returns {this} Current builder.
   */
  legend(visible) {
    builderState(this).explicitOption("legend", visible);

    return this;
  }

  /**
   * Replaces category labels with a defensive copy.
   *
   * @param {readonly string[]} values - Ordered category labels.
   * @returns {this} Current builder.
   */
  labels(values) {
    builderState(this).labels(values);

    return this;
  }

  /**
   * Formats chart values for display surfaces.
   *
   * @param {(value: number, context: object) => string} formatter - Synchronous value formatter.
   * @returns {this} Current builder.
   */
  formatValue(formatter) {
    return builderOption(this, "formatValue", formatter);
  }

  /**
   * Formats category labels for display surfaces.
   *
   * @param {(label: string | number, context: object) => string} formatter - Synchronous label formatter.
   * @returns {this} Current builder.
   */
  formatLabel(formatter) {
    return builderOption(this, "formatLabel", formatter);
  }
}

/**
 * Adds Cartesian presentation conventions shared by product-series charts.
 */
class CartesianChartBuilder extends SeriesChartBuilder {
  /**
   * Chooses axes visibility.
   *
   * @param {boolean} visible - Whether axes are displayed.
   * @returns {this} Current builder.
   */
  axes(visible) {
    builderState(this).explicitOption("axes", visible);

    return this;
  }

  /**
   * Chooses grid visibility.
   *
   * @param {boolean} visible - Whether grid lines are displayed.
   * @returns {this} Current builder.
   */
  grid(visible) {
    builderState(this).explicitOption("grid", visible);

    return this;
  }

  /**
   * Chooses visible value-label presentation.
   *
   * @param {boolean} visible - Whether value labels are displayed.
   * @returns {this} Current builder.
   */
  valueLabels(visible) {
    builderState(this).explicitOption("valueLabels", visible);

    return this;
  }

  /**
   * Applies or removes the compact product-chart presentation convention.
   *
   * @param {boolean} [isEnabled=true] - Whether frameless defaults apply.
   * @returns {this} Current builder.
   */
  frameless(isEnabled = true) {
    return builderOption(this, "frameless", isEnabled);
  }

  /**
   * Configures the value axis inside an automatically expiring scope.
   *
   * @param {(axis: AxisBuilder) => void} configure - Value-axis configurator.
   * @returns {this} Current builder.
   */
  yAxis(configure) {
    const axis = {};
    runScope(new AxisBuilder(axis), configure);
    const state = builderState(this);

    if (axis.position !== undefined) {
      state.option("yAxisPosition", axis.position);
    }

    if (axis.axisValue !== undefined) {
      state.option("axisFormatValue", axis.axisValue);
    }

    return this;
  }

  /**
   * Appends one value marker using positional or object grammar.
   *
   * @param {unknown} first - Label or advanced marker input.
   * @param {unknown} [second] - Marker value or configurator.
   * @param {unknown} [third] - Marker color or configurator.
   * @returns {this} Current builder.
   */
  marker(first, second, third) {
    builderState(this).append("markers", markerInput(first, second, third));

    return this;
  }

  /**
   * Appends one value region using positional or object grammar.
   *
   * @param {unknown} first - Label or advanced region input.
   * @param {unknown} [second] - Numeric range or configurator.
   * @param {unknown} [third] - Region color or configurator.
   * @returns {this} Current builder.
   */
  region(first, second, third) {
    builderState(this).append("regions", regionInput(first, second, third));

    return this;
  }
}

/**
 * Implements the complete chart-wide LineChart fluent vocabulary.
 */
class LineChartBuilder extends CartesianChartBuilder {
  /**
   * Appends one line dataset using shorthand, named, or object grammar.
   *
   * @param {unknown} first - Values, name, or dataset input.
   * @param {unknown} [second] - Values, color, or configurator.
   * @param {unknown} [third] - Named dataset color or configurator.
   * @returns {this} Current builder.
   */
  dataset(first, second, third) {
    builderState(this).dataset(lineDataset(first, second, third));

    return this;
  }

  /**
   * Chooses line smoothing for every dataset unless locally overridden.
   *
   * @param {boolean} [isEnabled=true] - Whether smoothing is enabled.
   * @returns {this} Current builder.
   */
  smooth(isEnabled = true) {
    return builderOption(this, "smooth", isEnabled);
  }

  /**
   * Chooses point visibility for every line dataset.
   *
   * @param {boolean} visible - Whether points are displayed.
   * @returns {this} Current builder.
   */
  dots(visible) {
    builderState(this).explicitOption("dots", visible);

    return this;
  }

  /**
   * Chooses point radius for every line dataset.
   *
   * @param {number} value - Dot radius in CSS pixels.
   * @returns {this} Current builder.
   */
  dotSize(value) {
    return builderOption(this, "dotSize", value);
  }

  /**
   * Chooses stroke visibility for every line dataset.
   *
   * @param {boolean} visible - Whether line strokes are displayed.
   * @returns {this} Current builder.
   */
  line(visible) {
    return builderOption(this, "line", visible);
  }

  /**
   * Enables a solid area for every line dataset.
   *
   * @param {boolean} [isEnabled=true] - Whether area fills are enabled.
   * @returns {this} Current builder.
   */
  area(isEnabled = true) {
    return builderOption(this, "area", isEnabled);
  }

  /**
   * Enables a gradient area for every line dataset.
   *
   * @param {boolean | object} [isEnabled=true] - Gradient switch or opacity endpoints.
   * @returns {this} Current builder.
   */
  gradient(isEnabled = true) {
    return builderOption(this, "gradient", isEnabled);
  }

  /**
   * Chooses stroke width for every line dataset.
   *
   * @param {number} value - Stroke width in CSS pixels.
   * @returns {this} Current builder.
   */
  strokeWidth(value) {
    return builderOption(this, "strokeWidth", value);
  }
}

export { CartesianChartBuilder, CommonChartBuilder, LineChartBuilder, SeriesChartBuilder };
