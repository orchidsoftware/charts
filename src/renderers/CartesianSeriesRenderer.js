import { ChartType, DEFAULT_BAR_RADIUS } from "../support/Constants.js";
import { formatNumber, markMetadata, svg, titled } from "../support/Dom.js";
import { linePath, roundedBarPath } from "../support/Math.js";
import { datasetSummary, tooltipText } from "../support/Presentation.js";

const CARTESIAN_LAYER = Object.freeze({
  [ChartType.BAR]: 0,
  [ChartType.LINE]: 1,
  [ChartType.SCATTER]: 2,
});

const SERIES_CLASS_COUNT = 4;
const DEFAULT_LINE_MARKER_RADIUS = 4.5;
const DEFAULT_POINT_RADIUS = 4;
const BUBBLE_OPACITY = 0.65;
const MINIMUM_POINT_HIT_RADIUS = 22;
const MINIMUM_BAR_HIT_THICKNESS = 44;

/**
 * Renders Cartesian data marks after the owning renderer has resolved layout.
 */
export default class CartesianSeriesRenderer {
  #chart;
  #layout;
  #surface;

  /**
   * Binds normalized chart state to one immutable Cartesian layout snapshot.
   *
   * @param {object} state - Collaborators required for one data-mark pass.
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
   * Renders datasets in deterministic bar, line, then scatter layer order.
   *
   * @returns {void} Every normalized dataset is appended to the chart SVG.
   */
  render() {
    let entries = this.#chart.datasets.map((dataset, datasetIndex) => ({ dataset, datasetIndex }));

    if (this.#layout.type === ChartType.AXIS_MIXED) {
      entries = entries.toSorted((left, right) => {
        const leftLayer = CARTESIAN_LAYER[left.dataset.chartType ?? ChartType.LINE];
        const rightLayer = CARTESIAN_LAYER[right.dataset.chartType ?? ChartType.LINE];

        return leftLayer - rightLayer;
      });
    }

    for (const entry of entries) {
      this.#renderDataset(entry);
    }
  }

  /**
   * Dispatches one normalized dataset to its concrete Cartesian drawing policy.
   *
   * @param {object} entry - Dataset and stable source index.
   * @param {object} entry.dataset - Normalized dataset to draw.
   * @param {number} entry.datasetIndex - Stable dataset position used in metadata.
   * @returns {void} One line, point series, or bar group is rendered.
   */
  #renderDataset({ dataset, datasetIndex }) {
    const datasetType = this.#datasetType(dataset);

    if (datasetType === ChartType.LINE) {
      this.#renderLine({ dataset, datasetIndex });

      return;
    }

    if ([ChartType.BUBBLE, ChartType.SCATTER].includes(datasetType)) {
      this.#renderPointSeries({ dataset, datasetIndex, datasetType });

      return;
    }

