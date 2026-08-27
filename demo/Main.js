import { createChart } from "../src/index.js";

import buildSize from "./BuildSize.js";

/*
 * Build metadata
 */

/**
 * Formats a byte count as a compact decimal size for the hero metrics.
 *
 * @param {number} bytes - Build size measured in bytes.
 * @returns {string} Human-readable size using decimal kilobytes.
 */
function formatBundleSize(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

const bundleSizeValue = document.querySelector("#bundle-size-value");
const bundleSizeGzip = document.querySelector("#bundle-size-gzip");
if (bundleSizeValue && bundleSizeGzip) {
  bundleSizeValue.textContent = formatBundleSize(buildSize.rawBytes);
  bundleSizeGzip.textContent = `(${formatBundleSize(buildSize.gzipBytes)} gzip)`;
}

/*
 * Shared presentation helpers
 */

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const denseLabels = Array.from({ length: 48 }, (_, index) => `W${String(index + 1).padStart(2, "0")}`);
const denseValues = denseLabels.map((_, index) =>
  Math.round(42 + Math.sin(index / 3) * 18 + Math.cos(index / 7) * 9 + index * 0.6),
);
const updatableCharts = [];

/**
 * Formats values consistently across chart labels, tooltips, and selections.
 *
 * @param {number} value - Numeric value displayed by the demo.
 * @returns {string} Locale-aware value with precision suited to its magnitude.
 */
function formatDemoValue(value) {
  const absolute = Math.abs(value);
  if (absolute >= 10_000) {
    return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }
  if (absolute > 0 && absolute < 0.01) {
    return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 }).format(value);
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

/**
 * Creates an accessible live-region reporter for a selectable chart.
 *
 * @param {string} selector - Selector of the chart host receiving selection feedback.
 * @returns {(detail: object) => void} Callback that announces the selected chart value.
 */
function selectionReporter(selector) {
  const host = document.querySelector(selector);
  const status = document.createElement("p");
  status.className = "selection-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Click a value, or press Enter, to keep its tooltip open.";
  host.after(status);
  return (detail) => {
    const series = detail.dataset ? `${detail.dataset} · ` : "";
    const label = detail.label ?? detail.key ?? `Point ${detail.index + 1}`;
    const value =
      detail.value === undefined
        ? detail.values
            ?.filter((item) => item !== undefined)
            .map((item) => formatDemoValue(item))
            .join(", ")
        : formatDemoValue(detail.value);
    status.textContent = `${series}${label}: ${value}`;
  };
}

/*
 * Product showcase: recognizable questions and chart choices
 */

export const showcaseSpecs = [
  [
    "#line",
    {
      type: "line",
      height: 320,
      tooltipOptions: { formatTooltipY: (value) => `${formatDemoValue(value)}k` },
      onSelect: selectionReporter("#line"),
      ariaLabel: "Monthly App Store downloads, plan, and previous year",
      description:
        "Downloads trend upward across the year; values are shown in thousands and the plan and previous-year series provide context.",
      data: {
        labels: months,
        datasets: [
          { name: "Downloads", values: [42.1, 46.8, 44.5, 53.2, 57.9, 61.4, 59.8, 68.3, 71.6, 76.2, 79.4, 84.2] },
          { name: "Plan", values: [44, 47, 49, 53, 56, 60, 63, 67, 71, 75, 80, 85] },
          { name: "Previous year", values: [35, 39, 41, 45, 48, 52, 54, 57, 61, 65, 69, 73] },
        ],
      },
    },
  ],
  [
    "#line-gradient",
    {
      type: "line",
      height: 300,
      gradient: true,
      ariaLabel: "Monthly subscriber growth for three plans",
      description: "Free, Individual, and Family plans share the same monthly subscriber scale.",
      data: {
        labels: months,
        datasets: [
          { name: "Free", color: "#2490ef", values: [22, 27, 31, 35, 40, 45, 51, 57, 63, 70, 76, 82] },
          { name: "Individual", color: "#af52de", values: [14, 17, 21, 25, 30, 35, 40, 46, 51, 56, 61, 65] },
          { name: "Family", color: "#ff9500", values: [6, 8, 11, 14, 17, 20, 24, 28, 31, 34, 37, 40] },
        ],
      },
    },
  ],
  [
    "#bar-vertical",
    {
      type: "bar",
      height: 260,
      ariaLabel: "Notifications received from Messages Calendar and Home this week",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          { name: "Messages", values: [18, 24, 21, 31, 28, 16, 12] },
          { name: "Calendar", values: [6, 8, 5, 7, 9, 2, 1] },
          { name: "Home", values: [4, 6, 3, 8, 5, 7, 6] },
        ],
      },
    },
  ],
  [
    "#bar-horizontal",
    {
      type: "bar",
      height: 250,
      orientation: "horizontal",
      tooltipOptions: { formatTooltipY: (value) => `${formatDemoValue(value)} h` },
      ariaLabel: "Standard and express delivery time by region in hours",
      data: {
        labels: ["North America", "Europe", "Asia-Pacific", "Latin America"],
        datasets: [
          { name: "Standard", color: "#2490ef", values: [42, 36, 54, 61] },
          { name: "Express", color: "#ff9500", values: [18, 16, 24, 28] },
        ],
      },
    },
  ],
  [
    "#bar-horizontal-stacked",
    {
      type: "bar",
      height: 250,
      orientation: "horizontal",
      barOptions: { stacked: true },
      ariaLabel: "Orders by channel and fulfillment status",
      data: {
        labels: ["Online Store", "Retail pickup", "Marketplace", "Partner"],
        datasets: [
          { name: "Shipped", color: "#248a3d", values: [52, 38, 49, 12] },
          { name: "Processing", color: "#2490ef", values: [14, 9, 18, 5] },
          { name: "Delayed", color: "#ff9500", values: [4, 3, 7, 3] },
        ],
      },
    },
  ],
  [
    "#scatter",
    {
      type: "scatter",
      height: 260,
      tooltipOptions: { formatTooltipY: (value) => `${formatDemoValue(value)} h` },
      ariaLabel: "Battery life by device price for phones and tablets",
      data: {
        labels: ["$699", "$799", "$899", "$999", "$1,099", "$1,199"],
        datasets: [
          { name: "Phone", values: [18, 20, 22, 24, 26, 28] },
          { name: "Tablet", values: [24, 26, 29, 31, 34, 36] },
        ],
      },
    },
  ],
  [
    "#bubble",
    {
      type: "bubble",
      height: 300,
      ariaLabel: "Weekly reach and installed size across an app portfolio",
      data: {
        labels: ["Photos", "Music", "Maps", "Fitness", "Notes"],
        datasets: [
          {
            name: "Weekly users",
            color: "#af52de",
            values: [
              { x: 1, y: 78, r: 23 },
              { x: 2, y: 64, r: 18 },
              { x: 3, y: 57, r: 14 },
              { x: 4, y: 41, r: 10 },
              { x: 5, y: 36, r: 7 },
            ],
          },
        ],
      },
    },
  ],
  [
    "#radar",
    {
      type: "radar",
      height: 320,
      ariaLabel: "Current and previous phone comparison",
      data: {
        labels: ["Performance", "Battery", "Camera", "Display", "Portability", "Value"],
        datasets: [
          { name: "Current phone", color: "#2490ef", values: [92, 84, 89, 91, 76, 72] },
          { name: "Previous phone", color: "#8e8e93", values: [74, 77, 71, 78, 84, 81] },
        ],
      },
    },
  ],
  [
    "#polar",
    {
      type: "polar-area",
      height: 280,
      tooltipOptions: { formatTooltipY: (value) => `${formatDemoValue(value)} min` },
      ariaLabel: "Screen Time by app category",
      data: {
        labels: ["Social", "Entertainment", "Productivity", "Creativity", "Reading", "Other"],
        datasets: [{ values: [74, 68, 52, 41, 24, 18] }],
      },
    },
  ],
  [
    "#axis-mixed",
    {
      type: "axis-mixed",
      height: 300,
      ariaLabel: "Weekly store visits compared with plan and capacity",
      data: {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
        datasets: [
          { name: "Visits", chartType: "bar", color: "#2490ef", values: [28, 37, 34, 49, 46, 61, 58, 72] },
          { name: "Plan", chartType: "line", color: "#af52de", values: [32, 35, 39, 44, 49, 54, 60, 66] },
          { name: "Capacity", chartType: "line", color: "#ff9500", values: [48, 48, 52, 55, 58, 64, 70, 76] },
        ],
      },
    },
  ],
  [
    "#axis-mixed-signed",
    {
      type: "axis-mixed",
      height: 300,
      axisOptions: { yAxisPosition: "right" },
      tooltipOptions: { formatTooltipY: (value) => `${value < 0 ? "−" : "+"}$${formatDemoValue(Math.abs(value))}` },
      ariaLabel: "Daily account balance movement with right-side value axis, rolling trend, and alert threshold",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Today"],
        datasets: [
          { name: "Daily change", chartType: "bar", color: "#2490ef", values: [-18, 9, -6, 22, 0, -14, 17, 28] },
          { name: "Rolling trend", chartType: "line", color: "#af52de", values: [-8, -4, -2, 5, 7, 3, 8, 14] },
          { name: "Alert threshold", chartType: "line", color: "#ff9500", values: [12, 12, 12, 12, 12, 12, 12, 12] },
        ],
      },
    },
  ],
  [
    "#timesheet",
    {
      type: "timesheet",
      height: 300,
      ariaLabel: "App release work plan from design review through release",
      description: "Six release tasks overlap where parallel work is possible and finish with the public release.",
      data: {
        start: "2026-09-01T00:00:00",
        end: "2026-09-13T00:00:00",
        tasks: [
          {
            label: "Design review",
            start: "2026-09-01T00:00:00",
            end: "2026-09-03T00:00:00",
            group: "Design",
            color: "#AF52DE",
          },
          {
            label: "Accessibility audit",
            start: "2026-09-02T00:00:00",
            end: "2026-09-05T00:00:00",
            group: "Quality",
            color: "#248A3D",
          },
          {
            label: "Implementation",
            start: "2026-09-03T00:00:00",
            end: "2026-09-08T00:00:00",
            group: "Engineering",
            color: "#007AFF",
          },
          {
            label: "TestFlight",
            start: "2026-09-07T00:00:00",
            end: "2026-09-10T00:00:00",
            group: "Quality",
            color: "#248A3D",
          },
          {
            label: "App Review",
            start: "2026-09-09T00:00:00",
            end: "2026-09-12T00:00:00",
            group: "Distribution",
            color: "#FF9500",
          },
          {
            label: "Release",
            start: "2026-09-12T00:00:00",
            end: "2026-09-13T00:00:00",
            group: "Distribution",
            color: "#FF3B30",
          },
        ],
      },
    },
  ],
  [
    "#pie",
    {
      type: "pie",
      height: 260,
      ariaLabel: "Website traffic sources",
      data: { labels: ["Search", "Direct", "Referrals"], datasets: [{ values: [48, 34, 18] }] },
    },
  ],
  [
    "#donut",
    {
      type: "donut",
      height: 260,
      padAngle: 3,
      ariaLabel: "Members by subscription plan",
      data: { labels: ["Individual", "Family", "Student"], datasets: [{ values: [6100, 2700, 1200] }] },
    },
  ],
  [
    "#percentage",
    {
      type: "percentage",
      height: 240,
      tooltipOptions: { formatTooltipY: (value) => `${formatDemoValue(value)} GB` },
      ariaLabel: "iPhone storage usage by category",
      colors: ["#ff9f0a", "#0a84ff", "#30d158", "#8e8e93", "#bf5af2", "#d1d1d6"],
      data: {
        labels: ["Photos", "Apps", "Messages", "iOS", "System Data", "Free"],
        datasets: [{ values: [72, 58, 21, 18, 23, 64] }],
      },
    },
  ],
];

