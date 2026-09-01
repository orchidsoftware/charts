import { ChartType, DEFAULT_BAR_RADIUS } from "../../support/Constants.js";
import { formatNumber, markMetadata, svg, titled } from "../../support/Dom.js";
import { linePath, roundedBarPath } from "../../support/geometry/Math.js";
import { formatLabel, formatValue } from "../../support/presentation/Formatting.js";
import { datasetSummary, tooltipText } from "../../support/presentation/Presentation.js";

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
  return local === undefined ? fallback : local;
}

/**
 * Resolves chart defaults and local line overrides once per dataset.
 */
class LinePresentation {
  /**
   * Captures the effective presentation for one line dataset.
   *
   * @param {object} dataset - Normalized line dataset.
   * @param {object} options - Chart-level line defaults.
   */
  constructor(dataset, options) {
    this.isSmooth = localValue(dataset.smooth, localValue(options.smooth, true));
    this.showsLine = localValue(dataset.line, localValue(options.line, true));
    this.showsDots = localValue(dataset.dots, options.dots !== false);
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
    return typeof this.gradient === "object" ? localValue(this.gradient[name], fallback) : fallback;
  }
}

/**
 * Prefixes mark text when a chart contains multiple datasets.
 *
 * @param {object} chart - Frozen chart snapshot.
 * @param {object} dataset - Dataset owning the mark.
 * @returns {string} Optional dataset prefix for accessible mark text.
 */
function seriesPrefix(chart, dataset) {
  return chart.datasets.length > 1 ? `${dataset.name}, ` : "";
}

/**
 * Formats one line point through dataset and chart formatter precedence.
 *
 * @param {object} rendering - Frozen chart snapshot and renderer collaborators.
 * @param {object} source - Dataset and point identity.
 * @returns {string} Formatted accessible line-point text.
 */
function linePointLabel(rendering, source) {
  const { chart } = rendering;
  const { dataset, datasetIndex, pointIndex, point } = source;

  return `${seriesPrefix(chart, dataset)}${tooltipText({
    options: chart.options,
    label: chart.labels[pointIndex],
    value: point.y,
    dataset,
    datasetIndex,
    index: pointIndex,
    point,
  })}`;
}

/**
 * Appends one transparent point-centered interaction target.
 *
 * @param {object} rendering - Renderer collaborators including the SVG surface.
 * @param {object} series - Dataset and source index.
 * @param {object} target - Coordinates, radius, metadata, and accessible label.
 * @returns {void} One hit target is appended.
 */
function renderPointHit(rendering, series, target) {
  const { surface } = rendering;

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
    hit.dataset.tooltipItems = JSON.stringify([
      target.tooltip.item,
    ]);
  }

  surface.append(titled(hit, target.label));
}

/**
 * Appends the optional fill below one line.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} entry - Dataset, source index, path, and presentation.
 * @returns {void} Area geometry is appended when enabled.
 */
function renderArea(rendering, entry) {
  const { chart, layout, surface } = rendering;
  const { dataset, datasetIndex, path, presentation } = entry;
  const baseline = layout.yAt(0);
  const lastX = layout.pointAt(dataset.points.at(-1), dataset.points.length - 1).x;
  const firstX = layout.pointAt(dataset.points[0], 0).x;
  const area = `${path} L${lastX},${baseline} L${firstX},${baseline} Z`;

  if (!presentation.gradient) {
    surface.append("path", {
      d: area,
      fill: dataset.color,
      opacity: dataset.opacity ?? DEFAULT_AREA_OPACITY,
      class: "charts2-area",
    });

    return;
  }

  const gradientId = `charts2-gradient-${chart.id}-${datasetIndex}`;
  const definition = svg("linearGradient", { id: gradientId, x1: 0, y1: 0, x2: 0, y2: 1 });
  definition.append(
    svg("stop", {
      offset: "0%",
      "stop-color": dataset.color,
      "stop-opacity": presentation.gradientOpacity("fromOpacity", DEFAULT_GRADIENT_FROM_OPACITY),
    }),
    svg("stop", {
      offset: "100%",
      "stop-color": dataset.color,
      "stop-opacity": presentation.gradientOpacity("toOpacity", 0),
    }),
  );
  const definitions = svg("defs");
  definitions.append(definition);
  surface.append(definitions);
  surface.append("path", { d: area, fill: `url(#${gradientId})`, class: "charts2-area" });
}

