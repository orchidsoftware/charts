import { ChartType, DEFAULT_BAR_RADIUS } from "../../support/Constants.js";
import { svg } from "../../support/Dom.js";
import { linePath, roundedBarPath } from "../../support/geometry/Math.js";
import { formatLabel, formatValue, seriesContext } from "../../support/presentation/Formatting.js";
import { formatNumber } from "../../support/presentation/NumberFormatting.js";
import { tooltipContent } from "../../support/presentation/Presentation.js";

const CARTESIAN_LAYER = Object.freeze({
  [ChartType.BAR]: 0,
  [ChartType.LINE]: 1,
  [ChartType.SCATTER]: 2,
});

const SERIES_CLASS_COUNT = 4;
const DEFAULT_LINE_MARKER_RADIUS = 3;
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
function seriesPointContent(rendering, source) {
  const { chart } = rendering;
  const { dataset, datasetIndex, pointIndex, point } = source;

  return tooltipContent({
    ...seriesContext(chart, datasetIndex, pointIndex),
    prefix: seriesPrefix(chart, dataset),
    options: chart.options,
    value: point.y,
  });
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
  const { visuals } = rendering;

  const content = target.tooltip.content ?? {
    heading: target.tooltip.heading,
    items: [
      target.tooltip.item,
    ],
  };

  rendering.surface.mark(
    "circle",
    {
      ...target.coordinates,
      r: Math.max(MINIMUM_POINT_HIT_RADIUS, target.radius),
      fill: "transparent",
      stroke: "transparent",
      class: `orchid-charts-point-hit orchid-charts-mark orchid-charts-series-${series.datasetIndex % SERIES_CLASS_COUNT}`,
      style: `color:${series.dataset.color}`,
    },
    {
      dataset: series.datasetIndex,
      point: target.pointIndex,
      title: target.label,
      tooltip: content,
      anchor: { x: target.coordinates.cx, y: target.coordinates.cy },
      visualElement: visuals[series.datasetIndex][target.pointIndex],
    },
  );
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
      class: "orchid-charts-area",
    });

    return;
  }

  const gradientId = `orchid-charts-gradient-${chart.id}-${datasetIndex}`;
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
  surface.append("path", { d: area, fill: `url(#${gradientId})`, class: "orchid-charts-area" });
}

/**
 * Appends one accessible line stroke.
 *
 * @param {object} rendering - Renderer collaborators.
 * @param {object} entry - Dataset, source index, path, and presentation.
 * @returns {void} One line path is appended.
 */
function renderLineStroke(rendering, entry) {
  const { surface, visuals } = rendering;
  const { dataset, datasetIndex, path, presentation } = entry;

  const visual = surface.append("path", {
    d: path,
    fill: "none",
    stroke: dataset.color,
    "stroke-width": presentation.strokeWidth,
    style: `stroke-width:var(--orchid-charts-stroke-width, ${presentation.strokeWidth}px)`,
    opacity: dataset.opacity ?? 1,
    class: `orchid-charts-line orchid-charts-series-${datasetIndex % SERIES_CLASS_COUNT}`,
  });

  visuals[datasetIndex] = dataset.points.map(() => visual);
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
  const { layout, surface, visuals } = rendering;
  const { dataset, datasetIndex, presentation } = entry;

  for (const [
    pointIndex,
    point,
  ] of dataset.points.entries()) {
    const coordinates = layout.pointAt(point, pointIndex);
    const label = seriesPointContent(rendering, { dataset, datasetIndex, pointIndex, point }).text;

    surface.append("circle", {
      cx: coordinates.x,
      cy: coordinates.y,
      r: presentation.dotSize,
      class: "orchid-charts-point-halo orchid-charts-line-point-halo",
      "aria-hidden": "true",
    });
    visuals[datasetIndex][pointIndex] = surface.mark(
      "circle",
      {
        cx: coordinates.x,
        cy: coordinates.y,
        r: presentation.dotSize,
        fill: "var(--orchid-charts-point-fill)",
        stroke: dataset.color,
        opacity: dataset.opacity ?? 1,
        class: `orchid-charts-point orchid-charts-visual-mark orchid-charts-series-${datasetIndex % SERIES_CLASS_COUNT}`,
        "aria-hidden": "true",
      },
      {
        kind: "visual",
        dataset: datasetIndex,
        point: pointIndex,
        title: label,
      },
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
    const content = seriesPointContent(rendering, { dataset, datasetIndex, pointIndex, point });

    renderPointHit(
      rendering,
      { dataset, datasetIndex },
      {
        coordinates: { cx: x, cy: y },
        radius: presentation.dotSize,
        tooltip: { content },
        label: content.text,
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
  const { chart, layout, visuals } = rendering;
  const { dataset } = source;
  const geometry = dataset.points.map((point, index) => layout.pointAt(point, index));
  const presentation = new LinePresentation(dataset, chart.options);
  visuals[source.datasetIndex] = [];
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

  const context = { ...seriesContext(chart, series.datasetIndex, pointIndex), target: "tooltip" };

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
  const { layout, surface, visuals } = rendering;

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
        class: "orchid-charts-point-halo",
        "aria-hidden": "true",
      });
    }

    visuals[series.datasetIndex] ??= [];
    visuals[series.datasetIndex][pointIndex] = surface.mark(
      "circle",
      {
        ...coordinates,
        r: radius,
        fill: isOutlined ? "var(--orchid-charts-point-fill)" : series.dataset.color,
        stroke: isOutlined ? series.dataset.color : "none",
        opacity: series.dataset.opacity ?? (isOutlined ? 1 : BUBBLE_OPACITY),
        class: `orchid-charts-${series.datasetType} orchid-charts-visual-mark orchid-charts-series-${series.datasetIndex % SERIES_CLASS_COUNT}`,
        "aria-hidden": "true",
      },
      {
        kind: "visual",
        dataset: series.datasetIndex,
        point: pointIndex,
        title: tooltip.label,
      },
    );

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
  const { chart, layout, surface, visuals } = rendering;
  const { dataset, datasetIndex, point, pointIndex, geometry, shouldRoundValueEnd } = state;

  visuals[datasetIndex] ??= [];
  visuals[datasetIndex][pointIndex] = surface.mark(
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
      class: `orchid-charts-bar ${layout.usesInspector ? "orchid-charts-visual-mark" : "orchid-charts-mark"} orchid-charts-series-${datasetIndex % SERIES_CLASS_COUNT}`,
    },
    {
      kind: layout.usesInspector ? "visual" : "point",
      dataset: datasetIndex,
      point: pointIndex,
      title: seriesPointContent(rendering, { dataset, datasetIndex, pointIndex, point }),
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
