import { ChartType, DEFAULT_BAR_RADIUS } from "../support/Constants.js";
import { formatNumber, markMetadata, svg, titled } from "../support/Dom.js";
import { formatLabel, formatValue } from "../support/Formatting.js";
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
const DEFAULT_AREA_OPACITY = 0.2;
const DEFAULT_GRADIENT_FROM_OPACITY = 0.42;

/**
 * Resolves an explicit local value over one inherited fallback.
 *
 * @param {unknown} local - Optional local override.
 * @param {unknown} fallback - Inherited chart value.
 * @returns {unknown} Local value when explicit, otherwise the fallback.
 */
function localValue(local, fallback) {
  if (local !== undefined) {
    return local;
  }

  return fallback;
}

/**
 * Resolves dot visibility while allowing a local value to override presets.
 *
 * @param {object} dataset - Normalized line dataset.
 * @param {object} options - Chart-level visibility options.
 * @returns {boolean} Effective dot visibility.
 */
function lineDots(dataset, options) {
  if (dataset.dots !== undefined) {
    return dataset.dots;
  }

  return options.dots !== false;
}

/**
 * Resolves chart defaults and local line overrides once per dataset.
 */
class LinePresentation {
  /**
   * Resolves effective line, dot, area, and gradient settings.
   *
   * @param {object} dataset - Normalized line dataset.
   * @param {object} options - Current chart-level defaults.
   */
  constructor(dataset, options) {
    this.isSmooth = localValue(dataset.smooth, localValue(options.smooth, true));
    this.showsLine = localValue(dataset.line, localValue(options.line, true));
    this.showsDots = lineDots(dataset, options);
    this.gradient = localValue(dataset.gradient, localValue(options.gradient, false));
    this.area = localValue(dataset.area, localValue(options.area, false));
    this.hasArea = dataset.area !== false && Boolean(this.gradient || this.area);
    this.strokeWidth = localValue(dataset.strokeWidth, options.strokeWidth);
    this.dotSize = localValue(dataset.dotSize, localValue(options.dotSize, DEFAULT_LINE_MARKER_RADIUS));
  }

