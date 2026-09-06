import {
  ChartType,
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  VALUE_LABEL_GAP,
} from "../../support/Constants.js";
import { labelElement, wrappedLabelElement } from "../../support/presentation/TextLayout.js";

const VALUE_LABEL_BASELINE_OFFSET = 7;
const VALUE_LABEL_CENTER_OFFSET = 3;
const CATEGORY_MIDPOINT = 0.5;
const CATEGORY_LABEL_BASELINE_OFFSET = 3;
const TARGET_CATEGORY_LABEL_SPACING = 36;
const CATEGORY_LABEL_BOTTOM_OFFSET = 7;
const MINIMUM_CATEGORY_LABEL_WIDTH = 24;
const CATEGORY_LABEL_SIDE_GAP = 4;
const CATEGORY_LABEL_TOTAL_GAP = 8;

/**
 * Names a visible category label's relationship to the viewport edges.
 *
 * @param {number} index - Position in the sampled visible-label collection.
 * @param {number} count - Number of visible category labels.
 * @returns {"first" | "middle" | "last"} Edge-aware placement role.
 */
function verticalLabelEdge(index, count) {
  if (index === 0) {
    return "first";
  }

  return index === count - 1 ? "last" : "middle";
}

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
            class: "charts2-label charts2-value-label",
            "text-anchor": this.#valueLabelAnchor(position),
          }
        : {
            x: this.#layout.isYAxisRight ? right + VALUE_LABEL_GAP : left - VALUE_LABEL_GAP,
            y: position + VALUE_LABEL_CENTER_OFFSET,
            class: "charts2-label charts2-value-label",
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
        ? { x1: position, y1: top, x2: position, y2: bottom, class: "charts2-grid charts2-grid-vertical" }
        : { x1: left, y1: position, x2: right, y2: position, class: "charts2-grid charts2-grid-horizontal" };

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
      ? { x1: axisX, y1: top, x2: axisX, y2: bottom, class: "charts2-axis charts2-y-axis" }
      : { x1: left, y1: bottom, x2: right, y2: bottom, class: "charts2-axis charts2-x-axis" };

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
          class: "charts2-label",
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
  // eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
  #renderVerticalLabels() {
    const { bottom, padding, left, right } = this.#layout.frame;
    const shouldCenterCategories = this.#layout.type !== ChartType.LINE;
    const intervals = shouldCenterCategories ? this.#chart.labels.length : this.#chart.labels.length - 1;
    const step = (right - left) / Math.max(1, intervals);
    const stride = Math.max(1, Math.ceil(TARGET_CATEGORY_LABEL_SPACING / Math.max(1, step)));
    const visibleIndexes = [];

    for (let index = 0; index < this.#chart.labels.length; index += stride) {
      visibleIndexes.push(index);
    }

    const lastIndex = this.#chart.labels.length - 1;

    if (visibleIndexes.at(-1) !== lastIndex) {
      visibleIndexes.pop();
      visibleIndexes.push(lastIndex);
    }

    for (const [
      visibleIndex,
      index,
    ] of visibleIndexes.entries()) {
      const placement = shouldCenterCategories
        ? this.#centeredLabelPlacement({ visibleIndexes, visibleIndex, index })
        : this.#verticalLabelPlacement({ visibleIndexes, visibleIndex, index, step });

      const formatted = this.#layout.categories.labels[index];
      const value = Array.isArray(formatted) ? formatted.join(" ") : formatted;

      const text = labelElement({
        value,
        attributes: {
          x: placement.x,
          y: bottom + padding - CATEGORY_LABEL_BOTTOM_OFFSET,
          class: "charts2-label",
          "text-anchor": placement.anchor,
        },
        measurement: { maxWidth: placement.width },
        originalValue: this.#chart.labels[index],
      });

      this.#surface.append(text);
    }
  }

  /**
   * Centers a category label on the same slot or point used by its mark.
   *
   * @param {object} state - Visible indexes and the current sampled label.
   * @param {number[]} state.visibleIndexes - Ordered source indexes that remain visible.
   * @param {number} state.visibleIndex - Position in the sampled visible collection.
   * @param {number} state.index - Source category index.
   * @returns {{x: number, anchor: string, width: number}} Bounded centered label placement.
   */
  #centeredLabelPlacement({ visibleIndexes, visibleIndex, index }) {
    const { left: plotLeft, right: plotRight } = this.#layout.frame;
    const position = this.#layout.categoryAt(index);

    if (visibleIndexes.length === 1) {
      return {
        x: position,
        anchor: "middle",
        width: plotRight - plotLeft,
      };
    }

    const previousBoundary =
      visibleIndex === 0
        ? plotLeft
        : (this.#layout.categoryAt(visibleIndexes[visibleIndex - 1]) + position) / 2;

    const nextBoundary =
      visibleIndex === visibleIndexes.length - 1
        ? plotRight
        : (position + this.#layout.categoryAt(visibleIndexes[visibleIndex + 1])) / 2;

    return {
      x: position,
      anchor: "middle",
      width: Math.max(
        MINIMUM_CATEGORY_LABEL_WIDTH,
        2 * Math.min(position - previousBoundary, nextBoundary - position) - CATEGORY_LABEL_TOTAL_GAP,
      ),
    };
  }

  /**
   * Calculates alignment and width for one sampled vertical category label.
   *
   * @param {object} state - Visible indexes, current positions, and horizontal step.
   * @param {number[]} state.visibleIndexes - Ordered category indexes selected for display.
   * @param {number} state.visibleIndex - Position within the displayed-index collection.
   * @param {number} state.index - Original category index represented by the label.
   * @param {number} state.step - Horizontal distance between adjacent categories.
   * @returns {{x: number, anchor: string, width: number}} Edge-aware label placement.
   */
  #verticalLabelPlacement({ visibleIndexes, visibleIndex, index, step }) {
    const { left: plotLeft, right: plotRight } = this.#layout.frame;

    if (visibleIndexes.length === 1) {
      return {
        x: plotLeft,
        anchor: "start",
        width: plotRight - plotLeft,
      };
    }

    const position = plotLeft + index * step;
    const previousPosition = visibleIndex > 0 ? plotLeft + visibleIndexes[visibleIndex - 1] * step : plotLeft;

    const nextPosition =
      visibleIndex < visibleIndexes.length - 1
        ? plotLeft + visibleIndexes[visibleIndex + 1] * step
        : plotRight;

    const edgePlacement = this.#edgeVerticalLabelPlacement({
      position,
      previousPosition,
      nextPosition,
      edge: verticalLabelEdge(visibleIndex, visibleIndexes.length),
    });

    if (edgePlacement) {
      return edgePlacement;
    }

    return {
      x: position,
      anchor: "middle",
      width: Math.max(
        MINIMUM_CATEGORY_LABEL_WIDTH,
        Math.min(position - previousPosition, nextPosition - position) - CATEGORY_LABEL_TOTAL_GAP,
      ),
    };
  }

  /**
   * Resolves the asymmetric placement used by the first and last category labels.
   *
   * @param {object} geometry - Current and neighboring sampled positions.
   * @param {number} geometry.position - Current label position.
   * @param {number} geometry.previousPosition - Previous sampled label position.
   * @param {number} geometry.nextPosition - Next sampled label position.
   * @param {"first" | "middle" | "last"} geometry.edge - Position within the sampled collection.
   * @returns {{x: number, anchor: string, width: number} | null} Edge placement or null for middle labels.
   */
  #edgeVerticalLabelPlacement({ position, previousPosition, nextPosition, edge }) {
    const { left: plotLeft, right: plotRight } = this.#layout.frame;

    if (edge === "first") {
      return {
        x: plotLeft,
        anchor: "start",
        width: Math.max(
          MINIMUM_CATEGORY_LABEL_WIDTH,
          (nextPosition - position) / 2 - CATEGORY_LABEL_SIDE_GAP,
        ),
      };
    }

    if (edge === "last") {
      return {
        x: plotRight,
        anchor: "end",
        width: Math.max(
          MINIMUM_CATEGORY_LABEL_WIDTH,
          (position - previousPosition) / 2 - CATEGORY_LABEL_SIDE_GAP,
        ),
      };
    }

    return null;
  }
}