/*
 * Quality lab: demanding data kept behind the optional reliability disclosure
 */

export const qualitySpecs = [
  [
    "#fractions",
    {
      type: "line",
      ariaLabel: "Small fractional measurements with long labels",
      data: {
        labels: [
          "Initial calibration window",
          "After first adjustment",
          "Post-validation measurement",
          "Final stabilized sample",
        ],
        datasets: [
          { name: "Sensor A — fractional precision", values: [0.00012, 0.00018, 0.00013, 0.00021] },
          { name: "Sensor B — comparison", values: [0.00009, 0.00014, 0.00016, 0.00019] },
        ],
      },
    },
  ],
  [
    "#large-values",
    {
      type: "bar",
      orientation: "horizontal",
      ariaLabel: "Large values with long category labels",
      axisOptions: {
        formatLabel: (label) =>
          ({
            "North America enterprise accounts": ["North America", "enterprise accounts"],
            "Europe, Middle East, and Africa": ["Europe, Middle", "East, and Africa"],
            "Asia-Pacific strategic partnerships": ["Asia-Pacific", "strategic partnerships"],
          })[label] ?? label,
      },
      data: {
        labels: [
          "North America enterprise accounts",
          "Europe, Middle East, and Africa",
          "Asia-Pacific strategic partnerships",
        ],
        datasets: [
          { name: "Annual processing volume", values: [9_800_000, 12_750_000, 6_450_000] },
          { name: "Previous annual volume", values: [8_400_000, 10_900_000, 5_900_000] },
        ],
      },
    },
  ],
  [
    "#absurd-labels",
    {
      type: "bar",
      orientation: "horizontal",
      ariaLabel: "Extremely long localized category labels",
      axisOptions: {
        formatLabel: (label) =>
          ({
            "Accounts requiring manual verification after an inconclusive automated compliance review": [
              "Manual verification",
              "after inconclusive",
              "compliance review",
            ],
            "Партнёрские интеграции с дополнительной проверкой доступности и локализации": [
              "Партнёрские интеграции",
              "проверка доступности",
              "и локализации",
            ],
            顧客向けエンタープライズ分析プラットフォームの段階的な移行: [
              "顧客向け分析",
              "プラットフォーム",
              "段階的な移行",
            ],
            "طلبات المؤسسات التي تتطلب مراجعة يدوية إضافية قبل الموافقة النهائية": [
              "طلبات المؤسسات",
              "مراجعة يدوية إضافية",
              "قبل الموافقة النهائية",
            ],
          })[label] ?? label,
      },
      data: {
        labels: [
          "Accounts requiring manual verification after an inconclusive automated compliance review",
          "Партнёрские интеграции с дополнительной проверкой доступности и локализации",
          "顧客向けエンタープライズ分析プラットフォームの段階的な移行",
          "طلبات المؤسسات التي تتطلب مراجعة يدوية إضافية قبل الموافقة النهائية",
        ],
        datasets: [
          { name: "Current", values: [72, 61, 48, 66] },
          { name: "Previous", values: [64, 57, 52, 59] },
        ],
      },
    },
  ],
  [
    "#negative-bars",
    {
      type: "bar",
      ariaLabel: "Monthly losses zero and gains",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          { name: "Actual delta", color: "#2490ef", values: [-42, 18, 0, -17, 51, -8] },
          { name: "Previous delta", color: "#af52de", values: [-31, 12, -6, 9, 38, -14] },
        ],
      },
    },
  ],
  [
    "#signed-lines",
    {
      type: "line",
      ariaLabel: "Two signals repeatedly crossing zero",
      data: {
        labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"],
        datasets: [
          { name: "Signal A", color: "#2490ef", values: [-0.75, -0.2, 0.35, 0.9, 0.1, -0.45, -0.05, 0.62] },
          { name: "Signal B", color: "#ff3b30", values: [0.4, -0.1, -0.55, 0.2, 0.78, 0.34, -0.28, -0.7] },
        ],
      },
    },
  ],
  [
    "#dense-line",
    {
      type: "line",
      ariaLabel: "Dense line with forty-eight weekly categories",
      data: {
        labels: denseLabels,
        datasets: [
          { name: "Observed", color: "#2490ef", values: denseValues },
          {
            name: "Baseline",
            color: "#af52de",
            values: denseValues.map((value, index) => Math.round(value * 0.82 + Math.sin(index / 5) * 6)),
          },
        ],
      },
    },
  ],
  [
    "#flat-values",
    {
      type: "line",
      ariaLabel: "Flat and zero value series",
      data: {
        labels: ["A", "B", "C", "D", "E", "F", "G", "H"],
        datasets: [
          { name: "No activity", color: "#8e8e93", values: [0, 0, 0, 0, 0, 0, 0, 0] },
          { name: "Constant baseline", color: "#2490ef", values: [12, 12, 12, 12, 12, 12, 12, 12] },
        ],
      },
    },
  ],
];