  /**
   * Resolves one configured gradient endpoint opacity.
   *
   * @param {"fromOpacity" | "toOpacity"} name - Endpoint property.
   * @param {number} fallback - Built-in endpoint opacity.
   * @returns {number} Effective opacity.
   */
  gradientOpacity(name, fallback) {
    if (typeof this.gradient !== "object") {
      return fallback;
    }

    return localValue(this.gradient[name], fallback);
  }
}

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
        const leftLayer = CARTESIAN_LAYER[left.dataset.chartType];
        const rightLayer = CARTESIAN_LAYER[right.dataset.chartType];

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
      return dataset.chartType;
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
    const geometry = dataset.points.map((point, index) => this.#layout.pointAt(point, index));

    const presentation = new LinePresentation(dataset, this.#chart.options);
    const path = linePath(geometry, presentation.isSmooth);

    if (presentation.hasArea) {
      this.#renderArea({ dataset, datasetIndex, path, presentation });
    }

    if (presentation.showsLine) {
      this.#renderLineStroke({ dataset, datasetIndex, path, presentation });
    }

    if (this.#layout.showsIndividualMarks && presentation.showsDots) {
      this.#renderLinePoints({ dataset, datasetIndex, dotSize: presentation.dotSize });
    }

    if (this.#layout.type === ChartType.AXIS_MIXED && !this.#layout.usesInspector) {
      this.#renderLineHits({ dataset, datasetIndex, radius: presentation.dotSize });
    }
  }

  /**
   * Draws one line stroke with its effective local presentation.
   *
   * @param {object} entry - Dataset, source index, path, and presentation.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable dataset position.
   * @param {string} entry.path - Completed SVG path.
   * @param {LinePresentation} entry.presentation - Effective local presentation.
   * @returns {void} One accessible line path is appended.
   */
  #renderLineStroke({ dataset, datasetIndex, path, presentation }) {
    const isDenseAlignedLine = !this.#layout.usesInspector && this.#layout.type !== ChartType.AXIS_MIXED;
    const lineClass = isDenseAlignedLine ? "charts2-line charts2-mark" : "charts2-line";

    this.#surface.mark(
      "path",
      {
        d: path,
        fill: "none",
        stroke: dataset.color,
        "stroke-width": presentation.strokeWidth,
        opacity: dataset.opacity ?? 1,
        class: `${lineClass} charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
      },
      {
        dataset: datasetIndex,
        point: 0,
        title: datasetSummary(dataset, this.#chart.labels, { options: this.#chart.options, datasetIndex }),
      },
    );
  }

  /**
   * Adds one interaction target per mixed-line point while keeping the line path decorative.
   *
   * @param {object} entry - Dataset identity and effective hit radius.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable source dataset position.
   * @param {number} entry.radius - Effective interaction target radius.
   * @returns {void} Navigation order can address every independent mixed mark.
   */
  #renderLineHits({ dataset, datasetIndex, radius }) {
    for (const [pointIndex, point] of dataset.points.entries()) {
      this.#renderPointHit(
        { dataset, datasetIndex },
        {
          coordinates: this.#layout.pointAt(point, pointIndex),
          radius,
          label: this.#linePointLabel({ dataset, datasetIndex, pointIndex, point }),
          pointIndex,
        },
      );
    }
  }

  /**
   * Fills the area between one line and the zero baseline.
   *
   * @param {object} entry - Dataset, source index, and completed line path.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable dataset position used in SVG identifiers.
   * @param {string} entry.path - Completed line path used as the area's upper edge.
   * @param {LinePresentation} entry.presentation - Effective line presentation.
   * @returns {void} Gradient definition and area path are appended to the chart SVG.
   */
  #renderArea({ dataset, datasetIndex, path, presentation }) {
    const baseline = this.#layout.yAt(0);
    const lastX = this.#layout.pointAt(dataset.points.at(-1), dataset.points.length - 1).x;
    const firstX = this.#layout.pointAt(dataset.points[0], 0).x;
    const area = `${path} L${lastX},${baseline} L${firstX},${baseline} Z`;

    if (!presentation.gradient) {
      this.#surface.append("path", {
        d: area,
        fill: dataset.color,
        opacity: dataset.opacity ?? DEFAULT_AREA_OPACITY,
        class: "charts2-area",
      });

      return;
    }

    const gradientId = `charts2-gradient-${this.#chart.id}-${datasetIndex}`;
    const definition = svg("linearGradient", { id: gradientId, x1: 0, y1: 0, x2: 0, y2: 1 });
    const fromOpacity = presentation.gradientOpacity("fromOpacity", DEFAULT_GRADIENT_FROM_OPACITY);
    const toOpacity = presentation.gradientOpacity("toOpacity", 0);
    definition.append(
      svg("stop", { offset: "0%", "stop-color": dataset.color, "stop-opacity": fromOpacity }),
    );
    definition.append(
      svg("stop", { offset: "100%", "stop-color": dataset.color, "stop-opacity": toOpacity }),
    );
    const definitions = svg("defs");
    definitions.append(definition);
    this.#surface.append(definitions);
    this.#surface.append("path", { d: area, fill: `url(#${gradientId})`, class: "charts2-area" });
  }

  /**
   * Draws visible line markers without creating additional tab stops.
   *
   * @param {object} entry - Dataset and stable source index.
   * @param {object} entry.dataset - Normalized line dataset.
   * @param {number} entry.datasetIndex - Stable dataset position used in CSS classes.
   * @param {number} entry.dotSize - Effective marker radius.
   * @returns {void} Marker halos and visible points are appended to the chart SVG.
   */
  #renderLinePoints({ dataset, datasetIndex, dotSize }) {
    for (const [pointIndex, point] of dataset.points.entries()) {
      const label = this.#linePointLabel({ dataset, datasetIndex, pointIndex, point });

      const { x: markerX, y: markerY } = this.#layout.pointAt(point, pointIndex);
      const markerRadius = dotSize;
      this.#surface.append("circle", {
        cx: markerX,
        cy: markerY,
        r: markerRadius,
        class: "charts2-point-halo",
        "aria-hidden": "true",
      });
      this.#surface.append(
        titled(
          markMetadata(
            svg("circle", {
              cx: markerX,
              cy: markerY,
              r: markerRadius,
              fill: "var(--charts-point-fill)",
              stroke: dataset.color,
              opacity: dataset.opacity ?? 1,
              class: `charts2-point charts2-visual-mark charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
              "aria-hidden": "true",
            }),
            datasetIndex,
            pointIndex,
          ),
          label,
        ),
      );
    }
  }

  /**
   * Formats one line point through dataset and chart formatter precedence.
   *
   * @param {object} source - Dataset and point identity.
   * @returns {string} Plain accessible point label.
   */
  #linePointLabel(source) {
    const { dataset, datasetIndex, pointIndex, point } = source;

    return `${this.#seriesPrefix(dataset)}${tooltipText({
      options: this.#chart.options,
      label: this.#chart.labels[pointIndex],
      value: point.y,
      dataset,
      datasetIndex,
      index: pointIndex,
      point,
    })}`;
  }

  /**
   * Draws scatter or bubble values with generous point-centered hit targets.
   *
   * @param {object} series - Dataset, source index, and point-series type.
   * @returns {void} Point marks and their hit targets are appended to the chart SVG.
   */
  #renderPointSeries(series) {
    for (const [pointIndex, point] of series.dataset.points.entries()) {
      this.#renderPoint(series, point, pointIndex);
    }
  }

  /**
   * Draws one scatter or bubble point and its point-centered hit target.
   *
   * @param {object} series - Dataset, source index, and concrete type.
   * @param {object} source - Normalized scatter or bubble point.
   * @param {number} pointIndex - Stable point index.
   * @returns {void} One visible point and one interaction target are appended.
   */
  #renderPoint(series, source, pointIndex) {
    const radius = series.datasetType === ChartType.BUBBLE ? source.r : DEFAULT_POINT_RADIUS;
    const tooltip = this.#pointTooltip(series, source, pointIndex);
    const isOutlined = series.datasetType === ChartType.SCATTER;
    const coordinates = { cx: this.#layout.xAt(source.x), cy: this.#layout.yAt(source.y) };

    if (isOutlined) {
      this.#surface.append("circle", {
        ...coordinates,
        r: radius,
        class: "charts2-point-halo",
        "aria-hidden": "true",
      });
    }

    const point = markMetadata(
      svg("circle", {
        ...coordinates,
        r: radius,
        fill: isOutlined ? "var(--charts-point-fill)" : series.dataset.color,
        stroke: isOutlined ? series.dataset.color : "none",
        opacity: series.dataset.opacity ?? (isOutlined ? 1 : BUBBLE_OPACITY),
        class: `charts2-${series.datasetType} charts2-visual-mark charts2-series-${series.datasetIndex % SERIES_CLASS_COUNT}`,
        "aria-hidden": "true",
      }),
      series.datasetIndex,
      pointIndex,
    );

    this.#surface.append(titled(point, tooltip.label));

    if (!this.#layout.usesInspector) {
      const hitTarget = { coordinates, radius, label: tooltip.label, pointIndex, tooltip };

      this.#renderPointHit(series, hitTarget);
    }
  }

  /**
   * Builds structured point-tooltip content through fluent formatter precedence.
   *
   * @param {object} series - Dataset, source index, and concrete point type.
   * @param {object} source - Normalized scatter or bubble point.
   * @param {number} pointIndex - Stable point index.
   * @returns {object} Heading, row, and plain accessible fallback.
   */
  #pointTooltip(series, source, pointIndex) {
    const context = {
      target: "tooltip",
      dataset: series.dataset,
      datasetIndex: series.datasetIndex,
      datasetName: series.dataset.name,
      index: pointIndex,
      point: source,
    };

    const rawCategory = this.#chart.labels[pointIndex] ?? source.x;
    const heading = formatLabel(this.#chart.options, rawCategory, context);
    const size = series.datasetType === ChartType.BUBBLE ? `, size ${formatNumber(source.r)}` : "";
    const value = `${formatValue(this.#chart.options, source.y, { ...context, label: rawCategory })}${size}`;
    const item = { name: series.dataset.name, value, color: series.dataset.color };

    return {
      heading: String(heading),
      item,
      label: `${this.#seriesPrefix(series.dataset)}${heading}: ${value}`,
    };
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
        "data-tooltip-anchor-x": target.coordinates.cx,
        "data-tooltip-anchor-y": target.coordinates.cy,
        class: `charts2-point-hit charts2-mark charts2-series-${series.datasetIndex % SERIES_CLASS_COUNT}`,
        style: `color:${series.dataset.color}`,
      }),
      series.datasetIndex,
      target.pointIndex,
    );

    if (target.tooltip) {
      hit.dataset.tooltipHeading = target.tooltip.heading;
      hit.dataset.tooltipItems = JSON.stringify([target.tooltip.item]);
    }

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
      const value = dataset.points[pointIndex].y;

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
        const value = dataset.points[pointIndex].y;

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
            radius: dataset.radius ?? this.#chart.options.radius ?? DEFAULT_BAR_RADIUS,
            shouldRoundValueEnd,
          },
        }),
        fill: dataset.color,
        opacity: dataset.opacity ?? 1,
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
          label: this.#chart.labels[pointIndex],
          value: point.y,
          dataset,
          datasetIndex,
          index: pointIndex,
          point,
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
