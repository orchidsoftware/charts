import {
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  VALUE_LABEL_GAP,
} from "../../support/Constants.js";
import { labelElement, wrappedLabelElement } from "../../support/presentation/TextLayout.js";

import { categoryAxisLabels } from "./CategoryAxisLabels.js";

const VALUE_LABEL_BASELINE_OFFSET = 7;
const VALUE_LABEL_CENTER_OFFSET = 3;
const CATEGORY_MIDPOINT = 0.5;
const CATEGORY_LABEL_BASELINE_OFFSET = 3;
const CATEGORY_LABEL_BOTTOM_OFFSET = 7;

/**
 * Renders Cartesian axes, grid lines, and labels.
 */
export default class CartesianAxesRenderer {
  #chart;
  #layout;
  #surface;

  /**
   * Binds normalized chart state to one immutable Cartesian layout snapshot.
   *
   * @param {object} state - Collaborators required for one axes pass.
   * @param {object} state.chart - Frozen chart data and options.
   * @param {object} state.layout - Scales, bounds, and renderer flags resolved by `CartesianRenderer`.
   * @param {import("../SvgSurface.js").default} state.surface - Owned SVG drawing surface.
   */
  constructor({ chart, layout, surface }) {
    this.#chart = chart;
    this.#layout = layout;
    this.#surface = surface;
  }

  /**
   * Renders grid, configured regions, and the primary axis behind data marks.
   *
   * @returns {void} Background Cartesian presentation is appended to the chart SVG.
   */
  renderBackground() {
    if (this.#chart.options.grid) {
      this.#renderGrid();
    }
  }

  /**
   * Renders markers and labels over data marks.
   *
   * @returns {void} Foreground Cartesian presentation is appended to the chart SVG.
   */
  renderForeground() {
    if (!this.#chart.options.valueLabels) {
      return;
    }

    this.#renderValueLabels();
    this.#renderCategoryLabels();
  }

  /**
   * Keeps endpoint labels inside the horizontal value axis.
   *
   * @param {number} position - Scaled tick position.
   * @returns {string} SVG text anchor for the tick.
   */
  #valueLabelAnchor(position) {
    if (position === this.#layout.frame.left) {
      return "start";
    }

    return position === this.#layout.frame.right ? "end" : "middle";
  }

  /**
   * Places formatted numeric labels along the active value axis.
   *
   * @returns {void} Tick labels are appended to the chart SVG.
   */
  #renderValueLabels() {
    const { bottom, left, right } = this.#layout.frame;
    const scaleValues = this.#layout.values;
    const values = this.#layout.isHorizontal ? scaleValues.ticks : scaleValues.ticks.toReversed();

    for (const value of values) {
      const position = this.#layout.valueAt(value);

      const attributes = this.#layout.isHorizontal
        ? {
            x: position,
            y: bottom + this.#layout.frame.padding - VALUE_LABEL_BASELINE_OFFSET,
            class: "orchid-charts-label orchid-charts-value-label",
            "text-anchor": this.#valueLabelAnchor(position),
          }
        : {
            x: this.#layout.isYAxisRight ? right + VALUE_LABEL_GAP : left - VALUE_LABEL_GAP,
            y: position + VALUE_LABEL_CENTER_OFFSET,
            class: "orchid-charts-label orchid-charts-value-label",
            "text-anchor": this.#layout.isYAxisRight ? "start" : "end",
          };

      this.#surface.text(scaleValues.labels.get(value), attributes);
    }
  }

  /**
   * Draws guides only for the visible value-axis ticks.
   *
   * @returns {void} Major grid lines are appended to the chart SVG.
   */
  #renderGrid() {
    const { bottom, left, right, top } = this.#layout.frame;

    const orderedTicks = this.#layout.isHorizontal
      ? this.#layout.values.ticks
      : this.#layout.values.ticks.toReversed();

    for (const value of orderedTicks) {
      const position = this.#layout.valueAt(value);

      const attributes = this.#layout.isHorizontal
        ? {
            x1: position,
            y1: top,
            x2: position,
            y2: bottom,
            class: "orchid-charts-grid orchid-charts-grid-vertical",
          }
        : {
            x1: left,
            y1: position,
            x2: right,
            y2: position,
            class: "orchid-charts-grid orchid-charts-grid-horizontal",
          };

      this.#surface.append("line", {
        ...attributes,
        "data-tick": value,
        "aria-hidden": "true",
      });
    }
  }

  /**
   * Draws the single visible baseline appropriate to chart orientation.
   *
   * @returns {void} One x- or y-axis line is appended to the chart SVG.
   */
  renderAxis() {
    if (!this.#chart.options.axes) {
      return;
    }

    const { bottom, left, right, top } = this.#layout.frame;
    const axisX = this.#layout.isYAxisRight ? right : left;

    const attributes = this.#layout.isHorizontal
      ? { x1: axisX, y1: top, x2: axisX, y2: bottom, class: "orchid-charts-axis orchid-charts-y-axis" }
      : { x1: left, y1: bottom, x2: right, y2: bottom, class: "orchid-charts-axis orchid-charts-x-axis" };

    this.#surface.append("line", attributes);
  }

  /**
   * Places bounded category labels along the active category axis.
   *
   * @returns {void} Category labels are appended to the chart SVG.
   */
  #renderCategoryLabels() {
    if (this.#chart.labels.length === 0) {
      return;
    }

    if (this.#layout.isHorizontal) {
      this.#renderHorizontalLabels();

      return;
    }

    this.#renderVerticalLabels();
  }

  /**
   * Places wrapped labels beside horizontal bar rows.
   *
   * @returns {void} Horizontal category labels are appended to the chart SVG.
   */
  #renderHorizontalLabels() {
    const { bottom, left, right, top } = this.#layout.frame;
    const step = (bottom - top) / this.#chart.labels.length;

    for (const [
      index,
      value,
    ] of this.#layout.categories.labels.entries()) {
      const text = wrappedLabelElement({
        value,
        attributes: {
          x: this.#layout.isYAxisRight ? right + HORIZONTAL_LABEL_GAP : left - HORIZONTAL_LABEL_GAP,
          y: top + (index + CATEGORY_MIDPOINT) * step + CATEGORY_LABEL_BASELINE_OFFSET,
          class: "orchid-charts-label",
          "text-anchor": this.#layout.isYAxisRight ? "start" : "end",
        },
        maxWidth: this.#layout.categories.gutter - HORIZONTAL_LABEL_EDGE_INSET - HORIZONTAL_LABEL_GAP,
        originalValue: this.#chart.labels[index],
      });

      this.#surface.append(text);
    }
  }

  /**
   * Places sampled, edge-aware labels below a vertical category axis.
   *
   * @returns {void} Vertical category labels are appended to the chart SVG.
   */
  #renderVerticalLabels() {
    const { bottom, padding, left, right } = this.#layout.frame;

    const labels = categoryAxisLabels({
      labels: this.#layout.categories.labels,
      positionAt: (index) => this.#layout.categoryAt(index),
      left,
      right,
    });

    for (const { index, value, x, anchor, width } of labels) {
      const text = labelElement({
        value,
        attributes: {
          x,
          y: bottom + padding - CATEGORY_LABEL_BOTTOM_OFFSET,
          class: "orchid-charts-label",
          "text-anchor": anchor,
        },
        measurement: { maxWidth: width },
        originalValue: this.#chart.labels[index],
      });

      this.#surface.append(text);
    }
  }
}
