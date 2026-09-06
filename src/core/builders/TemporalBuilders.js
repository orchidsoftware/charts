import { CommonChartBuilder } from "./Builder.js";
import { HeatmapTooltipBuilder, TimesheetTooltipBuilder } from "./BuilderScopes.js";
import { builderOption, builderState, builderTooltip } from "./BuilderState.js";
import { validateHeatmapPoints, validateTask } from "./BuilderValidation.js";

const MAXIMUM_POSITIONAL_TASK_ARGUMENTS = 3;

/**
 * Authors calendar heatmap points and intensity presentation.
 */
class RangedChartBuilder extends CommonChartBuilder {
  /**
   * Chooses an explicit range for a temporal chart.
   *
   * @param {Date | string | number} start - First visible temporal value.
   * @param {Date | string | number} end - Last visible temporal value.
   * @returns {this} Current builder.
   */
  range(start, end) {
    const state = builderState(this);
    state.data("start", start);

    state.data("end", end);

    return this;
  }

  /**
   * Chooses the family-specific mark corner radius.
   *
   * @param {number} value - Non-negative radius in CSS pixels.
   * @returns {this} Current builder.
   */
  radius(value) {
    return builderOption(this, "radius", value);
  }
}

/**
 * Authors calendar heatmap points and intensity presentation.
 */
class HeatmapChartBuilder extends RangedChartBuilder {
  /**
   * Rejects fixed height because calendar rows own the intrinsic heatmap height.
   *
   * @returns {never} Heatmaps always derive their height from width and date range.
   * @throws {TypeError} Heatmap height is not caller-configurable.
   */
  height() {
    throw new TypeError("Heatmap height is derived from its adaptive calendar layout");
  }

  /**
   * Replaces keyed daily activity values.
   *
   * @param {Readonly<Record<string | number, number>>} values - Calendar keys and finite counts.
   * @returns {this} Current builder.
   */
  points(values) {
    validateHeatmapPoints(values);

    builderState(this).data("points", values);

    return this;
  }

  /**
   * Names the unit appended to heatmap counts.
   *
   * @param {string} value - Human-readable count unit.
   * @returns {this} Current builder.
   */
  countLabel(value) {
    return builderOption(this, "countLabel", value);
  }

  /**
   * Configures tooltip visibility or heatmap formatting.
   *
   * @param {boolean | ((tooltip: HeatmapTooltipBuilder) => void)} value - Visibility switch or formatter scope.
   * @returns {this} Current builder.
   */
  tooltip(value) {
    return builderTooltip(this, value, HeatmapTooltipBuilder);
  }
}

/**
 * Authors task intervals for product planning views.
 */
class TimesheetChartBuilder extends RangedChartBuilder {
  /**
   * Appends a task using concise positional or advanced object grammar.
   *
   * @param {string | object} input - Task label or complete task input.
   * @param {Date | string | number} [start] - Positional task start.
   * @param {Date | string | number} [end] - Positional task end.
   * @returns {this} Current builder.
   */
  task(input, start, end) {
    if (arguments.length > MAXIMUM_POSITIONAL_TASK_ARGUMENTS) {
      throw new TypeError("task accepts an object or label, start, and end");
    }

    const task = typeof input === "string" ? { label: input, start, end } : input;
    validateTask(task);

    builderState(this).append("tasks", task);

    return this;
  }

  /**
   * Chooses axis visibility.
   *
   * @param {boolean} visible - Whether the time axis is displayed.
   * @returns {this} Current builder.
   */
  axes(visible) {
    return builderOption(this, "axes", visible);
  }

  /**
   * Chooses timeline-grid visibility.
   *
   * @param {boolean} visible - Whether time and row guides are displayed.
   * @returns {this} Current builder.
   */
  grid(visible) {
    return builderOption(this, "grid", visible);
  }

  /**
   * Chooses task-label visibility.
   *
   * @param {boolean} visible - Whether task labels are displayed.
   * @returns {this} Current builder.
   */
  valueLabels(visible) {
    return builderOption(this, "valueLabels", visible);
  }

  /**
   * Formats task dates across timesheet display surfaces.
   *
   * @param {(date: Date) => string} formatter - Synchronous date formatter.
   * @returns {this} Current builder.
   */
  formatDate(formatter) {
    return builderOption(this, "formatDate", formatter);
  }

  /**
   * Formats task durations across timesheet display surfaces.
   *
   * @param {(milliseconds: number) => string} formatter - Synchronous duration formatter.
   * @returns {this} Current builder.
   */
  formatDuration(formatter) {
    return builderOption(this, "formatDuration", formatter);
  }

  /**
   * Formats bottom-axis tick dates.
   *
   * @param {(date: Date) => string} formatter - Synchronous tick formatter.
   * @returns {this} Current builder.
   */
  formatTick(formatter) {
    return builderOption(this, "formatTick", formatter);
  }

  /**
   * Configures tooltip visibility or task formatting.
   *
   * @param {boolean | ((tooltip: TimesheetTooltipBuilder) => void)} value - Visibility switch or formatter scope.
   * @returns {this} Current builder.
   */
  tooltip(value) {
    return builderTooltip(this, value, TimesheetTooltipBuilder);
  }
}

export { HeatmapChartBuilder, TimesheetChartBuilder };