/*
 * Shared chart mounting
 */

/**
 * Mounts a chart with the demo's standard height and preserves its source data.
 *
 * @param {string} selector - Selector of the chart host.
 * @param {object} options - Public chart options for the example.
 * @returns {{chart: object, source: object}} Mounted chart and immutable update source.
 */
function mountChart(selector, options) {
  const chart = createChart(selector, {
    height: 280,
    ...options,
  });
  return { chart, source: options.data };
}

for (const [selector, options] of showcaseSpecs) {
  updatableCharts.push(mountChart(selector, options));
}
for (const [selector, options] of qualitySpecs) {
  mountChart(selector, options);
}

/*
 * Calendar activity
 */

createChart("#heatmap", {
  type: "heatmap",
  height: 320,
  ariaLabel: "Daily contributions throughout 2026",
  countLabel: "contributions",
  radius: 2,
  colors: ["#f2f2f7", "#d8ecff", "#acd7ff", "#73baff", "#2490ef", "#126fbd", "#084b83"],
  data: {
    start: new Date("2026-01-01T00:00:00Z"),
    end: new Date("2026-12-31T00:00:00Z"),
    dataPoints: Object.fromEntries(
      Array.from({ length: 365 }, (_, index) => {
        const date = new Date(Date.UTC(2026, 0, index + 1));
        const weekday = date.getUTCDay();
        const seasonal = Math.sin(index / 19) * 4 + 5;
        const workday = weekday > 0 && weekday < 6 ? 4 : 0;
        return [date.toISOString().slice(0, 10), Math.max(0, Math.round(seasonal + workday + ((index * 7) % 5)))];
      }),
    ),
  },
});

