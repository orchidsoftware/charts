import {
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  VALUE_LABEL_GAP,
} from "../../support/Constants.js";
import { labelElement, wrappedLabelElement } from "../../support/presentation/TextLayout.js";

import { categoryAxisLabels } from "./CategoryAxisLabels.js";

const CATEGORY_MIDPOINT = 0.5;
const AXIS_LABEL_GAP = 7;
const CATEGORY_CLASS = "orchid-charts-label";
const WRAPPED_CLASS = "orchid-charts-label orchid-charts-multiline-label";
const VALUE_CLASS = "orchid-charts-label orchid-charts-value-label";

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
   * Contains endpoint glyph overhangs without changing a tick's logical anchor.
   *
   * @param {number} position - Numeric tick position.
   * @param {object} bounds - Actual value label glyph bounds.
   * @returns {number} Bounded native SVG anchor coordinate.
   */
  #valueLabelX(position, bounds) {
    const anchor = this.#valueLabelAnchor(position);
    const offsets = { start: 0, middle: bounds.advance / 2, end: bounds.advance };
    const offset = offsets[anchor];

    return Math.max(
      this.#layout.frame.left - bounds.x + offset,
      Math.min(position, this.#layout.frame.right - bounds.x - bounds.width + offset),
    );
  }

  /**
   * Places formatted numeric labels along the active value axis.
   *
   * @returns {void} Tick labels are appended to the chart SVG.
   */
  #renderValueLabels() {
    const { bottom, left, right } = this.#layout.frame;
    const scaleValues = this.#layout.values;
    const values = this.#visibleValueTicks();

    for (const value of values) {
      const position = this.#layout.valueAt(value);
      const label = scaleValues.labels.get(value);

      const bounds = this.#chart.typography
        .forClass("orchid-charts-label orchid-charts-value-label")
        .boundsOf(label);

      const attributes = this.#layout.isHorizontal
        ? {
            x: this.#valueLabelX(position, bounds),
            y: bottom + AXIS_LABEL_GAP - bounds.y,
            class: VALUE_CLASS,
            "text-anchor": this.#valueLabelAnchor(position),
          }
        : {
            x: this.#layout.isYAxisRight ? right + VALUE_LABEL_GAP : left - VALUE_LABEL_GAP,
            y: position - bounds.y - bounds.height / 2,
            class: VALUE_CLASS,
            "text-anchor": this.#layout.isYAxisRight ? "start" : "end",
          };

      this.#surface.text(scaleValues.labels.get(value), attributes);
    }
  }

  /**
   * Samples horizontal tick labels without changing their scale or grid.
   *
   * @returns {number[]} Numeric ticks whose formatted text fits the axis.
   */
  #visibleValueTicks() {
    const { ticks, labels } = this.#layout.values;
    const typography = this.#chart.typography.forClass(VALUE_CLASS);
    const ordered = this.#layout.isHorizontal ? ticks : ticks.toReversed();
    const frame = this.#layout.frame;
    const verticalInset = typography.lineHeight / 2;

    return categoryAxisLabels({
      labels: ordered.map((tick) => labels.get(tick)),
      positionAt: (index) => this.#layout.valueAt(ordered[index]),
      left: this.#layout.isHorizontal ? frame.left : frame.top - verticalInset,
      right: this.#layout.isHorizontal ? frame.right : frame.bottom + verticalInset,
      widthOf: this.#layout.isHorizontal ? typography.widthOf : (label) => typography.boundsOf(label).height,
    }).map(({ index }) => ordered[index]);
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
    const { bottom, top } = this.#layout.frame;
    const typography = this.#chart.typography.forClass(WRAPPED_CLASS);
    const step = (bottom - top) / this.#chart.labels.length;

    const visible = categoryAxisLabels({
      labels: this.#layout.categories.labels,
      positionAt: (index) => top + (index + CATEGORY_MIDPOINT) * step,
      left: top,
      right: bottom,
      widthOf: (value) => typography.boundsOf(value).height,
    });

    let previousBottom = -Infinity;

    for (const { index } of visible) {
      const candidate = this.#horizontalLabel(index, typography);

      if (candidate.top < Math.max(top, previousBottom + AXIS_LABEL_GAP) || candidate.bottom > bottom) {
        continue;
      }

      this.#surface.append(candidate.element);
      previousBottom = candidate.bottom;
    }
  }

  /**
   * Measures wrapped row labels before deciding which rows can display text.
   *
   * @param {number} index - Original row position.
   * @param {object} typography - Actual category CSS typography.
   * @returns {object} Detached label and its visual vertical interval.
   */
  #horizontalLabel(index, typography) {
    const { bottom, left, right, top } = this.#layout.frame;
    const step = (bottom - top) / this.#chart.labels.length;
    const value = this.#layout.categories.labels[index];
    const bounds = typography.boundsOf(Array.isArray(value) ? value.join(" ") : value);
    const y = top + (index + CATEGORY_MIDPOINT) * step - bounds.y - bounds.height / 2;

    const element = wrappedLabelElement({
      value,
      attributes: {
        x: this.#layout.isYAxisRight ? right + HORIZONTAL_LABEL_GAP : left - HORIZONTAL_LABEL_GAP,
        y,
        class: CATEGORY_CLASS,
        "text-anchor": this.#layout.isYAxisRight ? "start" : "end",
      },
      typography,
      maxWidth: this.#layout.categories.gutter - HORIZONTAL_LABEL_EDGE_INSET - HORIZONTAL_LABEL_GAP,
      originalValue: this.#chart.labels[index],
    });

    const lines = [
      ...element.querySelectorAll("tspan"),
    ];

    const halfSpacing = (typography.lineHeight * (lines.length - 1)) / 2;

    return {
      element,
      top: y - halfSpacing + typography.boundsOf(lines[0].textContent).y,
      bottom:
        y +
        halfSpacing +
        typography.boundsOf(lines.at(-1).textContent).y +
        typography.boundsOf(lines.at(-1).textContent).height,
    };
  }

  /**
   * Places sampled, edge-aware labels below a vertical category axis.
   *
   * @returns {void} Vertical category labels are appended to the chart SVG.
   */
  #renderVerticalLabels() {
    const { bottom, left, right } = this.#layout.frame;
    const typography = this.#chart.typography.forClass(CATEGORY_CLASS);

    const labels = categoryAxisLabels({
      labels: this.#layout.categories.labels,
      positionAt: (index) => this.#layout.categoryAt(index),
      widthOf: typography.widthOf,
      boundsOf: typography.boundsOf,
      left,
      right,
    });

    for (const { index, value, x, anchor } of labels) {
      const text = labelElement({
        value,
        attributes: {
          x,
          y: bottom + AXIS_LABEL_GAP - typography.boundsOf(value).y,
          class: CATEGORY_CLASS,
          "text-anchor": anchor,
        },
        measurement: { maxWidth: Math.max(0, right - left), widthOf: typography.widthOf },
        originalValue: this.#chart.labels[index],
      });

      this.#surface.append(text);
    }
  }
}
