import {
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  VALUE_LABEL_GAP,
  SERIES_SWATCH_DIAMETER,
  LEGEND_LABEL_GAP,
  LEGEND_ROW_HEIGHT,
  AGGREGATION_INSET,
  AGGREGATION_LEGEND_BASELINE_INSET,
  AGGREGATION_LEGEND_GAP,
} from "../Constants.js";
import { formatNumber, truncateText, measuredTextWidth, measuredLegendTextWidth } from "../Dom.js";
import { extent } from "../geometry/Math.js";

import { formatLabel, formatValue } from "./Formatting.js";

const AGGREGATION_MINIMUM_CONTENT_HEIGHT = 8;
const HORIZONTAL_LABEL_MAXIMUM_PADDING = 176;
const HORIZONTAL_LABEL_MINIMUM_PADDING = 24;
const HORIZONTAL_LABEL_WIDTH_RATIO = 0.42;
const HORIZONTAL_MULTILINE_LABEL_WIDTH_RATIO = 0.55;
const INITIAL_LEGEND_ROW_COUNT = 1;
const LEGEND_ITEM_GAP = 16;
const LEGEND_LEFT_INSET = 12;
const LEGEND_MAXIMUM_LABEL_WIDTH = 160;
const LEGEND_RIGHT_INSET = 8;
const VALUE_LABEL_TRAILING_INSET = 4;
const DATASET_SUMMARY_LIMIT = 12;

/**
 * Maps one heatmap value onto the complete ordered intensity palette.
 *
 * @param {number} value - Normalized heatmap value.
 * @param {[number, number]} domain - Complete data minimum and maximum.
 * @param {number} colorCount - Number of supplied intensity colors.
 * @returns {number} Bounded zero-based palette bucket.
 */
function intensityLevel(
  value,
  [
    minimum,
    maximum,
  ],
  colorCount,
) {
  if (minimum === maximum) {
    return value === 0 ? 0 : colorCount - 1;
  }

  const ratio = (value - minimum) / (maximum - minimum);

  return Math.min(colorCount - 1, Math.floor(ratio * colorCount));
}

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

  return Math.max(basePadding, Math.ceil(maximumLabelWidth + VALUE_LABEL_GAP + VALUE_LABEL_TRAILING_INSET));
}

/**
 * Packs legend items into deterministic rows using measured visible labels.
 *
 * @param {number} width - Available legend width in pixels.
 * @param {Array<{label: string}>} items - Ordered legend entries to position.
 * @returns {{labelOffset: number, positions: Array<object>, rows: number}} Shared label offset, item positions, and occupied row count.
 */
function legendLayout(width, items) {
  const left = LEGEND_LEFT_INSET;
  const right = LEGEND_RIGHT_INSET;
  const labelOffset = SERIES_SWATCH_DIAMETER + LEGEND_LABEL_GAP;
  const itemGap = LEGEND_ITEM_GAP;
  const maximumItemWidth = Math.max(1, width - left - right);
  let x = LEGEND_LEFT_INSET;
  let rows = INITIAL_LEGEND_ROW_COUNT;

  const positions = items.map((item) => {
    const labelMaxWidth = Math.max(1, Math.min(LEGEND_MAXIMUM_LABEL_WIDTH, maximumItemWidth - labelOffset));
    const visibleLabel = truncateText(item.label, labelMaxWidth);
    const itemWidth = Math.min(maximumItemWidth, labelOffset + measuredLegendTextWidth(visibleLabel));

    if (x + itemWidth > width - LEGEND_RIGHT_INSET && x > LEGEND_LEFT_INSET) {
      x = left;
      rows += 1;
    }

    const position = { itemWidth, labelMaxWidth, x, yOffset: (rows - 1) * LEGEND_ROW_HEIGHT };
    x += itemWidth + itemGap;

    return position;
  });

  return {
    labelOffset,
    positions,
    rows,
  };
}

/**
 * Divides aggregation charts between visualization content and an optional legend.
 *
 * @param {object} specification - Aggregation viewport and legend settings.
 * @param {number} specification.width - Available chart width in pixels.
 * @param {number} specification.height - Available chart height in pixels.
 * @param {Array<{label: string}>} specification.items - Legend entries used to calculate row count.
 * @param {boolean} specification.legend - Whether layout must reserve legend space.
 * @returns {{contentTop: number, contentBottom: number, contentHeight: number, legendBaseline: number | null}} Vertical content bounds and optional legend baseline.
 */
function aggregationLayout({ width, height, items, legend }) {
  const legendRows = legend ? legendLayout(width, items).rows : 0;

  const legendBaseline =
    legendRows > 0 ? height - AGGREGATION_LEGEND_BASELINE_INSET - (legendRows - 1) * LEGEND_ROW_HEIGHT : null;

  const contentTop = AGGREGATION_INSET;

  const requestedBottom =
    legendBaseline === null ? height - AGGREGATION_INSET : legendBaseline - AGGREGATION_LEGEND_GAP;

  const contentBottom = Math.max(contentTop + AGGREGATION_MINIMUM_CONTENT_HEIGHT, requestedBottom);

  return {
    contentTop,
    contentBottom,
    contentHeight: contentBottom - contentTop,
    legendBaseline,
  };
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
 * Formats a tooltip pair through caller hooks and a stable numeric fallback.
 *
 * @param {object} content - Source values and formatting options for one tooltip pair.
 * @param {object} content.options - Chart options containing optional tooltip formatters.
 * @param {unknown} content.label - Source x or category value.
 * @param {number} content.value - Numeric y value to present.
 * @param {string} [content.suffix=""] - Unit or contextual text appended to the value.
 * @param {object} [content.dataset] - Dataset-local formatter owner.
 * @param {number} [content.datasetIndex] - Stable dataset position.
 * @param {number} [content.index] - Stable point position.
 * @param {object} [content.point] - Normalized source point.
 * @returns {string} Complete tooltip text in `label: value` form.
 */
function tooltipText(content) {
  const { options, label, value, suffix = "", dataset, datasetIndex, index, point } = content;
  const x = formatLabel(options, label, { target: "tooltip", datasetIndex, index, point });
  const y = formatValue(options, value, { target: "tooltip", dataset, datasetIndex, index, label, point });

  return `${x}: ${y}${suffix}`;
}

export {
  intensityLevel,
  formatCategoryLabel,
  horizontalCategoryPadding,
  verticalValuePadding,
  legendLayout,
  aggregationLayout,
  datasetSummary,
  tooltipText,
};
