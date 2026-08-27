import {
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  MAJOR_GRID_DIVISIONS,
  VALUE_LABEL_GAP,
} from "../support/Constants.js";
import { formatNumber, labelElement, wrappedLabelElement } from "../support/Dom.js";
import { requireFiniteNumber } from "../support/Normalize.js";

/**
 * Renders Cartesian axes, annotations, grid lines, and labels.
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
   * @param {import("./SvgSurface.js").default} state.surface - Owned SVG drawing surface.
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
    if (this.#chart.options.showGrid) {
      this.#renderGrid();
    }
    this.#renderRegions();
    if (this.#chart.options.showAxes) {
      this.#renderAxis();
    }
  }

  /**
   * Renders markers and labels over data marks.
   *
   * @returns {void} Foreground Cartesian presentation is appended to the chart SVG.
   */
  renderForeground() {
    this.#renderMarkers();
    if (this.#chart.options.showLabels) {
      this.#renderValueLabels();
      this.#renderCategoryLabels();
    }
  }

  /**
   * Renders configured value ranges behind Cartesian data marks.
   *
   * @returns {void} Region rectangles are appended to the chart SVG.
   */
  #renderRegions() {
    const { bottom, left, right, top } = this.#layout.frame;
    const regions = this.#chart.source?.yRegions ?? [];
    for (const region of regions) {
      requireFiniteNumber(region.start, "Region start");
      requireFiniteNumber(region.end, "Region end");
      const start = this.#layout.valueAt(region.start);
      const end = this.#layout.valueAt(region.end);
      const attributes = this.#layout.isHorizontal
        ? { x: Math.min(start, end), y: top, width: Math.abs(end - start), height: bottom - top }
        : { x: left, y: Math.min(start, end), width: right - left, height: Math.abs(end - start) };
      this.#surface.append("rect", {
        ...attributes,
        class: "charts2-region",
        "aria-hidden": "true",
      });
    }
  }

  /**
   * Renders configured reference lines over Cartesian data marks.
   *
   * @returns {void} Marker lines and optional labels are appended to the chart SVG.
   */
  #renderMarkers() {
    const { bottom, left, right, top } = this.#layout.frame;
    const markers = this.#chart.source?.yMarkers ?? [];
    for (const marker of markers) {
      requireFiniteNumber(marker.value, "Marker value");
      const position = this.#layout.valueAt(marker.value);
      const attributes = this.#layout.isHorizontal
        ? { x1: position, y1: top, x2: position, y2: bottom }
        : { x1: left, y1: position, x2: right, y2: position };
      this.#surface.append("line", { ...attributes, class: "charts2-marker" });
      if (marker.label) {
        const labelAttributes = this.#layout.isHorizontal
          ? { x: position + 4, y: top + 10, class: "charts2-annotation" }
          : { x: right, y: position - 4, class: "charts2-annotation", "text-anchor": "end" };
        this.#surface.text(marker.label, labelAttributes);
      }
    }
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
            y: bottom + this.#layout.frame.padding - 7,
            class: "charts2-label charts2-value-label",
            "text-anchor": "middle",
          }
        : {
            x: this.#layout.isYAxisRight ? right + VALUE_LABEL_GAP : left - VALUE_LABEL_GAP,
            y: position + 3,
            class: "charts2-label charts2-value-label",
            "text-anchor": this.#layout.isYAxisRight ? "start" : "end",
          };
      this.#surface.text(formatNumber(value), attributes);
    }
  }

  /**
   * Draws major grid lines for both plot dimensions.
   *
   * @returns {void} Major grid lines are appended to the chart SVG.
   */
  #renderGrid() {
    const { bottom, left, right, top } = this.#layout.frame;
    for (let index = 0; index <= MAJOR_GRID_DIVISIONS; index += 1) {
      const ratio = index / MAJOR_GRID_DIVISIONS;
      const x = left + ratio * (right - left);
      const y = top + ratio * (bottom - top);
      const attributes = this.#layout.isHorizontal
        ? { x1: left, y1: y, x2: right, y2: y, class: "charts2-grid charts2-grid-horizontal" }
        : { x1: x, y1: top, x2: x, y2: bottom, class: "charts2-grid charts2-grid-vertical" };
      this.#surface.append("line", { ...attributes, "aria-hidden": "true" });
    }
    const orderedTicks = this.#layout.isHorizontal ? this.#layout.values.ticks : this.#layout.values.ticks.toReversed();
    for (const value of orderedTicks) {
      const position = this.#layout.valueAt(value);
      const attributes = this.#layout.isHorizontal
        ? { x1: position, y1: top, x2: position, y2: bottom, class: "charts2-grid charts2-grid-vertical" }
        : { x1: left, y1: position, x2: right, y2: position, class: "charts2-grid charts2-grid-horizontal" };
      this.#surface.append("line", { ...attributes, "aria-hidden": "true" });
    }
  }

  /**
   * Draws the single visible baseline appropriate to chart orientation.
   *
   * @returns {void} One x- or y-axis line is appended to the chart SVG.
   */
  #renderAxis() {
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
    } else {
      this.#renderVerticalLabels();
    }
  }

  /**
   * Places wrapped labels beside horizontal bar rows.
   *
   * @returns {void} Horizontal category labels are appended to the chart SVG.
   */
  #renderHorizontalLabels() {
    const { bottom, left, right, top } = this.#layout.frame;
    const step = (bottom - top) / this.#chart.labels.length;
    for (const [index, value] of this.#layout.categories.labels.entries()) {
      const text = wrappedLabelElement({
        value,
        attributes: {
          x: this.#layout.isYAxisRight ? right + HORIZONTAL_LABEL_GAP : left - HORIZONTAL_LABEL_GAP,
          y: top + (index + 0.5) * step + 3,
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
  #renderVerticalLabels() {
    const { height, left, right } = this.#layout.frame;
    const step = (right - left) / Math.max(1, this.#chart.labels.length - 1);
    const stride = Math.max(1, Math.ceil(36 / Math.max(1, step)));
    const visibleIndexes = [];
    for (let index = 0; index < this.#chart.labels.length; index += stride) {
      visibleIndexes.push(index);
    }
    const lastIndex = this.#chart.labels.length - 1;
    if (visibleIndexes.at(-1) !== lastIndex) {
      visibleIndexes.pop();
      visibleIndexes.push(lastIndex);
    }
    for (const [visibleIndex, index] of visibleIndexes.entries()) {
      const placement = this.#verticalLabelPlacement({ visibleIndexes, visibleIndex, index, step });
      const formatted = this.#layout.categories.labels[index];
      const value = Array.isArray(formatted) ? formatted.join(" ") : formatted;
      const text = labelElement({
        value,
        attributes: {
          x: placement.x,
          y: height - 7,
          class: "charts2-label",
          "text-anchor": placement.anchor,
        },
        maxWidth: placement.width,
        fontSize: 9,
        originalValue: this.#chart.labels[index],
      });
      this.#surface.append(text);
    }
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
      return { x: plotLeft, anchor: "start", width: plotRight - plotLeft };
    }
    const position = plotLeft + index * step;
    const isFirst = visibleIndex === 0;
    const isLast = visibleIndex === visibleIndexes.length - 1;
    const previousPosition = visibleIndex > 0 ? plotLeft + visibleIndexes[visibleIndex - 1] * step : plotLeft;
    const nextPosition =
      visibleIndex < visibleIndexes.length - 1 ? plotLeft + visibleIndexes[visibleIndex + 1] * step : plotRight;
    if (isFirst) {
      return { x: plotLeft, anchor: "start", width: Math.max(24, (nextPosition - position) / 2 - 4) };
    }
    if (isLast) {
      return { x: plotRight, anchor: "end", width: Math.max(24, (position - previousPosition) / 2 - 4) };
    }
    return {
      x: position,
      anchor: "middle",
      width: Math.max(24, Math.min(position - previousPosition, nextPosition - position) - 8),
    };
  }
}
