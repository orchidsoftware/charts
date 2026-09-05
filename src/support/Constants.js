const SVG_NS = "http://www.w3.org/2000/svg";

const ChartType = Object.freeze({
  LINE: "line",
  BAR: "bar",
  SCATTER: "scatter",
  AXIS_MIXED: "mixed",
  BUBBLE: "bubble",
  PIE: "pie",
  DONUT: "donut",
  PERCENTAGE: "percentage",
  RADAR: "radar",
  POLAR_AREA: "polar-area",
  HEATMAP: "heatmap",
  TIMESHEET: "timesheet",
});

const ChartOrientation = Object.freeze({
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
});

const YAxisPosition = Object.freeze({
  LEFT: "left",
  RIGHT: "right",
});

const CHART_ORIENTATIONS = Object.freeze(Object.values(ChartOrientation));
const Y_AXIS_POSITIONS = Object.freeze(Object.values(YAxisPosition));

const DEFAULT_COLORS = Object.freeze([
  "#007AFF",
  "#AF52DE",
  "#FF3B30",
  "#FF9500",
  "#248A3D",
  "#5856D6",
  "#008C95",
]);

const HEATMAP_COLORS = Object.freeze([
  "#E5E5EA",
  "#B7E4C7",
  "#74C69D",
  "#40916C",
  "#1B6B47",
]);

const CARTESIAN_TYPES = Object.freeze([
  ChartType.LINE,
  ChartType.BAR,
  ChartType.SCATTER,
  ChartType.AXIS_MIXED,
  ChartType.BUBBLE,
]);

const AGGREGATION_TYPES = Object.freeze([
  ChartType.PIE,
  ChartType.DONUT,
  ChartType.PERCENTAGE,
]);

const TYPES = Object.freeze([
  ...CARTESIAN_TYPES,
  ...AGGREGATION_TYPES,
  ChartType.RADAR,
  ChartType.POLAR_AREA,
  ChartType.HEATMAP,
  ChartType.TIMESHEET,
]);

const MAJOR_GRID_DIVISIONS = 4;
const MAX_INDIVIDUAL_LINE_POINTS = 40;
const MAX_X_INSPECTOR_POINTS = 64;
const HORIZONTAL_LABEL_EDGE_INSET = 0;
const HORIZONTAL_LABEL_GAP = 4;
const VALUE_LABEL_GAP = 5;
const SERIES_SWATCH_DIAMETER = 8;
const LEGEND_LABEL_GAP = 8;
const LEGEND_ROW_HEIGHT = 20;
const AGGREGATION_LEGEND_BASELINE_INSET = 3;
const AGGREGATION_LEGEND_GAP = 20;
const MULTILINE_LABEL_HEIGHT = 13;
const POLAR_LABEL_EDGE_INSET = 12;
const POLAR_LABEL_GAP = 14;
const POLAR_LABEL_MIN_WIDTH = 44;
const DEFAULT_PAD_ANGLE = 1.5;
const DEFAULT_BAR_RADIUS = 3;
const DEFAULT_SECTOR_CORNER_RADIUS = 4;
const DEFAULT_PERCENTAGE_RADIUS = 6;
const MIN_SECTOR_SWEEP = 0.001;
const HEATMAP_MIN_CELL_WIDTH = 16;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const TIME_TICK_STEPS = Object.freeze([
  HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
  30 * DAY,
  90 * DAY,
  365 * DAY,
]);

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const SMALL_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 });
const STANDARD_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export {
  SVG_NS,
  ChartType,
  ChartOrientation,
  YAxisPosition,
  CHART_ORIENTATIONS,
  Y_AXIS_POSITIONS,
  DEFAULT_COLORS,
  HEATMAP_COLORS,
  CARTESIAN_TYPES,
  AGGREGATION_TYPES,
  TYPES,
  MAJOR_GRID_DIVISIONS,
  MAX_INDIVIDUAL_LINE_POINTS,
  MAX_X_INSPECTOR_POINTS,
  HORIZONTAL_LABEL_EDGE_INSET,
  HORIZONTAL_LABEL_GAP,
  VALUE_LABEL_GAP,
  SERIES_SWATCH_DIAMETER,
  LEGEND_LABEL_GAP,
  LEGEND_ROW_HEIGHT,
  AGGREGATION_LEGEND_BASELINE_INSET,
  AGGREGATION_LEGEND_GAP,
  MULTILINE_LABEL_HEIGHT,
  POLAR_LABEL_EDGE_INSET,
  POLAR_LABEL_GAP,
  POLAR_LABEL_MIN_WIDTH,
  DEFAULT_PAD_ANGLE,
  DEFAULT_BAR_RADIUS,
  DEFAULT_SECTOR_CORNER_RADIUS,
  DEFAULT_PERCENTAGE_RADIUS,
  MIN_SECTOR_SWEEP,
  HEATMAP_MIN_CELL_WIDTH,
  HOUR,
  DAY,
  TIME_TICK_STEPS,
  COMPACT_NUMBER_FORMATTER,
  SMALL_NUMBER_FORMATTER,
  STANDARD_NUMBER_FORMATTER,
};
