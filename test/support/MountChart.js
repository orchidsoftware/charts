import {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../../src/index.js";

const DEFINITIONS = Object.freeze({
  bar: BarChart,
  bubble: BubbleChart,
  donut: DonutChart,
  heatmap: HeatmapChart,
  line: LineChart,
  mixed: MixedChart,
  percentage: PercentageChart,
  pie: PieChart,
  "polar-area": PolarAreaChart,
  radar: RadarChart,
  scatter: ScatterChart,
  timesheet: TimesheetChart,
});

const DIRECT_METHODS = Object.freeze([
  "ariaLabel",
  "area",
  "axes",
  "colors",
  "cornerRadius",
  "countLabel",
  "description",
  "dots",
  "dotSize",
  "formatDate",
  "formatDuration",
  "formatLabel",
  "formatTick",
  "formatValue",
  "gradient",
  "grid",
  "height",
  "legend",
  "line",
  "maxSlices",
  "onSelect",
  "padAngle",
  "radius",
  "smooth",
  "stacked",
  "startAngle",
  "strokeWidth",
  "title",
  "tooltip",
  "valueLabels",
  "width",
]);
const SCOPED_OPTIONS = Object.freeze([
  "axisFormatValue",
  "orientation",
  "tooltipFormatDate",
  "tooltipFormatDuration",
  "tooltipFormatLabel",
  "tooltipFormatValue",
  "yAxisPosition",
]);
const SUPPORTED_OPTIONS = new Set(["data", "type", ...DIRECT_METHODS, ...SCOPED_OPTIONS]);

/**
 * Keeps product scenarios on the public fluent vocabulary.
 *
 * @param {object} options - Scenario options to verify.
 * @returns {void} Every option maps to a public builder method or scope.
 */
function assertSupportedOptions(options) {
  const unsupported = Object.keys(options).find((name) => !SUPPORTED_OPTIONS.has(name));

  if (unsupported) {
    throw new TypeError(`Unsupported chart option: ${unsupported}`);
  }
}

/**
 * Adds one canonical data scene through its public chart-family vocabulary.
 *
 * @param {object} builder - Public family builder.
 * @param {string} type - Canonical chart type.
 * @param {object} data - Test data passed without compatibility coercion.
 * @returns {void} Builder contains the supplied public data.
 */
function addData(builder, type, data) {
  if (type === "heatmap") {
    if (data?.start !== undefined || data?.end !== undefined) {
      builder.range(data.start, data.end);
    }
    builder.points(data?.points);

    return;
  }

  if (type === "timesheet") {
    if (data?.start !== undefined || data?.end !== undefined) {
      builder.range(data.start, data.end);
    }
    const tasks = data?.tasks ?? [];

    for (const task of tasks) {
      builder.task(task);
    }

    return;
  }

  if (data?.labels !== undefined) {
    builder.labels(data.labels);
  }
  const datasets = data?.datasets ?? [];
  const markers = data?.markers ?? [];
  const regions = data?.regions ?? [];

  for (const dataset of datasets) {
    builder.dataset(dataset);
  }
  for (const marker of markers) {
    builder.marker(marker);
  }
  for (const region of regions) {
    builder.region(region);
  }
}

/**
 * Applies direct chart-wide methods shared by test scenarios.
 *
 * @param {object} builder - Public family builder.
 * @param {object} options - Canonical scenario options.
 * @returns {void} Supported direct values are authored unchanged.
 */
function applyDirectOptions(builder, options) {
  for (const name of DIRECT_METHODS) {
    if (options[name] === undefined) {
      continue;
    }

    if (typeof builder[name] !== "function") {
      throw new TypeError(`Unsupported chart option for this family: ${name}`);
    }

    builder[name](options[name]);
  }
}

/**
 * Applies the few canonical settings represented by scoped public methods.
 *
 * @param {object} builder - Public family builder.
 * @param {object} options - Canonical scenario options.
 * @returns {void} Scoped formatters retain their public ownership.
 */
function applyScopedOptions(builder, options) {
  if (options.orientation !== undefined && !["horizontal", "vertical"].includes(options.orientation)) {
    throw new TypeError("Chart orientation must be horizontal or vertical");
  }

  if (options.orientation === "horizontal") {
    builder.horizontal();
  }

  if (options.yAxisPosition !== undefined || options.axisFormatValue !== undefined) {
    builder.yAxis((axis) => {
      if (options.yAxisPosition !== undefined) {
        axis.position(options.yAxisPosition);
      }
      if (options.axisFormatValue !== undefined) {
        axis.formatValue(options.axisFormatValue);
      }
    });
  }

  const hasTooltipFormatters = [
    options.tooltipFormatDate,
    options.tooltipFormatDuration,
    options.tooltipFormatLabel,
    options.tooltipFormatValue,
  ].some((formatter) => formatter !== undefined);

  if (hasTooltipFormatters) {
    builder.tooltip((tooltip) => {
      if (options.tooltipFormatDate !== undefined) {
        tooltip.formatDate(options.tooltipFormatDate);
      }
      if (options.tooltipFormatDuration !== undefined) {
        tooltip.formatDuration(options.tooltipFormatDuration);
      }
      if (options.tooltipFormatLabel !== undefined) {
        tooltip.formatLabel(options.tooltipFormatLabel);
      }
      if (options.tooltipFormatValue !== undefined) {
        tooltip.formatValue(options.tooltipFormatValue);
      }
    });
  }
}

/**
 * Mounts a test scenario exclusively through the shipped package boundary.
 *
 * @param {string | Element} parent - Test chart host.
 * @param {object} options - Canonical chart type, data, and presentation.
 * @returns {import("../../src/index.js").Chart} Mounted public chart lifecycle.
 */
export default function mountChart(parent, options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Chart options must be an object");
  }

  assertSupportedOptions(options);
  const { type } = options;
  const definition = DEFINITIONS[type];

  if (!definition) {
    throw new TypeError(`Chart type must be one of: ${Object.keys(DEFINITIONS).join(", ")}`);
  }

  const builder = definition.make(parent);
  applyDirectOptions(builder, options);
  applyScopedOptions(builder, options);
  addData(builder, type, options.data);

  const chart = builder.render();

  return chart;
}