    this.#renderBars({ dataset, datasetIndex });
  }

  /**
   * Resolves the concrete renderer used by a dataset.
   *
   * @param {object} dataset - Normalized Cartesian dataset.
   * @returns {string} Effective chart type for the dataset.
   */
  #datasetType(dataset) {
    if (this.#layout.type === ChartType.AXIS_MIXED) {
      return dataset.chartType ?? ChartType.LINE;
    }

    return this.#layout.type;
  }

  /**
   * Draws one line with optional area, visible markers, and bounded summaries.
   *
   * @param {object} entry - Dataset and stable source index.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable dataset position used in CSS classes.
   * @returns {void} Line geometry and visible points are appended to the chart SVG.
   */
  #renderLine({ dataset, datasetIndex }) {
    const geometry = dataset.points.map((point, index) => ({
      ...this.#layout.pointAt(point, index),
    }));

    const path = linePath(geometry, this.#chart.options.lineOptions?.spline !== false);

    if (this.#chart.options.gradient || this.#chart.options.lineOptions?.regionFill) {
      this.#renderArea({ dataset, datasetIndex, path });
    }

    if (!this.#chart.options.lineOptions?.hideLine) {
      const lineClass = this.#layout.usesInspector ? "charts2-line" : "charts2-line charts2-mark";
      this.#surface.mark(
        "path",
        {
          d: path,
          fill: "none",
          stroke: dataset.color,
          "stroke-width": this.#chart.options.strokeWidth,
          class: `${lineClass} charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
        },
        {
          dataset: datasetIndex,
          point: 0,
          title: datasetSummary(dataset, this.#chart.labels),
        },
      );
    }

    if (
      this.#layout.showsIndividualMarks &&
      this.#chart.options.showDots !== false &&
      !this.#chart.options.lineOptions?.hideDots
    ) {
      this.#renderLinePoints({ dataset, datasetIndex });
    }
  }

  /**
   * Fills the area between one line and the zero baseline.
   *
   * @param {object} entry - Dataset, source index, and completed line path.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable dataset position used in SVG identifiers.
   * @param {string} entry.path - Completed line path used as the area's upper edge.
   * @returns {void} Gradient definition and area path are appended to the chart SVG.
   */
  #renderArea({ dataset, datasetIndex, path }) {
    const baseline = this.#layout.yAt(0);
    const lastX = this.#layout.pointAt(dataset.points.at(-1), dataset.points.length - 1).x;
    const firstX = this.#layout.pointAt(dataset.points[0], 0).x;
    const area = `${path} L${lastX},${baseline} L${firstX},${baseline} Z`;
    const gradientId = `charts2-gradient-${this.#chart.id}-${datasetIndex}`;
    const gradient = svg("linearGradient", { id: gradientId, x1: 0, y1: 0, x2: 0, y2: 1 });
    gradient.append(svg("stop", { offset: "0%", "stop-color": dataset.color, "stop-opacity": 0.42 }));
    gradient.append(svg("stop", { offset: "100%", "stop-color": dataset.color, "stop-opacity": 0 }));
    const definitions = svg("defs");
    definitions.append(gradient);
    this.#surface.append(definitions);
    this.#surface.append("path", { d: area, fill: `url(#${gradientId})`, class: "charts2-area" });
  }

  /**
   * Draws visible line markers without creating additional tab stops.
   *
   * @param {object} entry - Dataset and stable source index.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable dataset position used in CSS classes.
   * @returns {void} Marker halos and visible points are appended to the chart SVG.
   */
  #renderLinePoints({ dataset, datasetIndex }) {
    for (const [pointIndex, point] of dataset.points.entries()) {
      const label = `${this.#seriesPrefix(dataset)}${tooltipText({
        options: this.#chart.options,
        label: this.#chart.labels[pointIndex] ?? point.x,
        value: point.y,
      })}`;

      const { x: markerX, y: markerY } = this.#layout.pointAt(point, pointIndex);
      const markerRadius = this.#chart.options.lineOptions?.dotSize ?? DEFAULT_LINE_MARKER_RADIUS;
      this.#surface.append("circle", {
        cx: markerX,
        cy: markerY,
        r: markerRadius,
        class: "charts2-point-halo",
        "aria-hidden": "true",
      });
      this.#surface.append(
        titled(
          svg("circle", {
            cx: markerX,
            cy: markerY,
            r: markerRadius,
            fill: "var(--charts-point-fill)",
            stroke: dataset.color,
            class: `charts2-point charts2-visual-mark charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
            "aria-hidden": "true",
          }),
          label,
        ),
      );
    }
  }

  /**
   * Draws scatter or bubble values and fallback point-sized hit targets.
   *
   * @param {object} series - Dataset, source index, and point-series type.
   * @returns {void} Point marks and optional hit targets are appended to the chart SVG.
   */
  #renderPointSeries(series) {
    for (const [pointIndex, point] of series.dataset.points.entries()) {
      this.#renderPoint(series, point, pointIndex);
    }
  }

  /**
   * Draws one scatter or bubble point and its optional hit target.
   *
   * @param {object} series - Dataset, source index, and concrete type.
   * @param {object} source - Normalized scatter or bubble point.
   * @param {number} pointIndex - Stable point index.
   * @returns {void} One visible point and interaction target are appended.
   */
  #renderPoint(series, source, pointIndex) {
    const radius = series.datasetType === ChartType.BUBBLE ? source.r : DEFAULT_POINT_RADIUS;
    const size = series.datasetType === ChartType.BUBBLE ? `, size ${formatNumber(source.r)}` : "";
    const category = this.#chart.labels[pointIndex] ?? source.x;
    const label = `${this.#seriesPrefix(series.dataset)}${category}: ${formatNumber(source.y)}${size}`;
    const isOutlined = series.datasetType === ChartType.SCATTER;
    const coordinates = { cx: this.#layout.xAt(source.x), cy: this.#layout.yAt(source.y) };

    if (isOutlined) {
      this.#surface.append("circle", { ...coordinates, r: radius, class: "charts2-point-halo", "aria-hidden": "true" });
    }

    const point = svg("circle", {
      ...coordinates,
      r: radius,
      fill: isOutlined ? "var(--charts-point-fill)" : series.dataset.color,
      stroke: isOutlined ? series.dataset.color : "none",
      opacity: isOutlined ? 1 : BUBBLE_OPACITY,
      class: `charts2-${series.datasetType} charts2-visual-mark charts2-series-${series.datasetIndex % SERIES_CLASS_COUNT}`,
      "aria-hidden": "true",
    });

    this.#surface.append(titled(point, label));

    if (!this.#layout.usesInspector) {
      this.#renderPointHit(series, { coordinates, radius, label, pointIndex });
    }
  }

  /**
   * Draws the accessible interaction target around a point.
   *
   * @param {object} series - Dataset, source index, and concrete type.
   * @param {object} target - Point index, coordinates, radius, and label.
   * @returns {void} One transparent hit circle is appended.
   */
  #renderPointHit(series, target) {
    const hit = markMetadata(
      svg("circle", {
        ...target.coordinates,
        r: Math.max(MINIMUM_POINT_HIT_RADIUS, target.radius),
        fill: "transparent",
        stroke: "transparent",
        class: `charts2-point-hit charts2-mark charts2-series-${series.datasetIndex % SERIES_CLASS_COUNT}`,
        style: `color:${series.dataset.color}`,
      }),
      series.datasetIndex,
      target.pointIndex,
    );

    this.#surface.append(titled(hit, target.label));
  }

  /**
   * Draws grouped or signed stacked bars for one dataset.
   *
   * @param {object} entry - Dataset and stable source index.
   * @param {object} entry.dataset - Normalized bar dataset.
   * @param {number} entry.datasetIndex - Stable dataset position used in metadata.
   * @returns {void} Bar paths are appended to the chart SVG.
   */
  #renderBars({ dataset, datasetIndex }) {
    const barDatasetIndex = Math.max(0, this.#layout.bars.datasets.indexOf(dataset));

    for (const [pointIndex, point] of dataset.points.entries()) {
      const base = this.#stackedBase({ point, pointIndex, barDatasetIndex });
      const hasLaterSegment = this.#hasLaterStackedSegment({ point, pointIndex, barDatasetIndex });

      const geometry = this.#layout.barFor(point, {
        category: pointIndex,
        series: barDatasetIndex,
        base,
      });

      this.#renderBar(dataset, point, {
        datasetIndex,
        pointIndex,
        geometry,
        shouldRoundValueEnd: !this.#layout.bars.isStacked || !hasLaterSegment,
      });
    }
  }

  /**
   * Calculates the signed value accumulated before one stacked bar segment.
   *
   * @param {object} state - Current point and its dataset coordinates.
   * @param {object} state.point - Current normalized bar point.
   * @param {number} state.pointIndex - Category position of the current point.
   * @param {number} state.barDatasetIndex - Position within bar-rendered datasets.
   * @returns {number} Sum of preceding stack segments with the same sign.
   */
  #stackedBase({ point, pointIndex, barDatasetIndex }) {
    if (!this.#layout.bars.isStacked) {
      return 0;
    }

    let base = 0;

    for (const dataset of this.#layout.bars.datasets.slice(0, barDatasetIndex)) {
      const value = dataset.points[pointIndex]?.y ?? 0;

      if (Math.sign(value) === Math.sign(point.y)) {
        base += value;
      }
    }

    return base;
  }

  /**
   * Detects whether another same-sign segment follows in a stacked category.
   *
   * @param {object} state - Current point and its dataset coordinates.
   * @param {object} state.point - Current normalized bar point.
   * @param {number} state.pointIndex - Category position of the current point.
   * @param {number} state.barDatasetIndex - Position within bar-rendered datasets.
   * @returns {boolean} True when rounding must be deferred to a later segment.
   */
  #hasLaterStackedSegment({ point, pointIndex, barDatasetIndex }) {
    return (
      this.#layout.bars.isStacked &&
      this.#layout.bars.datasets.slice(barDatasetIndex + 1).some((dataset) => {
        const value = dataset.points[pointIndex]?.y ?? 0;

        return value !== 0 && Math.sign(value) === Math.sign(point.y);
      })
    );
  }

  /**
   * Builds and appends one horizontal or vertical rounded bar path.
   *
   * @param {object} dataset - Dataset owning the rendered point.
   * @param {{y: number}} point - Normalized bar point.
   * @param {object} rendering - Source metadata and resolved geometry.
   * @param {number} rendering.datasetIndex - Stable dataset position.
   * @param {number} rendering.pointIndex - Stable point position.
   * @param {object} rendering.geometry - Bar rectangle and visible thickness.
   * @param {boolean} rendering.shouldRoundValueEnd - Whether the exposed value edge is rounded.
   * @returns {void} One accessible bar path is appended to the chart SVG.
   */
  #renderBar(dataset, point, { datasetIndex, pointIndex, geometry, shouldRoundValueEnd }) {
    this.#surface.mark(
      "path",
      {
        d: roundedBarPath({
          rectangle: geometry,
          direction: { orientation: this.#layout.orientation, value: point.y },
          rounding: {
            radius: this.#chart.options.barOptions?.radius ?? DEFAULT_BAR_RADIUS,
            shouldRoundValueEnd,
          },
        }),
        fill: dataset.color,
        stroke: "transparent",
        "stroke-width": this.#layout.usesInspector
          ? 0
          : Math.max(0, (MINIMUM_BAR_HIT_THICKNESS - geometry.thickness) / 2),
        class: `charts2-bar ${this.#layout.usesInspector ? "charts2-visual-mark" : "charts2-mark"} charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
      },
      {
        dataset: datasetIndex,
        point: pointIndex,
        title: `${this.#seriesPrefix(dataset)}${tooltipText({
          options: this.#chart.options,
          label: this.#chart.labels[pointIndex] ?? pointIndex + 1,
          value: point.y,
        })}`,
      },
    );
  }

  /**
   * Prefixes tooltips with a series name only when multiple datasets exist.
   *
   * @param {object} dataset - Normalized dataset owning the tooltip value.
   * @returns {string} Empty text or a comma-terminated dataset name.
   */
  #seriesPrefix(dataset) {
    return this.#chart.datasets.length > 1 ? `${dataset.name}, ` : "";
  }
}
