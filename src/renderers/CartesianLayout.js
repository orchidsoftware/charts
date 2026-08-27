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

/**
 * Sums positive and negative stacked values independently for scale calculation.
 *
 * @param {Array<object>} datasets - Normalized bar datasets sharing category positions.
 * @returns {number[]} Signed stack totals across every category.
 */
function stackedBarValues(datasets) {
  if (datasets.length === 0) {
    return [];
  }
  const pointCount = Math.max(...datasets.map((dataset) => dataset.points.length));
  const totals = [];
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    let positive = 0;
    let negative = 0;
    for (const dataset of datasets) {
      const value = dataset.points[pointIndex]?.y ?? 0;
      if (value > 0) {
        positive += value;
      } else if (value < 0) {
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
    const scales = this.#scalesFor(state);
    this.#x = scales.x;
    this.#y = scales.y;
    this.#valuePosition = scales.value;
    this.#pointX = scales.pointX;
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
    const thickness = Math.max(2, (slot * 0.64) / groupCount);
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
    const isFrameless =
      !this.#chart.options.showAxes && !this.#chart.options.showGrid && !this.#chart.options.showLabels;
    const padding = isFrameless ? Math.max(this.#chart.options.strokeWidth, 1) : 28;
    const top = padding + Math.max(0, this.#legendRows(width) - 1) * LEGEND_ROW_HEIGHT;
    const isHorizontal = type === ChartType.BAR && orientation === ChartOrientation.HORIZONTAL;
    const labels = this.#chart.labels.map((label, index) => formatCategoryLabel(this.#chart.options, label, index));
    const points = this.#chart.datasets.flatMap((dataset) => dataset.points);
    const count = Math.max(...this.#chart.datasets.map((dataset) => dataset.points.length));
    const barDatasets = this.#barDatasets(type);
    const isStacked = Boolean(this.#chart.options.barOptions?.stacked);
    const values = this.#valueScale({ points, barDatasets, isStacked, isFrameless, type });
    const gutter = this.#valueGutter({ isHorizontal, isFrameless, labels, values, padding, width });
    const isYAxisRight = this.#chart.options.axisOptions?.yAxisPosition === YAxisPosition.RIGHT;
    const left = isYAxisRight ? padding : gutter;
    const right = width - (isYAxisRight ? gutter : padding);
    const frame = { width, height, padding, top, right, bottom: height - padding, left };
    const supportsInspector = this.#supportsInspector(type);
    const usesInspector = count <= MAX_INDIVIDUAL_LINE_POINTS || (supportsInspector && count <= MAX_X_INSPECTOR_POINTS);
    return {
      orientation,
      type,
      isHorizontal,
      isYAxisRight,
      labels,
      points,
      count,
      barDatasets,
      isStacked,
      values,
      gutter,
      frame,
      usesInspector,
    };
  }

  /**
   * Creates bound scale functions from resolved immutable state.
   *
   * @param {object} state - Resolved frame, points, bars, and orientation.
   * @param {object} state.frame - Plot boundaries.
   * @param {Array<object>} state.points - Flattened normalized points.
   * @param {number} state.count - Maximum category count.
   * @param {string} state.orientation - Direction used to choose category-slot geometry.
   * @param {boolean} state.isHorizontal - Whether values run horizontally.
   * @param {Array<object>} state.barDatasets - Bar-rendered datasets.
   * @param {object} state.values - Value domain and ticks.
   * @returns {object} Bound x, y, value, and point-position functions.
   */
  #scalesFor({ frame, points, count, orientation, isHorizontal, barDatasets, values }) {
    const xDomain = extent(points.map((point) => point.x));
    const x = (value) => scale(value, xDomain, [frame.left, frame.right]);
    const y = (value) => scale(value, values.domain, [frame.bottom, frame.top]);
    const value = isHorizontal ? (entry) => scale(entry, values.domain, [frame.left, frame.right]) : y;
    const slot = (frame.right - frame.left) / count;
    const center = (index) => frame.left + (index + 0.5) * slot;
    const hasCategorySlots = orientation === ChartOrientation.VERTICAL && barDatasets.length > 0;
    const pointX = hasCategorySlots ? (_point, index) => center(index) : (point) => x(point.x);
    return { x, y, value, pointX };
  }

  /**
   * Counts wrapped legend rows that shift the plotting area.
   *
   * @param {number} width - Available chart width in pixels.
   * @returns {number} Number of visible legend rows.
   */
  #legendRows(width) {
    if (!this.#chart.options.showLegend || this.#chart.datasets.length < 2) {
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
    return this.#chart.datasets.filter(
      (dataset) =>
        type === ChartType.BAR ||
        (type === ChartType.AXIS_MIXED && (dataset.chartType ?? ChartType.LINE) === ChartType.BAR),
    );
  }

  /**
   * Resolves a value domain that includes zero and signed stacks when required.
   *
   * @param {object} state - Points, bars, and presentation flags.
   * @param {Array<object>} state.points - Flattened normalized points.
   * @param {Array<object>} state.barDatasets - Bar-rendered datasets.
   * @param {boolean} state.isStacked - Whether bars accumulate by sign.
   * @param {boolean} state.isFrameless - Whether surrounding presentation is hidden.
   * @param {string} state.type - Current Cartesian chart type.
   * @returns {{domain: [number, number], ticks: number[]}} Numeric domain and visible ticks.
   */
  #valueScale({ points, barDatasets, isStacked, isFrameless, type }) {
    const stackValues = isStacked ? stackedBarValues(barDatasets) : [];
    let data = [...points.map((point) => point.y), ...stackValues, 0];
    if (isFrameless && type === ChartType.LINE) {
      data = points.map((point) => point.y);
    }
    return isFrameless ? { domain: extent(data), ticks: [] } : niceValueScale(data);
  }

  /**
   * Reserves horizontal space for category or numeric labels.
   *
   * @param {object} state - Orientation, labels, scale, and viewport values.
   * @param {boolean} state.isHorizontal - Whether categories are arranged as rows.
   * @param {boolean} state.isFrameless - Whether surrounding presentation is hidden.
   * @param {Array<string | string[]>} state.labels - Formatted category labels.
   * @param {object} state.values - Value domain and ticks.
   * @param {number} state.padding - Outer plot padding.
   * @param {number} state.width - Total chart width.
   * @returns {number} Horizontal label gutter in pixels.
   */
  #valueGutter({ isHorizontal, isFrameless, labels, values, padding, width }) {
    if (isHorizontal && this.#chart.labels.length > 0) {
      return horizontalCategoryPadding(labels, width);
    }
    return isFrameless ? padding : verticalValuePadding(values.ticks, padding);
  }

  /**
   * Determines whether every series shares category inspector geometry.
   *
   * @param {string} type - Current Cartesian chart type.
   * @returns {boolean} True when a shared category inspector is valid.
   */
  #supportsInspector(type) {
    return this.#chart.datasets.every((dataset) => {
      const datasetType = type === ChartType.AXIS_MIXED ? (dataset.chartType ?? ChartType.LINE) : type;
      return [ChartType.LINE, ChartType.BAR].includes(datasetType);
    });
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
        return top + ((index + 0.5) * (bottom - top)) / this.categories.count;
      }
      const point = this.#chart.datasets[0].points[index];
      return this.#pointX(point ?? { x: index }, index);
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
