import {
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  VALUE_LABEL_GAP,
  LEGEND_LABEL_OFFSET,
  LEGEND_ROW_HEIGHT,
  LEGEND_BASELINE_INSET,
  LEGEND_CONTENT_GAP,
} from "../Constants.js";
import { formatNumber, truncateText, measuredTextWidth, measuredLegendTextWidth } from "../Dom.js";
import { extent } from "../geometry/Math.js";

import { formatLabel, formatValue } from "./Formatting.js";

const MINIMUM_CONTENT_HEIGHT = 8;
const HORIZONTAL_LABEL_MAXIMUM_PADDING = 176;
const HORIZONTAL_LABEL_MINIMUM_PADDING = 24;
const HORIZONTAL_LABEL_WIDTH_RATIO = 0.42;
const HORIZONTAL_MULTILINE_LABEL_WIDTH_RATIO = 0.55;
const LEGEND_ITEM_GAP = 16;
const LEGEND_MAXIMUM_LABEL_WIDTH = 160;
const DATASET_SUMMARY_LIMIT = 12;

/**
 * Applies the optional category formatter and validates its display contract.
 *
 * @param {object} options - Chart options containing axis orientation and formatter hooks.
 * @param {unknown} label - Original category value supplied by the dataset.
 * @param {number} index - Zero-based category position.
 * @returns {string | string[]} Validated single-line or multi-line category label.
 * @throws {TypeError} When a formatter returns an unsupported value.
 */
function formatCategoryLabel(options, label, index) {
  return formatLabel(options, label, { target: "axis", index });
}

/**
 * Reserves enough left-side space for bounded horizontal category labels.
 *
 * @param {Array<string | string[]>} labels - Formatted labels that appear beside bars.
 * @param {number} width - Total chart width in pixels.
 * @returns {number} Clamped left padding required by the widest visible label.
 */
function horizontalCategoryPadding(labels, width) {
  const widthRatio = labels.some((label) => Array.isArray(label))
    ? HORIZONTAL_MULTILINE_LABEL_WIDTH_RATIO
    : HORIZONTAL_LABEL_WIDTH_RATIO;

  const maximum = Math.max(
    HORIZONTAL_LABEL_MINIMUM_PADDING,
    Math.min(HORIZONTAL_LABEL_MAXIMUM_PADDING, width * widthRatio),
  );

  const maximumLabelWidth = maximum - HORIZONTAL_LABEL_EDGE_INSET - HORIZONTAL_LABEL_GAP;

  const displayedWidths = labels.map((label) => {
    const lines = Array.isArray(label)
      ? label
      : [
          String(label),
        ];

    return Math.min(
      maximumLabelWidth,
      Math.ceil(Math.max(...lines.map((line) => measuredTextWidth(line.trim())))),
    );
  });

  return Math.max(
    HORIZONTAL_LABEL_MINIMUM_PADDING,
    Math.min(maximum, HORIZONTAL_LABEL_EDGE_INSET + Math.max(0, ...displayedWidths) + HORIZONTAL_LABEL_GAP),
  );
}

/**
 * Expands value-axis padding to prevent formatted ticks from clipping.
 *
 * @param {number[]} ticks - Values rendered along the vertical axis.
 * @param {number} basePadding - Minimum padding required by the chart layout.
 * @returns {number} Pixel padding large enough for the widest tick label.
 */
function verticalValuePadding(ticks, basePadding) {
  const maximumLabelWidth = Math.max(0, ...ticks.map((value) => measuredTextWidth(formatNumber(value))));

  return Math.max(basePadding, Math.ceil(maximumLabelWidth + VALUE_LABEL_GAP));
}

/**
 * Divides charts between visualization content and an optional legend.
 *
 * @param {object} specification - Aggregation viewport and legend settings.
 * @param {number} specification.width - Available chart width in pixels.
 * @param {number} specification.height - Available chart height in pixels.
 * @param {Array<{label: string}>} specification.items - Legend entries used to calculate row count.
 * @param {boolean} specification.legend - Whether layout must reserve legend space.
 * @returns {object} Content bounds and a measured bottom legend shared with the renderer.
 */