/**
 * Appends one accessible line stroke.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} entry - Dataset, source index, path, and presentation.
 * @returns {void} One line path is appended.
 */
function renderLineStroke(rendering, entry) {
  const { chart, layout, surface } = rendering;
  const { dataset, datasetIndex, path, presentation } = entry;
  const isDense = !layout.usesInspector && layout.type !== ChartType.AXIS_MIXED;

  surface.mark(
    "path",
    {
      d: path,
      fill: "none",
      stroke: dataset.color,
      "stroke-width": presentation.strokeWidth,
      opacity: dataset.opacity ?? 1,
      class: `${isDense ? "charts2-line charts2-mark" : "charts2-line"} charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
    },
    {
      dataset: datasetIndex,
      point: 0,
      title: datasetSummary(dataset, chart.labels, { options: chart.options, datasetIndex }),
    },
  );
}

/**
 * Appends visible line markers without additional tab stops.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} entry - Dataset, source index, and presentation.
 * @returns {void} Visible marker circles are appended.
 */
// eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
function renderVisibleLinePoints(rendering, entry) {
  const { layout, surface } = rendering;
  const { dataset, datasetIndex, presentation } = entry;

  for (const [
    pointIndex,
    point,
  ] of dataset.points.entries()) {
    const coordinates = layout.pointAt(point, pointIndex);
    const label = linePointLabel(rendering, { dataset, datasetIndex, pointIndex, point });

    surface.append("circle", {
      cx: coordinates.x,
      cy: coordinates.y,
      r: presentation.dotSize,
      class: "charts2-point-halo",
      "aria-hidden": "true",
    });
    surface.append(
      titled(
        markMetadata(
          svg("circle", {
            cx: coordinates.x,
            cy: coordinates.y,
            r: presentation.dotSize,
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
 * Appends one interaction target per independent mixed-line point.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} entry - Dataset, source index, and presentation.
 * @returns {void} Line hit targets are appended.
 */
function renderLineHits(rendering, entry) {
  const { layout } = rendering;
  const { dataset, datasetIndex, presentation } = entry;

  for (const [
    pointIndex,
    point,
  ] of dataset.points.entries()) {
    const { x, y } = layout.pointAt(point, pointIndex);

    renderPointHit(
      rendering,
      { dataset, datasetIndex },
      {
        coordinates: { cx: x, cy: y },
        radius: presentation.dotSize,
        label: linePointLabel(rendering, { dataset, datasetIndex, pointIndex, point }),
        pointIndex,
      },
    );
  }
}

/**
 * Appends one line dataset, including presentation and interaction marks.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} source - Dataset and stable source index.
 * @returns {void} One complete line dataset is appended.
 */
function renderLine(rendering, source) {
  const { chart, layout } = rendering;
  const { dataset } = source;
  const geometry = dataset.points.map((point, index) => layout.pointAt(point, index));
  const presentation = new LinePresentation(dataset, chart.options);
  const entry = { ...source, path: linePath(geometry, presentation.isSmooth), presentation };

  if (presentation.hasArea) {
    renderArea(rendering, entry);
  }

  if (presentation.showsLine) {
    renderLineStroke(rendering, entry);
  }

  if (layout.showsIndividualMarks && presentation.showsDots) {
    renderVisibleLinePoints(rendering, entry);
  }

  if (layout.type === ChartType.AXIS_MIXED && !layout.usesInspector) {
    renderLineHits(rendering, entry);
  }
}

/**
 * Builds structured tooltip content for one scatter or bubble point.
 *
 * @param {object} rendering - Renderer collaborators including the chart snapshot.
 * @param {object} state - Dataset, type, source point, and point index.
 * @returns {object} Structured and accessible tooltip content.
 */
function pointTooltip(rendering, state) {
  const { chart } = rendering;
  const { series, source, pointIndex } = state;

  const context = {
    target: "tooltip",
    dataset: series.dataset,
    datasetIndex: series.datasetIndex,
    datasetName: series.dataset.name,
    index: pointIndex,
    point: source,
  };

  const rawCategory = chart.labels[pointIndex] ?? source.x;
  const heading = formatLabel(chart.options, rawCategory, context);
  const size = series.datasetType === ChartType.BUBBLE ? `, size ${formatNumber(source.r)}` : "";
  const value = `${formatValue(chart.options, source.y, { ...context, label: rawCategory })}${size}`;
  const item = { name: series.dataset.name, value, color: series.dataset.color };

  return {
    heading: String(heading),
    item,
    label: `${seriesPrefix(chart, series.dataset)}${heading}: ${value}`,
  };
}

/**
 * Appends one scatter or bubble dataset.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} series - Dataset, source index, and concrete point type.
 * @returns {void} Point marks and hit targets are appended.
 */
// eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
function renderPoints(rendering, series) {
  const { layout, surface } = rendering;

  for (const [
    pointIndex,
    source,
  ] of series.dataset.points.entries()) {
    const radius = series.datasetType === ChartType.BUBBLE ? source.r : DEFAULT_POINT_RADIUS;
    const tooltip = pointTooltip(rendering, { series, source, pointIndex });
    const isOutlined = series.datasetType === ChartType.SCATTER;
    const coordinates = { cx: layout.xAt(source.x), cy: layout.yAt(source.y) };

    if (isOutlined) {
      surface.append("circle", {
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

    surface.append(titled(point, tooltip.label));

    if (!layout.usesInspector) {
      renderPointHit(rendering, series, { coordinates, radius, label: tooltip.label, pointIndex, tooltip });
    }
  }
}

/**
 * Resolves the signed value accumulated before one stacked bar.
 *
 * @param {object} layout - Cartesian layout and bar groups.
 * @param {object} state - Point and dataset coordinates.
 * @returns {number} Sum of preceding same-sign segments.
 */
function stackedBase(layout, state) {
  const { point, pointIndex, barDatasetIndex } = state;

  if (!layout.bars.isStacked) {
    return 0;
  }

  let base = 0;

  for (const dataset of layout.bars.datasets.slice(0, barDatasetIndex)) {
    const value = dataset.points[pointIndex].y;

    if (Math.sign(value) === Math.sign(point.y)) {
      base += value;
    }
  }

  return base;
}

/**
 * Detects a later same-sign segment in one stacked category.
 *
 * @param {object} layout - Cartesian layout and bar groups.
 * @param {object} state - Point and dataset coordinates.
 * @returns {boolean} Whether rounding belongs to a later segment.
 */
function hasLaterStackedSegment(layout, state) {
  const { point, pointIndex, barDatasetIndex } = state;

  return (
    layout.bars.isStacked &&
    layout.bars.datasets.slice(barDatasetIndex + 1).some((dataset) => {
      const value = dataset.points[pointIndex].y;

      return value !== 0 && Math.sign(value) === Math.sign(point.y);
    })
  );
}

/**
 * Resolves the transparent bar hit-stroke width.
 *
 * @param {object} layout - Cartesian interaction policy.
 * @param {object} geometry - Resolved bar geometry.
 * @returns {number} Non-negative hit-stroke width.
 */
function barHitStrokeWidth(layout, geometry) {
  return layout.usesInspector ? 0 : Math.max(0, (MINIMUM_BAR_HIT_THICKNESS - geometry.thickness) / 2);
}

/**
 * Appends one resolved bar mark.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} state - Dataset, point, metadata, geometry, and rounding policy.
 * @returns {void} One accessible bar path is appended.
 */
function renderBar(rendering, state) {
  const { chart, layout, surface } = rendering;
  const { dataset, datasetIndex, point, pointIndex, geometry, shouldRoundValueEnd } = state;

  surface.mark(
    "path",
    {
      d: roundedBarPath({
        rectangle: geometry,
        direction: { orientation: layout.orientation, value: point.y },
        rounding: {
          radius: dataset.radius ?? chart.options.radius ?? DEFAULT_BAR_RADIUS,
          shouldRoundValueEnd,
        },
      }),
      fill: dataset.color,
      opacity: dataset.opacity ?? 1,
      stroke: "transparent",
      "stroke-width": barHitStrokeWidth(layout, geometry),
      class: `charts2-bar ${layout.usesInspector ? "charts2-visual-mark" : "charts2-mark"} charts2-series-${datasetIndex % SERIES_CLASS_COUNT}`,
    },
    {
      dataset: datasetIndex,
      point: pointIndex,
      title: `${seriesPrefix(chart, dataset)}${tooltipText({
        options: chart.options,
        label: chart.labels[pointIndex],
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
 * Appends one grouped or stacked bar dataset.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} entry - Dataset and stable source index.
 * @returns {void} Bar paths are appended.
 */
function renderBars(rendering, entry) {
  const { layout } = rendering;
  const { dataset, datasetIndex } = entry;
  const barDatasetIndex = Math.max(0, layout.bars.datasets.indexOf(dataset));

  for (const [
    pointIndex,
    point,
  ] of dataset.points.entries()) {
    const position = { point, pointIndex, barDatasetIndex };

    const geometry = layout.barFor(point, {
      category: pointIndex,
      series: barDatasetIndex,
      base: stackedBase(layout, position),
    });

    const shouldRoundValueEnd = !layout.bars.isStacked || !hasLaterStackedSegment(layout, position);

    renderBar(rendering, { dataset, datasetIndex, point, pointIndex, geometry, shouldRoundValueEnd });
  }
}

/**
 * Renders only line-series code for a Cartesian chart.
 *
 * @param {object} rendering - Renderer collaborators.
 * @returns {void} Line datasets are appended.
 */
function renderLineSeries(rendering) {
  for (const [
    datasetIndex,
    dataset,
  ] of rendering.chart.datasets.entries()) {
    renderLine(rendering, { dataset, datasetIndex });
  }
}

/**
 * Renders only bar-series code for a Cartesian chart.
 *
 * @param {object} rendering - Renderer collaborators.
 * @returns {void} Bar datasets are appended.
 */
function renderBarSeries(rendering) {
  for (const [
    datasetIndex,
    dataset,
  ] of rendering.chart.datasets.entries()) {
    renderBars(rendering, { dataset, datasetIndex });
  }
}

/**
 * Renders only scatter or bubble series code for a Cartesian chart.
 *
 * @param {object} rendering - Renderer collaborators.
 * @returns {void} Point datasets are appended.
 */
function renderPointSeries(rendering) {
  for (const [
    datasetIndex,
    dataset,
  ] of rendering.chart.datasets.entries()) {
    renderPoints(rendering, { dataset, datasetIndex, datasetType: rendering.layout.type });
  }
}

/**
 * Renders mixed datasets in deterministic bar, line, then scatter order.
 *
 * @param {object} rendering - Renderer collaborators.
 * @returns {void} All mixed datasets are appended.
 */
function renderMixedSeries(rendering) {
  const entries = rendering.chart.datasets
    .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
    .toSorted(
      (left, right) => CARTESIAN_LAYER[left.dataset.chartType] - CARTESIAN_LAYER[right.dataset.chartType],
    );

  for (const entry of entries) {
    if (entry.dataset.chartType === ChartType.LINE) {
      renderLine(rendering, entry);

      continue;
    }

    if (
      [
        ChartType.BUBBLE,
        ChartType.SCATTER,
      ].includes(entry.dataset.chartType)
    ) {
      renderPoints(rendering, { ...entry, datasetType: entry.dataset.chartType });

      continue;
    }

    renderBars(rendering, entry);
  }
}

export { renderBarSeries, renderLineSeries, renderMixedSeries, renderPointSeries };
