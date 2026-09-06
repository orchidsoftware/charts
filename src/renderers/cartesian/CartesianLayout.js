import {
  ORIENTATION_HORIZONTAL,
  CHART_AXIS_MIXED,
  CHART_BAR,
  CHART_BUBBLE,
  CHART_LINE,
  MAX_INDIVIDUAL_LINE_POINTS,
  MAX_X_INSPECTOR_POINTS,
  Y_AXIS_RIGHT,
} from "../../support/Constants.js";
import { extent, niceValueScale, scale } from "../../support/geometry/Math.js";
import { formatValue } from "../../support/presentation/Formatting.js";
import {
  formatCategoryLabel,
  horizontalCategoryPadding,
  seriesContentLayout,
  verticalValuePadding,
} from "../../support/presentation/Presentation.js";

const BAR_SLOT_RATIO = 0.64;
const PENULTIMATE_INDEX = -2;
const STANDARD_FRAME_PADDING = 28;
const VALUE_LABEL_TOP_CLEARANCE = 8;
const SLOT_MIDPOINT = 0.5;

/**
 * Sums positive and negative stacked values independently for scale calculation.
 *
 * @param {Array<object>} datasets - Normalized bar datasets sharing category positions.
 * @returns {number[]} Signed stack totals across every category.
 */
function stackedBarValues(datasets) {
  const pointCount = Math.max(...datasets.map((dataset) => dataset.points.length));
  const totals = [];

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    let positive = 0;
    let negative = 0;

    for (const dataset of datasets) {
      const value = dataset.points[pointIndex].y;

      positive += Math.max(0, value);
      negative += Math.min(0, value);
    }

    totals.push(positive, negative);
  }

  return totals;
}

/**
 * Expands a domain to contain circles without changing their pixel radii.
 *
 * Oversized circles retain their radius but cannot contribute a fitting constraint.
 *
 * @param {[number, number]} domain - Existing ascending coordinate domain.
 * @param {Array<object>} points - Visible bubble points.
 * @param {["x" | "y", number]} axis - Coordinate name and available length in CSS pixels.
 * @returns {[number, number]} Domain containing the original extent and circle clearance.
 */
function bubbleDomain(
  domain,
  points,
  [
    coordinate,
    size,
  ],
) {
  const fittingPoints = points.filter((point) => 2 * point.r < size);
  const maximumRadius = Math.max(0, ...fittingPoints.map((point) => point.r));
  const unitsPerPixel = (domain[1] - domain[0]) / (size - 2 * maximumRadius);

  return extent([
    ...domain,
    ...[
      -1,
      1,
    ].flatMap((direction) =>
      fittingPoints.map((point) => point[coordinate] + direction * point.r * unitsPerPixel),
    ),
  ]);
}

/**
 * Owns the immutable geometry shared by Cartesian rendering collaborators.
 */
export default class CartesianLayout {
  #chart;
  #x;
  #y;
  #valuePosition;

  /**
   * Resolves chart geometry once and freezes the public layout vocabulary.
   *
   * @param {object} chart - Frozen Cartesian data and options for one render.
   */
  constructor(chart) {
    this.#chart = chart;
    const state = this.#resolveState();

    this.#bindScales(state);

    this.orientation = state.orientation;
    this.type = state.type;
    this.isHorizontal = state.isHorizontal;
    this.isYAxisRight = state.isYAxisRight;
    this.usesInspector = state.usesInspector;
    this.showsIndividualMarks = state.count <= MAX_INDIVIDUAL_LINE_POINTS;
    this.frame = Object.freeze(state.frame);
    this.categories = Object.freeze({ labels: state.labels, count: state.count, gutter: state.gutter });
    this.values = Object.freeze(state.values);
    this.bars = Object.freeze({ datasets: state.barDatasets, isStacked: state.isStacked });
    Object.freeze(this);
  }

  /**
   * Maps one normalized point to Cartesian screen coordinates.
   *
   * @param {{x: number, y: number}} point - Normalized Cartesian point.
   * @returns {{x: number, y: number}} Screen-space point.
   */
  pointAt(point) {
    return {
      x: this.#x(point.x),
      y: this.#y(point.y),
    };
  }

  /**
   * Maps one category index to its horizontal screen coordinate.
   *
   * @param {number} index - Zero-based category position.
   * @returns {number} Screen-space category coordinate.
   */
  categoryAt(index) {
    return this.#x(this.#chart.datasets[0].points[index].x);
  }