function chartContentLayout({ width, height, items, legend }) {
  const labelMaxWidth = Math.max(1, Math.min(LEGEND_MAXIMUM_LABEL_WIDTH, width - LEGEND_LABEL_OFFSET));
  let x = 0;
  let rows = 1;

  const entries = items.map((item) => {
    const label = item.label ?? item.name;
    const visibleLabel = truncateText(label, labelMaxWidth);
    const itemWidth = LEGEND_LABEL_OFFSET + measuredLegendTextWidth(visibleLabel);

    if (x + itemWidth > width && x > 0) {
      x = 0;
      rows += 1;
    }

    const position = { label, color: item.color, labelMaxWidth, x, yOffset: (rows - 1) * LEGEND_ROW_HEIGHT };
    x += itemWidth + LEGEND_ITEM_GAP;

    return position;
  });

  const legendBaseline = legend ? height - LEGEND_BASELINE_INSET - (rows - 1) * LEGEND_ROW_HEIGHT : null;
  const requestedBottom = legendBaseline === null ? height : legendBaseline - LEGEND_CONTENT_GAP;

  return {
    items: entries,
    legendBaseline,
    contentHeight: Math.max(MINIMUM_CONTENT_HEIGHT, requestedBottom),
  };
}

/**
 * Shares series legend visibility, entries, and bottom placement across families.
 *
 * @param {object} chart - Frozen chart snapshot.
 * @returns {object} Content bounds and measured legend layout.
 */
function seriesContentLayout(chart) {
  return chartContentLayout({
    width: chart.options.width,
    height: chart.options.height,
    items: chart.datasets,
    legend: chart.options.legend && chart.datasets.length > 1,
  });
}

/**
 * Summarizes a dataset for accessibility without overwhelming long series.
 *
 * @param {{name: string, points: Array<{x: number, y: number}>}} dataset - Normalized series to describe.
 * @param {unknown[]} labels - Optional category values corresponding to points.
 * @param {object} [formatting={}] - Formatter options and stable dataset identity.
 * @param {object} [formatting.options={}] - Chart-level formatter options.
 * @param {number} [formatting.datasetIndex=0] - Stable dataset position.
 * @returns {string} Detailed short-series summary or bounded long-series statistics.
 */
function datasetSummary(dataset, labels, { options = {}, datasetIndex = 0 } = {}) {
  const formatPoint = (point, index) => {
    const label = formatLabel(options, labels[index] ?? point.x, {
      target: "accessibility",
      datasetIndex,
      index,
      point,
    });

    const value = formatValue(options, point.y, {
      target: "accessibility",
      dataset,
      datasetIndex,
      index,
      label: labels[index] ?? point.x,
      point,
    });

    return `${label}: ${value}`;
  };

  if (dataset.points.length > DATASET_SUMMARY_LIMIT) {
    const [
      minimum,
      maximum,
    ] = extent(dataset.points.map((point) => point.y));

    const first = formatPoint(dataset.points[0], 0);
    const last = formatPoint(dataset.points.at(-1), dataset.points.length - 1);

    return `${dataset.name}: ${dataset.points.length} points · ${first} · ${last} · range ${formatNumber(minimum)}–${formatNumber(maximum)}`;
  }

  const values = dataset.points.map((point, index) => formatPoint(point, index));

  return `${dataset.name}: ${values.join(", ")}`;
}

/**
 * Formats one tooltip row without encoding its structure in display text.
 *
 * @param {object} content - Formatting inputs, color, suffix and accessible prefix.
 * @returns {object} Structured tooltip rows and independent accessible text.
 */
function tooltipContent(content) {
  const { options, label, value, suffix = "", dataset, datasetIndex, index, point } = content;
  const name = formatLabel(options, label, { target: "tooltip", datasetIndex, index, point });

  const formatted = formatValue(options, value, {
    target: "tooltip",
    dataset,
    datasetIndex,
    index,
    label,
    point,
  });

  const displayValue = `${formatted}${suffix}`;

  return {
    text: `${content.prefix ?? ""}${name}: ${displayValue}`,
    heading: "",
    items: [
      { name: `${content.prefix ?? ""}${name}`, value: displayValue, color: content.color ?? dataset?.color },
    ],
  };
}

export {
  formatCategoryLabel,
  horizontalCategoryPadding,
  verticalValuePadding,
  chartContentLayout,
  seriesContentLayout,
  datasetSummary,
  tooltipContent,
};
