import {
  ChartType,
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  MAJOR_GRID_DIVISIONS,
  VALUE_LABEL_GAP,
} from "../support/Constants.js";
import { labelElement, wrappedLabelElement } from "../support/Dom.js";
import { formatContext, formatterText, formatValue } from "../support/Formatting.js";
import { requireFiniteNumber } from "../support/Normalize.js";

const MARKER_LABEL_OFFSET = 4;
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
    if (this.#chart.options.grid) {
      this.#renderGrid();
    }

    this.#renderRegions();
    this.#renderMarkerLines();
    if (this.#chart.options.axes) {
      this.#renderAxis();
    }
  }

  /**
   * Renders markers and labels over data marks.
   *
   * @returns {void} Foreground Cartesian presentation is appended to the chart SVG.
   */
  renderForeground() {
    this.#renderRegionLabels();
    this.#renderMarkerLabels();
    if (this.#chart.options.valueLabels) {
      this.#renderValueLabels();
      this.#renderCategoryLabels();
    }
  }

  /**
   * Renders configured value ranges behind Cartesian data marks.
   *
   * @returns {void} Region rectangles are appended to the chart SVG.
   */
  // eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
  #renderRegions() {
    const { bottom, left, right, top } = this.#layout.frame;
    const regions = this.#chart.source.yRegions;

    for (const region of regions) {
      const [
        rangeStart,
        rangeEnd,
      ] = region.range;

      requireFiniteNumber(rangeStart, "Region start");
      requireFiniteNumber(rangeEnd, "Region end");
      const start = this.#layout.valueAt(rangeStart);
      const end = this.#layout.valueAt(rangeEnd);

      if (!region.includeInDomain && !this.#overlapsPlot(start, end)) {
        continue;
      }

      const boundedStart = this.#boundedValuePosition(start);
      const boundedEnd = this.#boundedValuePosition(end);

      const attributes = this.#layout.isHorizontal
        ? {
            x: Math.min(boundedStart, boundedEnd),
            y: top,
            width: Math.abs(boundedEnd - boundedStart),
            height: bottom - top,
          }
        : {
            x: left,
            y: Math.min(boundedStart, boundedEnd),
            width: right - left,
            height: Math.abs(boundedEnd - boundedStart),
          };

      this.#surface.append("rect", {
        ...attributes,
        fill: region.color,
        opacity: region.opacity,
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
  #renderMarkerLines() {
    const { bottom, left, right, top } = this.#layout.frame;
    const markers = this.#chart.source.yMarkers;

    for (const marker of markers) {
      requireFiniteNumber(marker.value, "Marker value");
      const position = this.#layout.valueAt(marker.value);

      if (!marker.includeInDomain && !this.#insidePlot(position)) {
        continue;
      }

      const attributes = this.#layout.isHorizontal
        ? { x1: position, y1: top, x2: position, y2: bottom }
        : { x1: left, y1: position, x2: right, y2: position };

      this.#surface.append("line", {
        ...attributes,
        stroke: marker.color,
        opacity: marker.opacity,
        "stroke-width": marker.width,
        "stroke-dasharray": marker.dash.join(" "),
        "vector-effect": "non-scaling-stroke",
        class: "charts2-marker",
      });
    }
  }

  /**
   * Renders region labels after datasets in stable call order.
   *
   * @returns {void} Visible region labels remain inside the plot.
   */
  #renderRegionLabels() {
    const regions = this.#chart.source.yRegions;

    for (const region of regions) {
      const positions = region.range.map((value) => this.#layout.valueAt(value));

      if (!region.includeInDomain && !this.#overlapsPlot(...positions)) {
        continue;
      }

      const label = region.formatLabel
        ? formatterText(
            region.formatLabel(
              region.label,
              Object.freeze([
                ...region.range,
              ]),
              formatContext(this.#chart.options, "accessibility"),
            ),
            "Region label",
          )
        : region.label;

      this.#surface.text(label, {
        ...this.#annotationLabelAttributes(region.labelPosition, positions),
        fill: region.labelColor,
      });
    }
  }

  /**
   * Renders marker labels after region labels in stable call order.
   *
   * @returns {void} Visible marker labels remain inside the plot.
   */
  #renderMarkerLabels() {
    const markers = this.#chart.source.yMarkers;

    for (const marker of markers) {
      const position = this.#layout.valueAt(marker.value);

      if (!marker.includeInDomain && !this.#insidePlot(position)) {
        continue;
      }

      const label = marker.formatLabel
        ? formatterText(
            marker.formatLabel(
              marker.label,
              marker.value,
              formatContext(this.#chart.options, "accessibility"),
            ),
            "Marker label",
          )
        : marker.label;

      this.#surface.text(label, {
        ...this.#annotationLabelAttributes(marker.labelPosition, [
          position,
        ]),
        fill: marker.labelColor,
      });
    }
  }

  /**
   * Resolves one logical annotation-label position for either orientation.
   *
   * @param {"start" | "center" | "end"} placement - Logical label placement.
   * @param {number[]} values - One marker coordinate or two region coordinates.
   * @returns {object} Bounded SVG text attributes.
   */
  // eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
  #annotationLabelAttributes(placement, values) {
    const { bottom, left, right, top } = this.#layout.frame;
    const value = this.#boundedValuePosition(values.reduce((sum, item) => sum + item, 0) / values.length);

    if (this.#layout.isHorizontal) {
      const y = this.#placementCoordinate(
        [
          bottom,
          (top + bottom) / 2,
          top,
        ],
        placement,
      );

      return {
        x: value + MARKER_LABEL_OFFSET,
        y,
        class: "charts2-annotation",
        "dominant-baseline": "middle",
      };
    }

    const x = this.#placementCoordinate(
      [
        left,
        (left + right) / 2,
        right,
      ],
      placement,
    );

    const anchor = this.#placementCoordinate(
      [
        "start",
        "middle",
        "end",
      ],
      placement,
    );

    return {
      x,
      y: value - MARKER_LABEL_OFFSET,
      class: "charts2-annotation",
      "text-anchor": anchor,
    };
  }

  /**
   * Maps a logical annotation placement without coupling it to one orientation.
   *
   * @param {unknown[]} values - Physical values for start, center, and end.
   * @param {string} placement - Logical placement.
   * @returns {unknown} Selected physical value.
   */
  #placementCoordinate(
    [
      start,
      center,
      end,
    ],
    placement,
  ) {
    if (placement === "start") {
      return start;
    }

    return placement === "center" ? center : end;
  }

  /**
   * Tests a value-axis coordinate against the current plot bounds.
   *
   * @param {number} position - Scaled value-axis position.
   * @returns {boolean} Whether the position falls inside the plot.
   */
  #insidePlot(position) {
    const { maximum, minimum } = this.#valueAxisBounds();

    return position >= minimum && position <= maximum;
  }

  /**
   * Tests whether a scaled interval intersects the plot.
   *
   * @param {number} start - First scaled endpoint.
   * @param {number} end - Second scaled endpoint.
   * @returns {boolean} Whether any portion of the interval is visible.
   */
  #overlapsPlot(start, end) {
    const { maximum, minimum } = this.#valueAxisBounds();

    return Math.max(start, end) >= minimum && Math.min(start, end) <= maximum;
  }

  /**
   * Clamps one value-axis coordinate to the plot.
   *
   * @param {number} position - Scaled value-axis coordinate.
   * @returns {number} Coordinate inside the plot bounds.
   */
  #boundedValuePosition(position) {
    const { maximum, minimum } = this.#valueAxisBounds();

    return Math.min(maximum, Math.max(minimum, position));
  }

  /**
   * Resolves the physical value-axis interval for the active orientation.
   *
   * @returns {{minimum: number, maximum: number}} Ascending plot bounds.
   */
  #valueAxisBounds() {
    const { bottom, left, right, top } = this.#layout.frame;

    if (this.#layout.isHorizontal) {
      return {
        minimum: left,
        maximum: right,
      };
    }

    return {
      minimum: top,
      maximum: bottom,
    };
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
            "text-anchor": "middle",
          }
        : {
            x: this.#layout.isYAxisRight ? right + VALUE_LABEL_GAP : left - VALUE_LABEL_GAP,
            y: position + VALUE_LABEL_CENTER_OFFSET,
            class: "charts2-label charts2-value-label",
            "text-anchor": this.#layout.isYAxisRight ? "start" : "end",
          };

      this.#surface.text(formatValue(this.#chart.options, value, { target: "axis" }), attributes);
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

    const orderedTicks = this.#layout.isHorizontal
      ? this.#layout.values.ticks
      : this.#layout.values.ticks.toReversed();

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
    const { height, left, right } = this.#layout.frame;
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
          y: height - CATEGORY_LABEL_BOTTOM_OFFSET,
          class: "charts2-label",
          "text-anchor": placement.anchor,
        },
        measurement: { maxWidth: placement.width, fontSize: 9 },
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