  /**
   * Maps a continuous x-domain value to the horizontal plot range.
   *
   * @param {number} value - Normalized x-domain value.
   * @returns {number} Horizontal screen coordinate.
   */
  xAt(value) {
    return this.#x(value);
  }

  /**
   * Maps a numeric value to the vertical plot range.
   *
   * @param {number} value - Normalized y-domain value.
   * @returns {number} Vertical screen coordinate.
   */
  yAt(value) {
    return this.#y(value);
  }

  /**
   * Maps a value onto the active horizontal or vertical value axis.
   *
   * @param {number} value - Normalized numeric value.
   * @returns {number} Screen coordinate on the active value axis.
   */
  valueAt(value) {
    return this.#valuePosition(value);
  }

  /**
   * Resolves one grouped or stacked bar without exposing slot calculations.
   *
   * @param {{y: number}} point - Normalized bar point.
   * @param {object} placement - Source position and signed stack base.
   * @param {number} placement.category - Zero-based category position.
   * @param {number} placement.series - Position within bar-rendered datasets.
   * @param {number} placement.base - Signed value accumulated before this segment.
   * @returns {{x: number, y: number, width: number, height: number, thickness: number}} Bar rectangle and visible thickness.
   */
  barFor(point, { category, series, base }) {
    const { bottom, top } = this.frame;
    const slot = this.isHorizontal ? (bottom - top) / this.categories.count : this.xAt(1) - this.xAt(0);
    const groupCount = this.bars.isStacked ? 1 : Math.max(1, this.bars.datasets.length);
    const thickness = Math.max(2, (slot * BAR_SLOT_RATIO) / groupCount);
    const offset = (slot - thickness * groupCount) / 2 + (this.bars.isStacked ? 0 : series) * thickness;

    const zero = this.#valuePosition(base);
    const value = this.#valuePosition(base + point.y);

    const rectangle = {
      x: (this.isHorizontal ? top + category * slot : this.xAt(point.x) - slot / 2) + offset,
      y: Math.min(zero, value),
      width: thickness,
      height: Math.abs(value - zero),
      thickness,
    };

    return this.isHorizontal
      ? { x: rectangle.y, y: rectangle.x, width: rectangle.height, height: thickness, thickness }
      : rectangle;
  }