/*
 * Frameless charts with every omitted layer configured explicitly
 */

const sparkValues = [12, 18, 16, 25, 21, 35, 29, 42, 38, 51, 47, 62];
const sparkSpecs = [
  ["#spark-line", { type: "line", name: "Revenue", color: "#ff5858", ariaLabel: "Revenue trend" }],
  [
    "#spark-area",
    { type: "line", name: "Users", color: "#2490ef", lineOptions: { regionFill: true }, ariaLabel: "User trend" },
  ],
  ["#spark-bar", { type: "bar", name: "Deploys", color: "#29cd42", ariaLabel: "Deployment trend" }],
];
const sparks = sparkSpecs.map(([selector, spec]) => {
  const source = { name: spec.name, color: spec.color, values: sparkValues };
  const chart = createChart(selector, {
    type: spec.type,
    height: 90,
    showAxes: false,
    showGrid: false,
    showLabels: false,
    showLegend: false,
    showDots: false,
    showTooltip: false,
    lineOptions: spec.lineOptions,
    ariaLabel: spec.ariaLabel,
    data: { datasets: [source] },
  });
  return { chart, source };
});

/*
 * Live data update
 */

/**
 * Applies a bounded random variation while preserving a point's public shape.
 *
 * @param {number | {y: number}} value - Numeric or coordinate value from a dataset.
 * @returns {number | {y: number}} Value with a new y magnitude and unchanged metadata.
 */
function varyValue(value) {
  const factor = 0.72 + Math.random() * 0.56;
  return typeof value === "number" ? value * factor : { ...value, y: value.y * factor };
}

document.querySelector("#shuffle").addEventListener("click", () => {
  for (const chartEntry of updatableCharts) {
    if (!chartEntry.source.datasets) {
      continue;
    }
    chartEntry.chart.update({
      ...chartEntry.source,
      datasets: chartEntry.source.datasets.map((dataset) => ({
        ...dataset,
        values: dataset.values.map((value) => varyValue(value)),
      })),
    });
  }
  for (const { chart, source } of sparks) {
    chart.update({
      datasets: [
        {
          ...source,
          values: sparkValues.map((value) => varyValue(value)),
        },
      ],
    });
  }
});
