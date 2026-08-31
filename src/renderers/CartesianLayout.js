import {
  ChartOrientation,
  ChartType,
  LEGEND_ROW_HEIGHT,
  MAX_INDIVIDUAL_LINE_POINTS,
  MAX_X_INSPECTOR_POINTS,
  YAxisPosition,
} from "../support/Constants.js";
import { extent, niceValueScale, scale } from "../support/Math.js";
import {
  formatCategoryLabel,
  horizontalCategoryPadding,
  legendLayout,
  verticalValuePadding,
} from "../support/Presentation.js";

const BAR_SLOT_RATIO = 0.64;
const PENULTIMATE_INDEX = -2;
const STANDARD_FRAME_PADDING = 28;
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

      if (value > 0) {
        positive += value;
      }

      if (value < 0) {
        negative += value;
      }
    }

    totals.push(positive, negative);
  }

  return totals;
}

/**
 * Owns the immutable geometry shared by Cartesian rendering collaborators.
 */
export default class CartesianLayout {
  #chart;
  #x;
  #y;
  #pointX;
  #valuePosition;
  #inspectorBands;

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
    this.#inspectorBands = this.#resolveInspectorBands();
    Object.freeze(this);
  }

  /**
   * Binds internal scale functions from resolved layout state.
   *
   * @param {object} state - Resolved Cartesian frame and data collections.
   * @returns {void} Private scale functions are assigned for the snapshot.
   */
  #bindScales(state) {
    const scaleData = { points: state.points, values: state.values };

    const categoryScale = {
      count: state.count,
      orientation: state.orientation,
      isHorizontal: state.isHorizontal,
      hasBars: state.barDatasets.length > 0,
      type: state.type,
    };

    const scales = this.#scalesFor(state.frame, scaleData, categoryScale);
    this.#x = scales.x;
    this.#y = scales.y;
    this.#valuePosition = scales.value;
    this.#pointX = scales.pointX;
  }

  /**
   * Maps one normalized point to Cartesian screen coordinates.
   *
   * @param {{x: number, y: number}} point - Normalized Cartesian point.
   * @param {number} index - Category position used by slot-based charts.
   * @returns {{x: number, y: number}} Screen-space point.
   */
  pointAt(point, index) {
    return { x: this.#pointX(point, index), y: this.#y(point.y) };
  }

  /**
   * Maps one category index to its horizontal screen coordinate.
   *
   * @param {number} index - Zero-based category position.
   * @returns {number} Screen-space category coordinate.
   */
  categoryAt(index) {
    return this.#pointX(this.#chart.datasets[0].points[index], index);
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
    const { bottom, left, right, top } = this.frame;
    const available = this.orientation === ChartOrientation.VERTICAL ? right - left : bottom - top;
    const slot = available / this.categories.count;
    const groupCount = this.bars.isStacked ? 1 : Math.max(1, this.bars.datasets.length);
    const thickness = Math.max(2, (slot * BAR_SLOT_RATIO) / groupCount);
    const groupOffset = (slot - thickness * groupCount) / 2;
    const datasetOffset = (this.bars.isStacked ? 0 : series) * thickness;

    if (this.isHorizontal) {
      const zero = this.valueAt(base);
      const value = this.valueAt(base + point.y);

      return {
        x: Math.min(zero, value),
        y: top + category * slot + groupOffset + datasetOffset,
        width: Math.abs(value - zero),
        height: thickness,
        thickness,
      };
    }

    const zero = this.yAt(base);
    const value = this.yAt(base + point.y);

    return {
      x: left + category * slot + groupOffset + datasetOffset,
      y: Math.min(zero, value),
      width: thickness,
      height: Math.abs(value - zero),
      thickness,
    };
  }

  /**
   * Returns the precomputed interaction rectangle for one category.
   *
   * @param {number} index - Zero-based category position.
   * @returns {object | undefined} SVG rectangle attributes or undefined outside the layout.
   */
  inspectorAt(index) {
    return this.#inspectorBands[index];
  }

  /**
   * Resolves frame, collections, and policy flags before scale binding.
   *
   * @returns {object} Internal Cartesian layout state.
   */
  #resolveState() {
    const { height, orientation, type, width } = this.#chart.options;
    const presentation = this.#presentationState({ orientation, type, width });
    const data = this.#dataState({ ...presentation, type, width });

    const frame = {
      width,
      height,
      padding: presentation.padding,
      top: presentation.top,
      right: width - (presentation.isYAxisRight ? data.gutter : presentation.padding),
      bottom: height - presentation.padding,
      left: presentation.isYAxisRight ? presentation.padding : data.gutter,
    };

    const supportsInspector = this.#supportsInspector(type);

    const usesInspector = supportsInspector && data.count <= MAX_X_INSPECTOR_POINTS;

    return { orientation, type, ...presentation, ...data, frame, usesInspector };
  }

  /**
   * Resolves presentation flags and formatted categories.
   *
   * @param {object} source - Orientation, type, and viewport width.
   * @param {string} source.orientation - Direction used for bar category slots.
   * @param {string} source.type - Current Cartesian chart type.
   * @param {number} source.width - Total chart width.
   * @returns {object} Frame padding, legend offset, axis direction, and labels.
   */
  #presentationState({ orientation, type, width }) {
    const isFrameless =
      !this.#chart.options.axes && !this.#chart.options.grid && !this.#chart.options.valueLabels;

    const padding = isFrameless ? Math.max(this.#chart.options.strokeWidth, 1) : STANDARD_FRAME_PADDING;
    const top = padding + Math.max(0, this.#legendRows(width) - 1) * LEGEND_ROW_HEIGHT;
    const isHorizontal = type === ChartType.BAR && orientation === ChartOrientation.HORIZONTAL;

    const labels = this.#chart.labels.map((label, index) =>
      formatCategoryLabel(this.#chart.options, label, index),
    );

    const isYAxisRight = this.#chart.options.yAxisPosition === YAxisPosition.RIGHT;

    return { isFrameless, padding, top, isHorizontal, labels, isYAxisRight };
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
    const barDatasets = this.#barDatasets(state.type);
    const isStacked = Boolean(this.#chart.options.stacked);
    const values = this.#valueScale(points, { datasets: barDatasets, isStacked }, state);
    const gutter = this.#valueGutter(state.labels, values, state);

    return { points, count, barDatasets, isStacked, values, gutter };
  }

  /**
   * Creates bound scale functions from resolved immutable state.
   *
   * @param {object} frame - Plot boundaries.
   * @param {object} data - Flattened points and value scale.
   * @param {object} category - Category count, direction, and slot policy.
   * @returns {object} Bound x, y, value, and point-position functions.
   */
  #scalesFor(frame, data, category) {
    const xValues = data.points.map((point) => point.x);
    const keepsEdgeDomain = category.hasBars || category.type === ChartType.LINE;
    const xDomain = keepsEdgeDomain ? extent(xValues) : this.#paddedXDomain(xValues);

    const x = (value) =>
      scale(value, xDomain, [
        frame.left,
        frame.right,
      ]);

    const y = (value) =>
      scale(value, data.values.domain, [
        frame.bottom,
        frame.top,
      ]);

    let value = y;

    if (category.isHorizontal) {
      value = (entry) =>
        scale(entry, data.values.domain, [
          frame.left,
          frame.right,
        ]);
    }

    const slot = (frame.right - frame.left) / category.count;
    const center = (index) => frame.left + (index + SLOT_MIDPOINT) * slot;
    const hasCategorySlots = category.orientation === ChartOrientation.VERTICAL && category.hasBars;
    let pointX = (point) => x(point.x);

    if (hasCategorySlots) {
      pointX = (_point, index) => center(index);
    }

    return { x, y, value, pointX };
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
   * Counts wrapped legend rows that shift the plotting area.
   *
   * @param {number} width - Available chart width in pixels.
   * @returns {number} Number of visible legend rows.
   */
  #legendRows(width) {
    if (!this.#chart.options.legend || this.#chart.datasets.length < 2) {
      return 0;
    }

    const items = this.#chart.datasets.map((dataset) => ({ label: dataset.name, color: dataset.color }));

    return legendLayout(width, items).rows;
  }

  /**
   * Selects datasets participating in grouped or stacked bars.
   *
   * @param {string} type - Current Cartesian chart type.
   * @returns {Array<object>} Ordered bar-rendered datasets.
   */
  #barDatasets(type) {
    return this.#chart.datasets.filter((dataset) => {
      if (type === ChartType.BAR) {
        return true;
      }

      if (type !== ChartType.AXIS_MIXED) {
        return false;
      }

      return dataset.chartType === ChartType.BAR;
    });
  }

  /**
   * Resolves a value domain that includes zero and signed stacks when required.
   *
   * @param {Array<object>} points - Flattened normalized points.
   * @param {object} bars - Bar datasets and stacking policy.
   * @param {object} presentation - Frameless flag and chart type.
   * @returns {{domain: [number, number], ticks: number[]}} Numeric domain and visible ticks.
   */
  #valueScale(points, bars, presentation) {
    const stackValues = bars.isStacked ? stackedBarValues(bars.datasets) : [];
    const annotationValues = this.#annotationValues();
    let data = [
      ...points.map((point) => point.y),
      ...stackValues,
      ...annotationValues,
      0,
    ];

    if (presentation.isFrameless && presentation.type === ChartType.LINE) {
      data = points.map((point) => point.y);
    }

    return presentation.isFrameless ? { domain: extent(data), ticks: [] } : niceValueScale(data);
  }

  /**
   * Collects opted-in marker values and region endpoints for automatic domains.
   *
   * @returns {number[]} Ordered annotation values participating in the scale.
   */
  #annotationValues() {
    const markers = this.#chart.source.yMarkers
      .filter((marker) => marker.includeInDomain)
      .map((marker) => marker.value);

    const regions = this.#chart.source.yRegions
      .filter((region) => region.includeInDomain)
      .flatMap((region) => region.range);

    return [
      ...markers,
      ...regions,
    ];
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
    if (presentation.isHorizontal && this.#chart.labels.length > 0) {
      return horizontalCategoryPadding(labels, presentation.width);
    }

    return presentation.isFrameless
      ? presentation.padding
      : verticalValuePadding(values.ticks, presentation.padding);
  }

  /**
   * Determines whether every series shares category inspector geometry.
   *
   * @param {string} type - Current Cartesian chart type.
   * @returns {boolean} True when a shared category inspector is valid.
   */
  // eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
  #supportsInspector(type) {
    if (type === ChartType.AXIS_MIXED) {
      return (
        typeof this.#chart.options.onSelect !== "function" &&
        this.#chart.datasets.every((dataset) =>
          [
            ChartType.LINE,
            ChartType.BAR,
          ].includes(dataset.chartType),
        )
      );
    }

    if (
      [
        ChartType.SCATTER,
        ChartType.BUBBLE,
      ].includes(type)
    ) {
      if (typeof this.#chart.options.onSelect === "function") {
        return false;
      }

      const [
        firstDataset,
        ...otherDatasets
      ] = this.#chart.datasets;

      return otherDatasets.every(
        (dataset) =>
          dataset.points.length === firstDataset.points.length &&
          dataset.points.every((point, index) => point.x === firstDataset.points[index].x),
      );
    }

    return [
      ChartType.LINE,
      ChartType.BAR,
    ].includes(type);
  }

  /**
   * Precomputes category-sized interaction rectangles for constant-time lookup.
   *
   * @returns {Array<object>} Frozen inspector rectangle attributes.
   */
  #resolveInspectorBands() {
    const { bottom, left, right, top } = this.frame;

    const centers = Array.from({ length: this.categories.count }, (_, index) => {
      if (this.isHorizontal) {
        return top + ((index + SLOT_MIDPOINT) * (bottom - top)) / this.categories.count;
      }

      return this.categoryAt(index);
    });

    return Object.freeze(
      centers.map((center, index) => {
        let start = (centers[index - 1] + center) / 2;
        let end = (center + centers[index + 1]) / 2;

        if (index === 0) {
          start = this.isHorizontal ? top : left;
        }

        if (index === centers.length - 1) {
          end = this.isHorizontal ? bottom : right;
        }

        const rectangle = this.isHorizontal
          ? { x: left, y: start, width: right - left, height: Math.max(1, end - start) }
          : { x: start, y: top, width: Math.max(1, end - start), height: bottom - top };

        return Object.freeze(rectangle);
      }),
    );
  }
}