  /**
   * Calculates one category interaction rectangle without allocating all bands.
   *
   * @param {number} index - Zero-based category position.
   * @returns {object} SVG rectangle attributes for a valid category index.
   */
  inspectorAt(index) {
    const { bottom, left, right, top } = this.frame;
    const center = this.#inspectorCenter(index);
    const firstBoundary = this.isHorizontal ? top : left;
    const lastBoundary = this.isHorizontal ? bottom : right;

    const start = index === 0 ? firstBoundary : (this.#inspectorCenter(index - 1) + center) / 2;

    const end =
      index === this.categories.count - 1 ? lastBoundary : (center + this.#inspectorCenter(index + 1)) / 2;

    return Object.freeze(
      this.isHorizontal
        ? { x: left, y: start, width: right - left, height: Math.max(1, end - start) }
        : { x: start, y: top, width: Math.max(1, end - start), height: bottom - top },
    );
  }

  /**
   * Resolves frame, collections, and policy flags before scale binding.
   *
   * @returns {object} Internal Cartesian layout state.
   */
  #resolveState() {
    const { height, orientation, type, width } = this.#chart.options;
    const presentation = this.#presentationState(this.#chart.options);
    const content = seriesContentLayout(this.#chart);
    const plotHeight = content.contentHeight - presentation.padding - presentation.top;
    const data = this.#dataState({ ...presentation, type, width, height: plotHeight });

    const frame = {
      width,
      height,
      padding: presentation.padding,
      top: presentation.top,
      right: width - (presentation.isYAxisRight ? data.gutter : 0),
      bottom: content.contentHeight - presentation.padding,
      left: presentation.isYAxisRight ? 0 : data.gutter,
    };

    const usesInspector =
      this.#supportsInspector(type) &&
      (data.count <= MAX_X_INSPECTOR_POINTS ||
        [
          CHART_LINE,
          CHART_BAR,
          CHART_AXIS_MIXED,
        ].includes(type));

    return {
      orientation,
      type,
      ...presentation,
      ...data,
      frame,
      usesInspector,
    };
  }

  /**
   * Resolves presentation flags and formatted categories.
   *
   * @param {object} source - Orientation, type, and viewport width.
   * @param {string} source.orientation - Direction used for bar category slots.
   * @param {string} source.type - Current Cartesian chart type.
   * @returns {object} Frame padding, legend offset, axis direction, and labels.
   */
  #presentationState({ orientation, type }) {
    const isFrameless =
      !this.#chart.options.axes && !this.#chart.options.grid && !this.#chart.options.valueLabels;

    const framelessPadding = type === CHART_BAR ? 0 : Math.max(this.#chart.options.strokeWidth, 1);
    const padding = isFrameless ? framelessPadding : STANDARD_FRAME_PADDING;
    const isHorizontal = type === CHART_BAR && orientation === ORIENTATION_HORIZONTAL;

    const hasVerticalLabels = this.#chart.options.valueLabels && !isHorizontal;
    const labelClearance = hasVerticalLabels ? VALUE_LABEL_TOP_CLEARANCE : 0;
    const top = Math.max(isFrameless ? padding : 0, labelClearance);

    const labels = this.#chart.labels.map((label, index) =>
      formatCategoryLabel(this.#chart.options, label, index),
    );

    return {
      isFrameless,
      padding,
      top,
      isHorizontal,
      labels,
      isYAxisRight: this.#chart.options.yAxisPosition === Y_AXIS_RIGHT,
    };
  }

  /**
   * Resolves flattened points, bar policy, value scale, and label gutter.
   *
   * @param {object} state - Presentation state plus chart type and width.
   * @returns {object} Collections and scale data needed by the layout.
   */
  #dataState(state) {
    const points = this.#chart.datasets.flatMap((dataset) => dataset.points);
    const count = Math.max(...this.#chart.datasets.map((dataset) => dataset.points.length));

    const barDatasets = this.#chart.datasets.filter(
      (dataset) =>
        state.type === CHART_BAR || (state.type === CHART_AXIS_MIXED && dataset.chartType === CHART_BAR),
    );

    const isStacked = Boolean(this.#chart.options.stacked);
    const values = this.#valueScale(points, barDatasets, state);
    values.labels = new Map(
      (this.#chart.options.valueLabels ? values.ticks : []).map((value) => [
        value,
        formatValue(this.#chart.options, value, { target: "axis" }),
      ]),
    );
    const gutter = this.#valueGutter(state.labels, values, state);

    return {
      points,
      count,
      barDatasets,
      isStacked,
      values,
      gutter,
    };
  }

  /**
   * Binds scales directly from the resolved layout state.
   *
   * @param {object} state - Resolved frame, values, points, and category policy.
   * @returns {void} Private coordinate mappings are assigned for this layout.
   */
  // eslint-disable-next-line max-lines-per-function -- Axis tuples and scale ranges add layout lines.
  #bindScales(state) {
    const { frame, points, values, isHorizontal, type, barDatasets } = state;
    const hasBars = barDatasets.length > 0;
    const xValues = points.map((point) => point.x);
    const isKeepsEdgeDomain = hasBars || type === CHART_LINE;
    let xDomain = isKeepsEdgeDomain ? extent(xValues) : this.#paddedXDomain(xValues);

    if (hasBars) {
      xDomain = [
        Math.min(...xValues) - SLOT_MIDPOINT,
        Math.max(...xValues) + SLOT_MIDPOINT,
      ];
    }

    if (type === CHART_BUBBLE) {
      xDomain = bubbleDomain(xDomain, points, [
        "x",
        frame.right - frame.left,
      ]);
    }

    const x = (value) =>
      scale(value, xDomain, [
        frame.left,
        frame.right,
      ]);

    const y = (value) =>
      scale(value, values.domain, [
        frame.bottom,
        frame.top,
      ]);

    this.#x = x;
    this.#y = y;
    this.#valuePosition = isHorizontal
      ? (entry) =>
          scale(entry, values.domain, [
            frame.left,
            frame.right,
          ])
      : y;
  }

  /**
   * Adds half of each outer neighbor interval to an independent x-domain.
   *
   * Line charts intentionally keep their endpoints on the plot boundary,
   * while point-based charts need room for complete outer inspection cells.
   *
   * @param {number[]} values - X coordinates from every rendered dataset.
   * @returns {[number, number]} Domain including both outer half intervals.
   */
  #paddedXDomain(values) {
    const ordered = [
      ...new Set(values),
    ].toSorted((left, right) => left - right);

    if (ordered.length < 2) {
      return extent(ordered);
    }

    const first = ordered[0];
    const second = ordered[1];
    const last = ordered.at(-1);
    const previous = ordered.at(PENULTIMATE_INDEX);

    return [
      first - (second - first) / 2,
      last + (last - previous) / 2,
    ];
  }

  /**
   * Resolves a value domain that includes zero and signed stacks when required.
   *
   * @param {Array<object>} points - Flattened normalized points.
   * @param {Array<object>} barDatasets - Datasets contributing stacked values.
   * @param {object} presentation - Frameless flag and chart type.
   * @returns {{domain: [number, number], ticks: number[]}} Numeric domain and visible ticks.
   */
  #valueScale(points, barDatasets, presentation) {
    const data = points.map((point) => point.y);
    const isFramelessLine = presentation.isFrameless && presentation.type === CHART_LINE;

    if (!isFramelessLine) {
      const { yMarkers, yRegions } = this.#chart.source;
      const stackValues = this.#chart.options.stacked ? stackedBarValues(barDatasets) : [];
      data.push(
        ...stackValues,
        ...yMarkers.filter((marker) => marker.includeInDomain).map((marker) => marker.value),
        ...yRegions.filter((region) => region.includeInDomain).flatMap((region) => region.range),
        0,
      );
    }

    const axis = [
      "y",
      presentation.height,
    ];

    const hasBubbles = presentation.type === CHART_BUBBLE;
    const bounds = extent(data);
    const domain = hasBubbles ? bubbleDomain(bounds, points, axis) : bounds;

    const values = presentation.isFrameless
      ? { domain, ticks: [] }
      : niceValueScale(
          domain,
          data.every((value) => Number.isSafeInteger(value)),
        );

    if (hasBubbles) {
      values.domain = bubbleDomain(values.domain, points, axis);
    }

    return values;
  }

  /**
   * Reserves horizontal space for category or numeric labels.
   *
   * @param {Array<string | string[]>} labels - Formatted category labels.
   * @param {object} values - Value domain and ticks.
   * @param {object} presentation - Orientation, frame, and viewport policy.
   * @returns {number} Horizontal label gutter in pixels.
   */
  #valueGutter(labels, values, presentation) {
    if (!this.#chart.options.valueLabels) {
      return 0;
    }

    if (presentation.isHorizontal && this.#chart.labels.length > 0) {
      return horizontalCategoryPadding(labels, presentation.width);
    }

    return verticalValuePadding(
      [
        ...values.labels.values(),
      ],
      0,
    );
  }

  /**
   * Determines whether every series shares category inspector geometry.
   *
   * @param {string} type - Current Cartesian chart type.
   * @returns {boolean} True when a shared category inspector is valid.
   */
  #supportsInspector(type) {
    if (
      [
        CHART_LINE,
        CHART_BAR,
      ].includes(type)
    ) {
      return true;
    }

    if (typeof this.#chart.options.onSelect === "function") {
      return false;
    }

    if (type === CHART_AXIS_MIXED) {
      return this.#chart.datasets.every((dataset) =>
        [
          CHART_LINE,
          CHART_BAR,
        ].includes(dataset.chartType),
      );
    }

    const [
      first,
      ...others
    ] = this.#chart.datasets;

    const ordered = first.points.every((point, index) => index === 0 || point.x > first.points[index - 1].x);

    return (
      ordered &&
      others.every(
        (dataset) =>
          dataset.points.length === first.points.length &&
          dataset.points.every((point, index) => point.x === first.points[index].x),
      )
    );
  }

  /**
   * Maps a category to its inspection axis center.
   *
   * @param {number} index - Category position.
   * @returns {number} Plot coordinate on the category axis.
   */
  #inspectorCenter(index) {
    const { top, bottom } = this.frame;

    return this.isHorizontal
      ? top + ((index + SLOT_MIDPOINT) * (bottom - top)) / this.categories.count
      : this.categoryAt(index);
  }

  /**
   * Finds the nearest category with logarithmic work and no point-sized allocation.
   *
   * @param {number} x - Plot x coordinate.
   * @param {number} y - Plot y coordinate.
   * @returns {number} Clamped category index.
   */
  inspectionIndexAt(x, y) {
    const coordinate = this.isHorizontal ? y : x;
    let low = 0;
    let high = this.categories.count - 1;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const boundary = (this.#inspectorCenter(middle) + this.#inspectorCenter(middle + 1)) / 2;

      if (coordinate < boundary) {
        high = middle;
        continue;
      }

      low = middle + 1;
    }

    return low;
  }
}
