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
} from "../src/index.js";

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
 * Keeps the featured chart summary in sync with selection and refreshed data.
 *
 * @param {string} selector - Chart host selector.
 * @param {object} source - Initial monthly series.
 * @returns {object} Selection and data update callbacks.
 */
export function selectionReporter(selector, source) {
  const host = document.querySelector(selector);
  let status = host.nextElementSibling;
  if (!status?.matches(".selection-status")) {
    status = document.createElement("div");
    status.className = "selection-status";
    status.innerHTML = `
      <div class="selection-status-period">
        <span class="selection-status-label">Latest month</span>
        <p class="selection-status-summary">Dec</p>
      </div>
      <dl class="selection-status-values">
        <div><dt>Downloads</dt><dd>116k</dd></div>
        <div><dt>Plan</dt><dd>86k</dd></div>
        <div><dt>Previous year</dt><dd>59k</dd></div>
      </dl>`;
    host.after(status);
  }
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  const label = status.querySelector(".selection-status-label");
  const summary = status.querySelector(".selection-status-summary");
  const values = status.querySelectorAll("dd");
  let currentSource = source;
  let selectedIndex = null;
  const render = () => {
    const index = selectedIndex ?? currentSource.labels.length - 1;
    label.textContent = selectedIndex === null ? "Latest month" : "Selected month";
    summary.textContent = currentSource.labels[index];
    for (const [
      datasetIndex,
      value,
    ] of values.entries()) {
      value.textContent = `${formatDemoValue(currentSource.datasets[datasetIndex].values[index])}k`;
    }
  };
  render();
  return {
    select(detail) {
      selectedIndex = detail?.index ?? null;
      render();
    },
    update(data) {
      currentSource = data;
      render();
    },
  };
}

/*
Product examples: the code readers are expected to copy.
*/

function lineExample() {
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        name: "Downloads",
        values: [
          48,
          57,
          53,
          68,
          76,
          71,
          85,
          94,
          88,
          103,
          108,
          116,
        ],
      },
      {
        name: "Plan",
        values: [
          36,
          40,
          44,
          48,
          52,
          56,
          61,
          66,
          71,
          76,
          81,
          86,
        ],
      },
      {
        name: "Previous year",
        values: [
          22,
          27,
          25,
          33,
          37,
          34,
          42,
          47,
          44,
          51,
          55,
          59,
        ],
      },
    ],
  };
  const selection = selectionReporter("#line", data);
  const chart = LineChart.make("#line")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .dataset(data.datasets[2])
    .height(320)
    .ariaLabel("Monthly App Store downloads, plan, and previous year")
    .description(
      "Downloads trend upward across the year; values are shown in thousands and the plan and previous-year series provide context.",
    )
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)}k`))
    .onSelect(selection.select)
    .render();

  return {
    chart,
    source: data,
    onUpdate: selection.update,
  };
}

function lineGradientExample() {
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        name: "Free",
        color: "#2490ef",
        values: [
          22,
          27,
          31,
          35,
          40,
          45,
          51,
          57,
          63,
          70,
          76,
          82,
        ],
      },
      {
        name: "Individual",
        color: "#af52de",
        values: [
          14,
          17,
          21,
          25,
          30,
          35,
          40,
          46,
          51,
          56,
          61,
          65,
        ],
      },
      {
        name: "Family",
        color: "#ff9500",
        values: [
          6,
          8,
          11,
          14,
          17,
          20,
          24,
          28,
          31,
          34,
          37,
          40,
        ],
      },
    ],
  };
  const chart = LineChart.make("#line-gradient")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .dataset(data.datasets[2])
    .height(300)
    .ariaLabel("Monthly subscriber growth for three plans")
    .description("Free, Individual, and Family plans share the same monthly subscriber scale.")
    .gradient()
    .render();

  return {
    chart,
    source: data,
  };
}

function lineRegionExample() {
  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ],
    regions: [
      {
        label: "Healthy range",
        range: [
          40,
          60,
        ],
        color: "#248a3d",
        opacity: 0.14,
        labelPosition: "end",
      },
    ],
    datasets: [
      {
        name: "P95 latency",
        color: "#2490ef",
        values: [
          54,
          48,
          57,
          63,
          51,
          46,
          43,
        ],
      },
    ],
  };
  const chart = LineChart.make("#line-region")
    .labels(data.labels)
    .region(data.regions[0])
    .dataset(data.datasets[0])
    .height(280)
    .ariaLabel("Weekly service latency with a healthy operating region")
    .description("The shaded region marks the healthy latency range from 40 to 60 milliseconds.")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} ms`))
    .render();

  return {
    chart,
    source: data,
  };
}

function lineMarkerExample() {
  const data = {
    labels: [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
    ],
    markers: [
      {
        label: "Target · 75%",
        value: 75,
        color: "#ff3b30",
        width: 2,
        lineStyle: "dashed",
        labelPosition: "end",
      },
    ],
    datasets: [
      {
        name: "Activation rate",
        color: "#af52de",
        values: [
          61,
          64,
          66,
          70,
          69,
          73,
          76,
          79,
        ],
      },
    ],
  };
  const chart = LineChart.make("#line-marker")
    .labels(data.labels)
    .marker(data.markers[0])
    .dataset(data.datasets[0])
    .height(280)
    .ariaLabel("Weekly activation rate compared with a target marker")
    .description("The dashed marker shows the activation target at 75 percent.")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)}%`))
    .render();

  return {
    chart,
    source: data,
  };
}

function barVerticalExample() {
  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ],
    datasets: [
      {
        name: "Messages",
        values: [
          18,
          24,
          21,
          31,
          28,
          16,
          12,
        ],
      },
      {
        name: "Calendar",
        values: [
          6,
          8,
          5,
          7,
          9,
          2,
          1,
        ],
      },
      {
        name: "Home",
        values: [
          4,
          6,
          3,
          8,
          5,
          7,
          6,
        ],
      },
    ],
  };
  const chart = BarChart.make("#bar-vertical")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .dataset(data.datasets[2])
    .height(220)
    .ariaLabel("Notifications received from Messages Calendar and Home this week")
    .render();

  return {
    chart,
    source: data,
  };
}

function barHorizontalExample() {
  const data = {
    labels: [
      "North America",
      "Europe",
      "Asia-Pacific",
      "Latin America",
    ],
    datasets: [
      {
        name: "Standard",
        color: "#2490ef",
        values: [
          42,
          36,
          54,
          61,
        ],
      },
      {
        name: "Express",
        color: "#ff9500",
        values: [
          18,
          16,
          24,
          28,
        ],
      },
    ],
  };
  const chart = BarChart.make("#bar-horizontal")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(250)
    .ariaLabel("Standard and express delivery time by region in hours")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} h`))
    .horizontal()
    .render();

  return {
    chart,
    source: data,
  };
}

function barHorizontalStackedExample() {
  const data = {
    labels: [
      "Online Store",
      "Retail pickup",
      "Marketplace",
      "Partner",
    ],
    datasets: [
      {
        name: "Shipped",
        color: "#248a3d",
        values: [
          52,
          38,
          49,
          12,
        ],
      },
      {
        name: "Processing",
        color: "#2490ef",
        values: [
          14,
          9,
          18,
          5,
        ],
      },
      {
        name: "Delayed",
        color: "#ff9500",
        values: [
          4,
          3,
          7,
          3,
        ],
      },
    ],
  };
  const chart = BarChart.make("#bar-horizontal-stacked")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .dataset(data.datasets[2])
    .height(250)
    .ariaLabel("Orders by channel and fulfillment status")
    .horizontal()
    .stacked()
    .render();

  return {
    chart,
    source: data,
  };
}

function scatterExample() {
  const data = {
    labels: [
      "$699",
      "$799",
      "$899",
      "$999",
      "$1,099",
      "$1,199",
    ],
    datasets: [
      {
        name: "Phone",
        values: [
          18,
          20,
          22,
          24,
          26,
          28,
        ],
      },
      {
        name: "Tablet",
        values: [
          24,
          26,
          29,
          31,
          34,
          36,
        ],
      },
    ],
  };
  const chart = ScatterChart.make("#scatter")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(260)
    .ariaLabel("Battery life by device price for phones and tablets")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} h`))
    .render();

  return {
    chart,
    source: data,
  };
}

function bubbleExample() {
  const data = {
    labels: [
      "Photos",
      "Music",
      "Maps",
      "Fitness",
      "Notes",
    ],
    datasets: [
      {
        name: "Weekly users",
        color: "#af52de",
        values: [
          {
            x: 1,
            y: 78,
            r: Math.sqrt(529),
          },
          {
            x: 2,
            y: 64,
            r: Math.sqrt(324),
          },
          {
            x: 3,
            y: 57,
            r: Math.sqrt(196),
          },
          {
            x: 4,
            y: 41,
            r: Math.sqrt(100),
          },
          {
            x: 5,
            y: 36,
            r: Math.sqrt(49),
          },
        ],
      },
    ],
  };
  const chart = BubbleChart.make("#bubble")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(300)
    .ariaLabel("Weekly users and installed size across an app portfolio")
    .description("Y shows weekly users in thousands; circle area represents installed size in MB.")
    .yAxis((axis) => axis.formatValue((value) => `${formatDemoValue(value)}k`))
    .tooltip((tooltip) =>
      tooltip.formatValue(
        (value, context) => `${formatDemoValue(value)}k · ${formatDemoValue(context.point.r ** 2)} MB`,
      ),
    )
    .render();

  return {
    chart,
    source: data,
  };
}

function radarExample() {
  const data = {
    labels: [
      "Performance",
      "Battery",
      "Camera",
      "Display",
      "Portability",
      "Value",
    ],
    datasets: [
      {
        name: "Current phone",
        color: "#2490ef",
        values: [
          92,
          84,
          89,
          91,
          76,
          72,
        ],
      },
      {
        name: "Previous phone",
        color: "#8e8e93",
        values: [
          74,
          77,
          71,
          78,
          84,
          81,
        ],
      },
    ],
  };
  const chart = RadarChart.make("#radar")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(320)
    .ariaLabel("Current and previous phone comparison")
    .render();

  return {
    chart,
    source: data,
  };
}

function polarExample() {
  const data = {
    labels: [
      "Social",
      "Entertainment",
      "Productivity",
      "Creativity",
      "Reading",
      "Other",
    ],
    datasets: [
      {
        values: [
          74,
          68,
          52,
          41,
          24,
          18,
        ],
      },
    ],
  };
  const chart = PolarAreaChart.make("#polar")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(280)
    .ariaLabel("Screen Time by app category")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} min`))
    .render();

  return {
    chart,
    source: data,
  };
}

function mixedExample() {
  const data = {
    labels: [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
    ],
    datasets: [
      {
        name: "Visits",
        chartType: "bar",
        color: "#2490ef",
        values: [
          28,
          37,
          34,
          49,
          46,
          61,
          58,
          72,
        ],
      },
      {
        name: "Plan",
        chartType: "line",
        color: "#af52de",
        values: [
          32,
          35,
          39,
          44,
          49,
          54,
          60,
          66,
        ],
      },
      {
        name: "Capacity",
        chartType: "line",
        color: "#ff9500",
        values: [
          48,
          48,
          52,
          55,
          58,
          64,
          70,
          76,
        ],
      },
    ],
  };
  const chart = MixedChart.make("#mixed")
    .labels(data.labels)
    .bar(data.datasets[0].name, data.datasets[0].values, data.datasets[0].color)
    .line(data.datasets[1].name, data.datasets[1].values, data.datasets[1].color)
    .line(data.datasets[2].name, data.datasets[2].values, data.datasets[2].color)
    .height(300)
    .ariaLabel("Weekly store visits compared with plan and capacity")
    .render();

  return {
    chart,
    source: data,
  };
}

function mixedSignedExample() {
  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
      "Today",
    ],
    datasets: [
      {
        name: "Daily change",
        chartType: "bar",
        color: "#2490ef",
        values: [
          -18,
          9,
          -6,
          22,
          0,
          -14,
          17,
          28,
        ],
      },
      {
        name: "Rolling trend",
        chartType: "line",
        color: "#af52de",
        values: [
          -8,
          -4,
          -2,
          5,
          7,
          3,
          8,
          14,
        ],
      },
      {
        name: "Alert threshold",
        chartType: "line",
        color: "#ff9500",
        values: [
          12,
          12,
          12,
          12,
          12,
          12,
          12,
          12,
        ],
      },
    ],
  };
  const chart = MixedChart.make("#mixed-signed")
    .labels(data.labels)
    .bar(data.datasets[0].name, data.datasets[0].values, data.datasets[0].color)
    .line(data.datasets[1].name, data.datasets[1].values, data.datasets[1].color)
    .line(data.datasets[2].name, data.datasets[2].values, data.datasets[2].color)
    .height(300)
    .ariaLabel(
      "Daily account balance movement with right-side value axis, rolling trend, and alert threshold",
    )
    .tooltip((tooltip) =>
      tooltip.formatValue((value) => `${value < 0 ? "−" : "+"}$${formatDemoValue(Math.abs(value))}`),
    )
    .yAxis((axis) => axis.position("right"))
    .render();

  return {
    chart,
    source: data,
  };
}

function timesheetExample() {
  const data = {
    start: "2026-09-01",
    end: "2026-09-13",
    tasks: [
      {
        label: "Design review",
        start: "2026-09-01",
        end: "2026-09-03",
        group: "Design",
        color: "#AF52DE",
      },
      {
        label: "Accessibility audit",
        start: "2026-09-02",
        end: "2026-09-05",
        group: "Quality",
        color: "#248A3D",
      },
      {
        label: "Implementation",
        start: "2026-09-03",
        end: "2026-09-08",
        group: "Engineering",
        color: "#007AFF",
      },
      {
        label: "TestFlight",
        start: "2026-09-07",
        end: "2026-09-10",
        group: "Quality",
        color: "#248A3D",
      },
      {
        label: "App Review",
        start: "2026-09-09",
        end: "2026-09-12",
        group: "Distribution",
        color: "#FF9500",
      },
      {
        label: "Release",
        start: "2026-09-12",
        end: "2026-09-13",
        group: "Distribution",
        color: "#FF3B30",
      },
    ],
  };
  const chart = TimesheetChart.make("#timesheet")
    .range(data.start, data.end)
    .task(data.tasks[0])
    .task(data.tasks[1])
    .task(data.tasks[2])
    .task(data.tasks[3])
    .task(data.tasks[4])
    .task(data.tasks[5])
    .height(300)
    .ariaLabel("App release work plan from design review through release")
    .description(
      "Six release tasks overlap where parallel work is possible and finish with the public release.",
    )
    .render();

  return {
    chart,
    source: data,
  };
}

function pieExample() {
  const data = {
    labels: [
      "Search",
      "Direct",
      "Referrals",
    ],
    datasets: [
      {
        values: [
          48,
          34,
          18,
        ],
      },
    ],
  };
  const chart = PieChart.make("#pie")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(260)
    .ariaLabel("Website traffic sources")
    .render();

  return {
    chart,
    source: data,
  };
}

function donutExample() {
  const data = {
    labels: [
      "Individual",
      "Family",
      "Student",
    ],
    datasets: [
      {
        values: [
          6100,
          2700,
          1200,
        ],
      },
    ],
  };
  const chart = DonutChart.make("#donut")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(260)
    .ariaLabel("Members by subscription plan")
    .padAngle(3)
    .render();

  return {
    chart,
    source: data,
  };
}

function percentageExample() {
  const data = {
    labels: [
      "Photos",
      "Apps",
      "Messages",
      "iOS",
      "System Data",
      "Free",
    ],
    datasets: [
      {
        values: [
          72,
          58,
          21,
          18,
          23,
          64,
        ],
      },
    ],
  };
  const chart = PercentageChart.make("#percentage")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(80)
    .colors([
      "#ff9f0a",
      "#0a84ff",
      "#30d158",
      "#8e8e93",
      "#bf5af2",
      "#d1d1d6",
    ])
    .ariaLabel("iPhone storage usage by category")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} GB`))
    .render();

  return {
    chart,
    source: data,
  };
}

/*
Laboratory examples: edge cases and renderer stress fixtures.
*/

function annotationCollisionExample() {
  const data = {
    labels: [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
    ],
    regions: [
      {
        label: "Operating band · 42–58",
        range: [
          42,
          58,
        ],
        color: "#248a3d",
        opacity: 0.18,
        labelPosition: "end",
      },
    ],
    markers: [
      {
        label: "SLA ceiling · 70",
        value: 70,
        color: "#ff3b30",
        width: 2,
        lineStyle: "dashed",
        labelPosition: "end",
      },
    ],
    datasets: [
      {
        chartType: "bar",
        name: "Requests",
        color: "#2490ef",
        values: [
          64,
          72,
          68,
          75,
          66,
          73,
          69,
          76,
        ],
      },
      {
        chartType: "line",
        name: "Band crossing",
        color: "#af52de",
        values: [
          46,
          53,
          48,
          56,
          45,
          54,
          52,
          50,
        ],
      },
      {
        chartType: "line",
        name: "Ceiling crossing",
        color: "#ff9500",
        values: [
          61,
          66,
          72,
          68,
          74,
          67,
          71,
          74,
        ],
      },
    ],
  };
  const chart = MixedChart.make("#annotation-collision")
    .labels(data.labels)
    .marker(data.markers[0])
    .region(data.regions[0])
    .bar(data.datasets[0].name, data.datasets[0].values, data.datasets[0].color)
    .line(data.datasets[1].name, data.datasets[1].values, data.datasets[1].color)
    .line(data.datasets[2].name, data.datasets[2].values, data.datasets[2].color)
    .height(320)
    .ariaLabel("Annotation readability stress test with labels crossing dense points and bars")
    .render();

  return {
    chart,
    source: data,
  };
}

function annotationBarsVerticalExample() {
  const data = {
    labels: [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
    ],
    regions: [
      {
        label: "Expected throughput · 42–58",
        range: [
          42,
          58,
        ],
        color: "#248a3d",
        opacity: 0.18,
        labelPosition: "end",
      },
    ],
    markers: [
      {
        label: "Capacity ceiling · 70",
        value: 70,
        color: "#ff3b30",
        width: 2,
        lineStyle: "dashed",
        labelPosition: "end",
      },
    ],
    datasets: [
      {
        name: "Primary",
        color: "#2490ef",
        values: [
          64,
          72,
          68,
          75,
          66,
          73,
          69,
          76,
        ],
      },
      {
        name: "Secondary",
        color: "#af52de",
        values: [
          48,
          55,
          51,
          59,
          46,
          57,
          53,
          50,
        ],
      },
    ],
  };
  const chart = BarChart.make("#annotation-bars-vertical")
    .labels(data.labels)
    .marker(data.markers[0])
    .region(data.regions[0])
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(320)
    .ariaLabel("Annotation readability stress test across grouped vertical bars")
    .render();

  return {
    chart,
    source: data,
  };
}

function annotationBarsHorizontalExample() {
  const data = {
    labels: [
      "North",
      "South",
      "East",
      "West",
      "Central",
    ],
    regions: [
      {
        label: "Expected volume · 42–58",
        range: [
          42,
          58,
        ],
        color: "#248a3d",
        opacity: 0.18,
        labelPosition: "center",
      },
    ],
    markers: [
      {
        label: "Capacity · 70",
        value: 70,
        color: "#ff3b30",
        width: 2,
        lineStyle: "dashed",
        labelPosition: "end",
      },
    ],
    datasets: [
      {
        name: "Primary",
        color: "#2490ef",
        values: [
          76,
          68,
          73,
          64,
          71,
        ],
      },
      {
        name: "Secondary",
        color: "#af52de",
        values: [
          52,
          47,
          56,
          49,
          54,
        ],
      },
    ],
  };
  const chart = BarChart.make("#annotation-bars-horizontal")
    .labels(data.labels)
    .marker(data.markers[0])
    .region(data.regions[0])
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(320)
    .ariaLabel("Annotation readability stress test across grouped horizontal bars")
    .horizontal()
    .render();

  return {
    chart,
    source: data,
  };
}

function annotationRegionsExperimentalExample() {
  const data = {
    labels: [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
    ],
    regions: [
      {
        label: "Healthy · 0–33",
        range: [
          0,
          33,
        ],
        color: "#34c759",
        opacity: 0.18,
        labelPosition: "start",
      },
      {
        label: "Warning · 33–66",
        range: [
          33,
          66,
        ],
        color: "#ffcc00",
        opacity: 0.18,
        labelPosition: "center",
      },
      {
        label: "Critical · 66–100",
        range: [
          66,
          100,
        ],
        color: "#ff3b30",
        opacity: 0.18,
        labelPosition: "end",
      },
    ],
    markers: [
      {
        label: "Review boundary · 33",
        value: 33,
        color: "#ff9500",
        lineStyle: "dotted",
        labelPosition: "center",
      },
      {
        label: "Escalation boundary · 66",
        value: 66,
        color: "#ff3b30",
        lineStyle: "dashed",
        labelPosition: "end",
      },
    ],
    datasets: [
      {
        name: "Observed",
        color: "#2490ef",
        values: [
          18,
          42,
          31,
          67,
          54,
          83,
          63,
          34,
        ],
      },
      {
        name: "Forecast",
        color: "#af52de",
        values: [
          27,
          36,
          49,
          58,
          71,
          62,
          78,
          66,
        ],
      },
    ],
  };
  const chart = LineChart.make("#annotation-regions-experimental")
    .labels(data.labels)
    .marker(data.markers[0])
    .marker(data.markers[1])
    .region(data.regions[0])
    .region(data.regions[1])
    .region(data.regions[2])
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(340)
    .ariaLabel("Chart with the complete plot divided into green, yellow, and red operating zones")
    .render();

  return {
    chart,
    source: data,
  };
}

function fractionsExample() {
  const data = {
    labels: [
      "Initial calibration window",
      "After first adjustment",
      "Post-validation measurement",
      "Final stabilized sample",
    ],
    datasets: [
      {
        name: "Sensor A — fractional precision",
        values: [
          0.00012,
          0.00018,
          0.00013,
          0.00021,
        ],
      },
      {
        name: "Sensor B — comparison",
        values: [
          0.00009,
          0.00014,
          0.00016,
          0.00019,
        ],
      },
    ],
  };
  const chart = LineChart.make("#fractions")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Small fractional measurements with long labels")
    .render();

  return {
    chart,
    source: data,
  };
}

function largeValuesExample() {
  const data = {
    labels: [
      "North America enterprise accounts",
      "Europe, Middle East, and Africa",
      "Asia-Pacific strategic partnerships",
    ],
    datasets: [
      {
        name: "Annual processing volume",
        values: [
          9_800_000,
          12_750_000,
          6_450_000,
        ],
      },
      {
        name: "Previous annual volume",
        values: [
          8_400_000,
          10_900_000,
          5_900_000,
        ],
      },
    ],
  };
  const chart = BarChart.make("#large-values")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Large values with long category labels")
    .formatLabel(
      (label) =>
        ({
          "North America enterprise accounts": [
            "North America",
            "enterprise accounts",
          ],
          "Europe, Middle East, and Africa": [
            "Europe, Middle",
            "East, and Africa",
          ],
          "Asia-Pacific strategic partnerships": [
            "Asia-Pacific",
            "strategic partnerships",
          ],
        })[label] ?? label,
    )
    .horizontal()
    .render();

  return {
    chart,
    source: data,
  };
}

function absurdLabelsExample() {
  const data = {
    labels: [
      "Accounts requiring manual verification after an inconclusive automated compliance review",
      "Партнёрские интеграции с дополнительной проверкой доступности и локализации",
      "顧客向けエンタープライズ分析プラットフォームの段階的な移行",
      "طلبات المؤسسات التي تتطلب مراجعة يدوية إضافية قبل الموافقة النهائية",
    ],
    datasets: [
      {
        name: "Current",
        values: [
          72,
          61,
          48,
          66,
        ],
      },
      {
        name: "Previous",
        values: [
          64,
          57,
          52,
          59,
        ],
      },
    ],
  };
  const chart = BarChart.make("#absurd-labels")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Extremely long localized category labels")
    .formatLabel(
      (label) =>
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
    )
    .horizontal()
    .render();

  return {
    chart,
    source: data,
  };
}

function negativeBarsExample() {
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ],
    datasets: [
      {
        name: "Actual delta",
        color: "#2490ef",
        values: [
          -42,
          18,
          0,
          -17,
          51,
          -8,
        ],
      },
      {
        name: "Previous delta",
        color: "#af52de",
        values: [
          -31,
          12,
          -6,
          9,
          38,
          -14,
        ],
      },
    ],
  };
  const chart = BarChart.make("#negative-bars")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Monthly losses zero and gains")
    .render();

  return {
    chart,
    source: data,
  };
}

function signedLinesExample() {
  const data = {
    labels: [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
    ],
    datasets: [
      {
        name: "Signal A",
        color: "#2490ef",
        values: [
          -0.75,
          -0.2,
          0.35,
          0.9,
          0.1,
          -0.45,
          -0.05,
          0.62,
        ],
      },
      {
        name: "Signal B",
        color: "#ff3b30",
        values: [
          0.4,
          -0.1,
          -0.55,
          0.2,
          0.78,
          0.34,
          -0.28,
          -0.7,
        ],
      },
    ],
  };
  const chart = LineChart.make("#signed-lines")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Two signals repeatedly crossing zero")
    .render();

  return {
    chart,
    source: data,
  };
}

function denseLineExample() {
  const data = {
    labels: [
      "W01",
      "W02",
      "W03",
      "W04",
      "W05",
      "W06",
      "W07",
      "W08",
      "W09",
      "W10",
      "W11",
      "W12",
      "W13",
      "W14",
      "W15",
      "W16",
      "W17",
      "W18",
      "W19",
      "W20",
      "W21",
      "W22",
      "W23",
      "W24",
      "W25",
      "W26",
      "W27",
      "W28",
      "W29",
      "W30",
      "W31",
      "W32",
      "W33",
      "W34",
      "W35",
      "W36",
      "W37",
      "W38",
      "W39",
      "W40",
      "W41",
      "W42",
      "W43",
      "W44",
      "W45",
      "W46",
      "W47",
      "W48",
    ],
    datasets: [
      {
        name: "Observed",
        color: "#2490ef",
        values: [
          51,
          57,
          63,
          67,
          69,
          70,
          68,
          64,
          59,
          52,
          46,
          40,
          34,
          31,
          29,
          29,
          31,
          35,
          40,
          46,
          52,
          58,
          62,
          65,
          66,
          65,
          62,
          59,
          55,
          50,
          46,
          44,
          43,
          44,
          47,
          51,
          58,
          65,
          73,
          80,
          86,
          91,
          94,
          94,
          93,
          90,
          85,
          79,
        ],
      },
      {
        name: "Baseline",
        color: "#af52de",
        values: [
          42,
          48,
          54,
          58,
          61,
          62,
          61,
          58,
          54,
          48,
          43,
          38,
          32,
          29,
          26,
          25,
          25,
          27,
          30,
          34,
          38,
          42,
          45,
          47,
          48,
          48,
          46,
          44,
          41,
          38,
          36,
          36,
          36,
          38,
          42,
          46,
          52,
          59,
          66,
          72,
          76,
          80,
          82,
          81,
          80,
          76,
          71,
          65,
        ],
      },
    ],
  };
  const chart = LineChart.make("#dense-line")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Dense line with forty-eight weekly categories")
    .render();

  return {
    chart,
    source: data,
  };
}

function flatValuesExample() {
  const data = {
    labels: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
    ],
    datasets: [
      {
        name: "No activity",
        color: "#8e8e93",
        values: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ],
      },
      {
        name: "Constant baseline",
        color: "#2490ef",
        values: [
          12,
          12,
          12,
          12,
          12,
          12,
          12,
          12,
        ],
      },
    ],
  };
  const chart = LineChart.make("#flat-values")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(280)
    .ariaLabel("Flat and zero value series")
    .render();

  return {
    chart,
    source: data,
  };
}

/*
Laboratory background-boundary fixtures.
*/

function backgroundBarExample() {
  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ],
    datasets: [
      {
        name: "Messages",
        values: [
          18,
          24,
          21,
          31,
          28,
          16,
          12,
        ],
      },
      {
        name: "Calendar",
        values: [
          6,
          8,
          5,
          7,
          9,
          2,
          1,
        ],
      },
      {
        name: "Home",
        values: [
          4,
          6,
          3,
          8,
          5,
          7,
          6,
        ],
      },
    ],
  };
  const chart = BarChart.make("#background-bar")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .dataset(data.datasets[2])
    .height(220)
    .ariaLabel("bar chart on a zero-padding background")
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundBubbleExample() {
  const data = {
    labels: [
      "Photos",
      "Music",
      "Maps",
      "Fitness",
      "Notes",
    ],
    datasets: [
      {
        name: "Weekly users",
        color: "#af52de",
        values: [
          {
            x: 1,
            y: 78,
            r: 23,
          },
          {
            x: 2,
            y: 64,
            r: 18,
          },
          {
            x: 3,
            y: 57,
            r: 14,
          },
          {
            x: 4,
            y: 41,
            r: 10,
          },
          {
            x: 5,
            y: 36,
            r: 7,
          },
        ],
      },
    ],
  };
  const chart = BubbleChart.make("#background-bubble")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(300)
    .ariaLabel("bubble chart on a zero-padding background")
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundDonutExample() {
  const data = {
    labels: [
      "Individual",
      "Family",
      "Student",
    ],
    datasets: [
      {
        values: [
          6100,
          2700,
          1200,
        ],
      },
    ],
  };
  const chart = DonutChart.make("#background-donut")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(260)
    .ariaLabel("donut chart on a zero-padding background")
    .padAngle(3)
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundHeatmapExample() {
  const data = {
    start: "2026-01-01T00:00:00.000Z",
    end: "2026-12-31T00:00:00.000Z",
    points: {
      "2026-01-01": 9,
      "2026-01-02": 11,
      "2026-01-03": 9,
      "2026-01-04": 7,
      "2026-01-05": 13,
      "2026-01-06": 10,
      "2026-01-07": 12,
      "2026-01-08": 14,
      "2026-01-09": 12,
      "2026-01-10": 10,
      "2026-01-11": 7,
      "2026-01-12": 13,
      "2026-01-13": 15,
      "2026-01-14": 13,
      "2026-01-15": 15,
      "2026-01-16": 12,
      "2026-01-17": 10,
      "2026-01-18": 12,
      "2026-01-19": 13,
      "2026-01-20": 15,
      "2026-01-21": 12,
      "2026-01-22": 15,
      "2026-01-23": 17,
      "2026-01-24": 10,
      "2026-01-25": 12,
      "2026-01-26": 13,
      "2026-01-27": 15,
      "2026-01-28": 17,
      "2026-01-29": 14,
      "2026-01-30": 16,
      "2026-01-31": 9,
      "2026-02-01": 11,
      "2026-02-02": 17,
      "2026-02-03": 14,
      "2026-02-04": 16,
      "2026-02-05": 13,
      "2026-02-06": 15,
      "2026-02-07": 13,
      "2026-02-08": 10,
      "2026-02-09": 16,
      "2026-02-10": 12,
      "2026-02-11": 14,
      "2026-02-12": 16,
      "2026-02-13": 13,
      "2026-02-14": 11,
      "2026-02-15": 8,
      "2026-02-16": 14,
      "2026-02-17": 15,
      "2026-02-18": 12,
      "2026-02-19": 14,
      "2026-02-20": 11,
      "2026-02-21": 9,
      "2026-02-22": 11,
      "2026-02-23": 11,
      "2026-02-24": 13,
      "2026-02-25": 10,
      "2026-02-26": 12,
      "2026-02-27": 14,
      "2026-02-28": 6,
      "2026-03-01": 8,
      "2026-03-02": 9,
      "2026-03-03": 11,
      "2026-03-04": 13,
      "2026-03-05": 9,
      "2026-03-06": 11,
      "2026-03-07": 4,
      "2026-03-08": 6,
      "2026-03-09": 11,
      "2026-03-10": 8,
      "2026-03-11": 10,
      "2026-03-12": 7,
      "2026-03-13": 9,
      "2026-03-14": 7,
      "2026-03-15": 3,
      "2026-03-16": 9,
      "2026-03-17": 6,
      "2026-03-18": 8,
      "2026-03-19": 10,
      "2026-03-20": 7,
      "2026-03-21": 5,
      "2026-03-22": 1,
      "2026-03-23": 7,
      "2026-03-24": 9,
      "2026-03-25": 6,
      "2026-03-26": 8,
      "2026-03-27": 5,
      "2026-03-28": 3,
      "2026-03-29": 5,
      "2026-03-30": 6,
      "2026-03-31": 8,
      "2026-04-01": 5,
      "2026-04-02": 7,
      "2026-04-03": 9,
      "2026-04-04": 2,
      "2026-04-05": 4,
      "2026-04-06": 5,
      "2026-04-07": 7,
      "2026-04-08": 9,
      "2026-04-09": 6,
      "2026-04-10": 8,
      "2026-04-11": 2,
      "2026-04-12": 4,
      "2026-04-13": 10,
      "2026-04-14": 7,
      "2026-04-15": 9,
      "2026-04-16": 6,
      "2026-04-17": 8,
      "2026-04-18": 7,
      "2026-04-19": 4,
      "2026-04-20": 10,
      "2026-04-21": 7,
      "2026-04-22": 9,
      "2026-04-23": 11,
      "2026-04-24": 9,
      "2026-04-25": 7,
      "2026-04-26": 4,
      "2026-04-27": 10,
      "2026-04-28": 13,
      "2026-04-29": 10,
      "2026-04-30": 12,
      "2026-05-01": 9,
      "2026-05-02": 7,
      "2026-05-03": 10,
      "2026-05-04": 11,
      "2026-05-05": 13,
      "2026-05-06": 10,
      "2026-05-07": 12,
      "2026-05-08": 15,
      "2026-05-09": 8,
      "2026-05-10": 10,
      "2026-05-11": 11,
      "2026-05-12": 13,
      "2026-05-13": 15,
      "2026-05-14": 13,
      "2026-05-15": 15,
      "2026-05-16": 8,
      "2026-05-17": 10,
      "2026-05-18": 16,
      "2026-05-19": 13,
      "2026-05-20": 15,
      "2026-05-21": 13,
      "2026-05-22": 15,
      "2026-05-23": 13,
      "2026-05-24": 10,
      "2026-05-25": 16,
      "2026-05-26": 13,
      "2026-05-27": 15,
      "2026-05-28": 17,
      "2026-05-29": 14,
      "2026-05-30": 12,
      "2026-05-31": 9,
      "2026-06-01": 15,
      "2026-06-02": 17,
      "2026-06-03": 14,
      "2026-06-04": 16,
      "2026-06-05": 13,
      "2026-06-06": 11,
      "2026-06-07": 13,
      "2026-06-08": 14,
      "2026-06-09": 15,
      "2026-06-10": 12,
      "2026-06-11": 14,
      "2026-06-12": 16,
      "2026-06-13": 9,
      "2026-06-14": 11,
      "2026-06-15": 12,
      "2026-06-16": 14,
      "2026-06-17": 15,
      "2026-06-18": 12,
      "2026-06-19": 14,
      "2026-06-20": 7,
      "2026-06-21": 9,
      "2026-06-22": 14,
      "2026-06-23": 11,
      "2026-06-24": 13,
      "2026-06-25": 10,
      "2026-06-26": 12,
      "2026-06-27": 9,
      "2026-06-28": 6,
      "2026-06-29": 12,
      "2026-06-30": 9,
      "2026-07-01": 11,
      "2026-07-02": 12,
      "2026-07-03": 9,
      "2026-07-04": 7,
      "2026-07-05": 4,
      "2026-07-06": 10,
      "2026-07-07": 11,
      "2026-07-08": 8,
      "2026-07-09": 10,
      "2026-07-10": 7,
      "2026-07-11": 5,
      "2026-07-12": 6,
      "2026-07-13": 7,
      "2026-07-14": 9,
      "2026-07-15": 6,
      "2026-07-16": 8,
      "2026-07-17": 10,
      "2026-07-18": 3,
      "2026-07-19": 5,
      "2026-07-20": 5,
      "2026-07-21": 7,
      "2026-07-22": 9,
      "2026-07-23": 6,
      "2026-07-24": 8,
      "2026-07-25": 1,
      "2026-07-26": 3,
      "2026-07-27": 9,
      "2026-07-28": 6,
      "2026-07-29": 8,
      "2026-07-30": 5,
      "2026-07-31": 7,
      "2026-08-01": 5,
      "2026-08-02": 2,
      "2026-08-03": 8,
      "2026-08-04": 5,
      "2026-08-05": 7,
      "2026-08-06": 9,
      "2026-08-07": 6,
      "2026-08-08": 5,
      "2026-08-09": 2,
      "2026-08-10": 8,
      "2026-08-11": 10,
      "2026-08-12": 7,
      "2026-08-13": 9,
      "2026-08-14": 6,
      "2026-08-15": 5,
      "2026-08-16": 7,
      "2026-08-17": 8,
      "2026-08-18": 10,
      "2026-08-19": 7,
      "2026-08-20": 9,
      "2026-08-21": 12,
      "2026-08-22": 5,
      "2026-08-23": 7,
      "2026-08-24": 8,
      "2026-08-25": 10,
      "2026-08-26": 13,
      "2026-08-27": 10,
      "2026-08-28": 12,
      "2026-08-29": 5,
      "2026-08-30": 7,
      "2026-08-31": 14,
      "2026-09-01": 11,
      "2026-09-02": 13,
      "2026-09-03": 10,
      "2026-09-04": 12,
      "2026-09-05": 11,
      "2026-09-06": 8,
      "2026-09-07": 14,
      "2026-09-08": 11,
      "2026-09-09": 13,
      "2026-09-10": 16,
      "2026-09-11": 13,
      "2026-09-12": 11,
      "2026-09-13": 8,
      "2026-09-14": 14,
      "2026-09-15": 16,
      "2026-09-16": 13,
      "2026-09-17": 15,
      "2026-09-18": 13,
      "2026-09-19": 11,
      "2026-09-20": 13,
      "2026-09-21": 14,
      "2026-09-22": 16,
      "2026-09-23": 13,
      "2026-09-24": 15,
      "2026-09-25": 17,
      "2026-09-26": 10,
      "2026-09-27": 12,
      "2026-09-28": 13,
      "2026-09-29": 15,
      "2026-09-30": 17,
      "2026-10-01": 14,
      "2026-10-02": 16,
      "2026-10-03": 9,
      "2026-10-04": 11,
      "2026-10-05": 17,
      "2026-10-06": 14,
      "2026-10-07": 15,
      "2026-10-08": 12,
      "2026-10-09": 14,
      "2026-10-10": 12,
      "2026-10-11": 9,
      "2026-10-12": 15,
      "2026-10-13": 12,
      "2026-10-14": 13,
      "2026-10-15": 15,
      "2026-10-16": 12,
      "2026-10-17": 10,
      "2026-10-18": 7,
      "2026-10-19": 13,
      "2026-10-20": 14,
      "2026-10-21": 11,
      "2026-10-22": 13,
      "2026-10-23": 10,
      "2026-10-24": 8,
      "2026-10-25": 9,
      "2026-10-26": 10,
      "2026-10-27": 12,
      "2026-10-28": 9,
      "2026-10-29": 10,
      "2026-10-30": 12,
      "2026-10-31": 5,
      "2026-11-01": 7,
      "2026-11-02": 8,
      "2026-11-03": 9,
      "2026-11-04": 11,
      "2026-11-05": 8,
      "2026-11-06": 10,
      "2026-11-07": 3,
      "2026-11-08": 5,
      "2026-11-09": 10,
      "2026-11-10": 7,
      "2026-11-11": 9,
      "2026-11-12": 6,
      "2026-11-13": 8,
      "2026-11-14": 6,
      "2026-11-15": 3,
      "2026-11-16": 8,
      "2026-11-17": 5,
      "2026-11-18": 7,
      "2026-11-19": 9,
      "2026-11-20": 6,
      "2026-11-21": 4,
      "2026-11-22": 1,
      "2026-11-23": 7,
      "2026-11-24": 9,
      "2026-11-25": 6,
      "2026-11-26": 8,
      "2026-11-27": 5,
      "2026-11-28": 3,
      "2026-11-29": 5,
      "2026-11-30": 6,
      "2026-12-01": 8,
      "2026-12-02": 5,
      "2026-12-03": 7,
      "2026-12-04": 9,
      "2026-12-05": 3,
      "2026-12-06": 5,
      "2026-12-07": 6,
      "2026-12-08": 8,
      "2026-12-09": 10,
      "2026-12-10": 7,
      "2026-12-11": 9,
      "2026-12-12": 2,
      "2026-12-13": 5,
      "2026-12-14": 11,
      "2026-12-15": 8,
      "2026-12-16": 10,
      "2026-12-17": 7,
      "2026-12-18": 10,
      "2026-12-19": 8,
      "2026-12-20": 5,
      "2026-12-21": 11,
      "2026-12-22": 8,
      "2026-12-23": 11,
      "2026-12-24": 13,
      "2026-12-25": 10,
      "2026-12-26": 8,
      "2026-12-27": 5,
      "2026-12-28": 12,
      "2026-12-29": 14,
      "2026-12-30": 11,
      "2026-12-31": 13,
    },
  };
  const chart = HeatmapChart.make("#background-heatmap")
    .range(data.start, data.end)
    .points(data.points)
    .countLabel("contributions")
    .radius(2)
    .colors([
      "#f2f2f7",
      "#d8ecff",
      "#acd7ff",
      "#73baff",
      "#2490ef",
      "#126fbd",
      "#084b83",
    ])
    .ariaLabel("heatmap chart on a zero-padding background")
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundLineExample() {
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        name: "Downloads",
        values: [
          42.1,
          46.8,
          44.5,
          53.2,
          57.9,
          61.4,
          59.8,
          68.3,
          71.6,
          76.2,
          79.4,
          84.2,
        ],
      },
      {
        name: "Plan",
        values: [
          44,
          47,
          49,
          53,
          56,
          60,
          63,
          67,
          71,
          75,
          80,
          85,
        ],
      },
      {
        name: "Previous year",
        values: [
          35,
          39,
          41,
          45,
          48,
          52,
          54,
          57,
          61,
          65,
          69,
          73,
        ],
      },
    ],
  };
  const chart = LineChart.make("#background-line")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .dataset(data.datasets[2])
    .height(320)
    .ariaLabel("line chart on a zero-padding background")
    .description(
      "Downloads trend upward across the year; values are shown in thousands and the plan and previous-year series provide context.",
    )
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)}k`))
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundMixedExample() {
  const data = {
    labels: [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
    ],
    datasets: [
      {
        name: "Visits",
        chartType: "bar",
        color: "#2490ef",
        values: [
          28,
          37,
          34,
          49,
          46,
          61,
          58,
          72,
        ],
      },
      {
        name: "Plan",
        chartType: "line",
        color: "#af52de",
        values: [
          32,
          35,
          39,
          44,
          49,
          54,
          60,
          66,
        ],
      },
      {
        name: "Capacity",
        chartType: "line",
        color: "#ff9500",
        values: [
          48,
          48,
          52,
          55,
          58,
          64,
          70,
          76,
        ],
      },
    ],
  };
  const chart = MixedChart.make("#background-mixed")
    .labels(data.labels)
    .bar(data.datasets[0].name, data.datasets[0].values, data.datasets[0].color)
    .line(data.datasets[1].name, data.datasets[1].values, data.datasets[1].color)
    .line(data.datasets[2].name, data.datasets[2].values, data.datasets[2].color)
    .height(300)
    .ariaLabel("mixed chart on a zero-padding background")
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundPercentageExample() {
  const data = {
    labels: [
      "Photos",
      "Apps",
      "Messages",
      "iOS",
      "System Data",
      "Free",
    ],
    datasets: [
      {
        values: [
          72,
          58,
          21,
          18,
          23,
          64,
        ],
      },
    ],
  };
  const chart = PercentageChart.make("#background-percentage")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(140)
    .colors([
      "#ff9f0a",
      "#0a84ff",
      "#30d158",
      "#8e8e93",
      "#bf5af2",
      "#d1d1d6",
    ])
    .ariaLabel("percentage chart on a zero-padding background")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} GB`))
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundPieExample() {
  const data = {
    labels: [
      "Search",
      "Direct",
      "Referrals",
    ],
    datasets: [
      {
        values: [
          48,
          34,
          18,
        ],
      },
    ],
  };
  const chart = PieChart.make("#background-pie")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(260)
    .ariaLabel("pie chart on a zero-padding background")
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundPolarAreaExample() {
  const data = {
    labels: [
      "Social",
      "Entertainment",
      "Productivity",
      "Creativity",
      "Reading",
      "Other",
    ],
    datasets: [
      {
        values: [
          74,
          68,
          52,
          41,
          24,
          18,
        ],
      },
    ],
  };
  const chart = PolarAreaChart.make("#background-polar-area")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .height(280)
    .ariaLabel("polar-area chart on a zero-padding background")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} min`))
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundRadarExample() {
  const data = {
    labels: [
      "Performance",
      "Battery",
      "Camera",
      "Display",
      "Portability",
      "Value",
    ],
    datasets: [
      {
        name: "Current phone",
        color: "#2490ef",
        values: [
          92,
          84,
          89,
          91,
          76,
          72,
        ],
      },
      {
        name: "Previous phone",
        color: "#8e8e93",
        values: [
          74,
          77,
          71,
          78,
          84,
          81,
        ],
      },
    ],
  };
  const chart = RadarChart.make("#background-radar")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(320)
    .ariaLabel("radar chart on a zero-padding background")
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundScatterExample() {
  const data = {
    labels: [
      "$699",
      "$799",
      "$899",
      "$999",
      "$1,099",
      "$1,199",
    ],
    datasets: [
      {
        name: "Phone",
        values: [
          18,
          20,
          22,
          24,
          26,
          28,
        ],
      },
      {
        name: "Tablet",
        values: [
          24,
          26,
          29,
          31,
          34,
          36,
        ],
      },
    ],
  };
  const chart = ScatterChart.make("#background-scatter")
    .labels(data.labels)
    .dataset(data.datasets[0])
    .dataset(data.datasets[1])
    .height(260)
    .ariaLabel("scatter chart on a zero-padding background")
    .tooltip((tooltip) => tooltip.formatValue((value) => `${formatDemoValue(value)} h`))
    .render();

  return {
    chart,
    source: data,
  };
}

function backgroundTimesheetExample() {
  const data = {
    start: "2026-09-01",
    end: "2026-09-13",
    tasks: [
      {
        label: "Design review",
        start: "2026-09-01",
        end: "2026-09-03",
        group: "Design",
        color: "#AF52DE",
      },
      {
        label: "Accessibility audit",
        start: "2026-09-02",
        end: "2026-09-05",
        group: "Quality",
        color: "#248A3D",
      },
      {
        label: "Implementation",
        start: "2026-09-03",
        end: "2026-09-08",
        group: "Engineering",
        color: "#007AFF",
      },
      {
        label: "TestFlight",
        start: "2026-09-07",
        end: "2026-09-10",
        group: "Quality",
        color: "#248A3D",
      },
      {
        label: "App Review",
        start: "2026-09-09",
        end: "2026-09-12",
        group: "Distribution",
        color: "#FF9500",
      },
      {
        label: "Release",
        start: "2026-09-12",
        end: "2026-09-13",
        group: "Distribution",
        color: "#FF3B30",
      },
    ],
  };
  const chart = TimesheetChart.make("#background-timesheet")
    .range(data.start, data.end)
    .task(data.tasks[0])
    .task(data.tasks[1])
    .task(data.tasks[2])
    .task(data.tasks[3])
    .task(data.tasks[4])
    .task(data.tasks[5])
    .height(300)
    .ariaLabel("timesheet chart on a zero-padding background")
    .description(
      "Six release tasks overlap where parallel work is possible and finish with the public release.",
    )
    .render();

  return {
    chart,
    source: data,
  };
}

/*
Calendar and compact examples shared by the demo and laboratory.
*/

function heatmapExample() {
  const data = {
    start: "2026-01-01T00:00:00.000Z",
    end: "2026-12-31T00:00:00.000Z",
    points: {
      "2026-01-01": 9,
      "2026-01-02": 11,
      "2026-01-03": 9,
      "2026-01-04": 7,
      "2026-01-05": 13,
      "2026-01-06": 10,
      "2026-01-07": 12,
      "2026-01-08": 14,
      "2026-01-09": 12,
      "2026-01-10": 10,
      "2026-01-11": 7,
      "2026-01-12": 13,
      "2026-01-13": 15,
      "2026-01-14": 13,
      "2026-01-15": 15,
      "2026-01-16": 12,
      "2026-01-17": 10,
      "2026-01-18": 12,
      "2026-01-19": 13,
      "2026-01-20": 15,
      "2026-01-21": 12,
      "2026-01-22": 15,
      "2026-01-23": 17,
      "2026-01-24": 10,
      "2026-01-25": 12,
      "2026-01-26": 13,
      "2026-01-27": 15,
      "2026-01-28": 17,
      "2026-01-29": 14,
      "2026-01-30": 16,
      "2026-01-31": 9,
      "2026-02-01": 11,
      "2026-02-02": 17,
      "2026-02-03": 14,
      "2026-02-04": 16,
      "2026-02-05": 13,
      "2026-02-06": 15,
      "2026-02-07": 13,
      "2026-02-08": 10,
      "2026-02-09": 16,
      "2026-02-10": 12,
      "2026-02-11": 14,
      "2026-02-12": 16,
      "2026-02-13": 13,
      "2026-02-14": 11,
      "2026-02-15": 8,
      "2026-02-16": 14,
      "2026-02-17": 15,
      "2026-02-18": 12,
      "2026-02-19": 14,
      "2026-02-20": 11,
      "2026-02-21": 9,
      "2026-02-22": 11,
      "2026-02-23": 11,
      "2026-02-24": 13,
      "2026-02-25": 10,
      "2026-02-26": 12,
      "2026-02-27": 14,
      "2026-02-28": 6,
      "2026-03-01": 8,
      "2026-03-02": 9,
      "2026-03-03": 11,
      "2026-03-04": 13,
      "2026-03-05": 9,
      "2026-03-06": 11,
      "2026-03-07": 4,
      "2026-03-08": 6,
      "2026-03-09": 11,
      "2026-03-10": 8,
      "2026-03-11": 10,
      "2026-03-12": 7,
      "2026-03-13": 9,
      "2026-03-14": 7,
      "2026-03-15": 3,
      "2026-03-16": 9,
      "2026-03-17": 6,
      "2026-03-18": 8,
      "2026-03-19": 10,
      "2026-03-20": 7,
      "2026-03-21": 5,
      "2026-03-22": 1,
      "2026-03-23": 7,
      "2026-03-24": 9,
      "2026-03-25": 6,
      "2026-03-26": 8,
      "2026-03-27": 5,
      "2026-03-28": 3,
      "2026-03-29": 5,
      "2026-03-30": 6,
      "2026-03-31": 8,
      "2026-04-01": 5,
      "2026-04-02": 7,
      "2026-04-03": 9,
      "2026-04-04": 2,
      "2026-04-05": 4,
      "2026-04-06": 5,
      "2026-04-07": 7,
      "2026-04-08": 9,
      "2026-04-09": 6,
      "2026-04-10": 8,
      "2026-04-11": 2,
      "2026-04-12": 4,
      "2026-04-13": 10,
      "2026-04-14": 7,
      "2026-04-15": 9,
      "2026-04-16": 6,
      "2026-04-17": 8,
      "2026-04-18": 7,
      "2026-04-19": 4,
      "2026-04-20": 10,
      "2026-04-21": 7,
      "2026-04-22": 9,
      "2026-04-23": 11,
      "2026-04-24": 9,
      "2026-04-25": 7,
      "2026-04-26": 4,
      "2026-04-27": 10,
      "2026-04-28": 13,
      "2026-04-29": 10,
      "2026-04-30": 12,
      "2026-05-01": 9,
      "2026-05-02": 7,
      "2026-05-03": 10,
      "2026-05-04": 11,
      "2026-05-05": 13,
      "2026-05-06": 10,
      "2026-05-07": 12,
      "2026-05-08": 15,
      "2026-05-09": 8,
      "2026-05-10": 10,
      "2026-05-11": 11,
      "2026-05-12": 13,
      "2026-05-13": 15,
      "2026-05-14": 13,
      "2026-05-15": 15,
      "2026-05-16": 8,
      "2026-05-17": 10,
      "2026-05-18": 16,
      "2026-05-19": 13,
      "2026-05-20": 15,
      "2026-05-21": 13,
      "2026-05-22": 15,
      "2026-05-23": 13,
      "2026-05-24": 10,
      "2026-05-25": 16,
      "2026-05-26": 13,
      "2026-05-27": 15,
      "2026-05-28": 17,
      "2026-05-29": 14,
      "2026-05-30": 12,
      "2026-05-31": 9,
      "2026-06-01": 15,
      "2026-06-02": 17,
      "2026-06-03": 14,
      "2026-06-04": 16,
      "2026-06-05": 13,
      "2026-06-06": 11,
      "2026-06-07": 13,
      "2026-06-08": 14,
      "2026-06-09": 15,
      "2026-06-10": 12,
      "2026-06-11": 14,
      "2026-06-12": 16,
      "2026-06-13": 9,
      "2026-06-14": 11,
      "2026-06-15": 12,
      "2026-06-16": 14,
      "2026-06-17": 15,
      "2026-06-18": 12,
      "2026-06-19": 14,
      "2026-06-20": 7,
      "2026-06-21": 9,
      "2026-06-22": 14,
      "2026-06-23": 11,
      "2026-06-24": 13,
      "2026-06-25": 10,
      "2026-06-26": 12,
      "2026-06-27": 9,
      "2026-06-28": 6,
      "2026-06-29": 12,
      "2026-06-30": 9,
      "2026-07-01": 11,
      "2026-07-02": 12,
      "2026-07-03": 9,
      "2026-07-04": 7,
      "2026-07-05": 4,
      "2026-07-06": 10,
      "2026-07-07": 11,
      "2026-07-08": 8,
      "2026-07-09": 10,
      "2026-07-10": 7,
      "2026-07-11": 5,
      "2026-07-12": 6,
      "2026-07-13": 7,
      "2026-07-14": 9,
      "2026-07-15": 6,
      "2026-07-16": 8,
      "2026-07-17": 10,
      "2026-07-18": 3,
      "2026-07-19": 5,
      "2026-07-20": 5,
      "2026-07-21": 7,
      "2026-07-22": 9,
      "2026-07-23": 6,
      "2026-07-24": 8,
      "2026-07-25": 1,
      "2026-07-26": 3,
      "2026-07-27": 9,
      "2026-07-28": 6,
      "2026-07-29": 8,
      "2026-07-30": 5,
      "2026-07-31": 7,
      "2026-08-01": 5,
      "2026-08-02": 2,
      "2026-08-03": 8,
      "2026-08-04": 5,
      "2026-08-05": 7,
      "2026-08-06": 9,
      "2026-08-07": 6,
      "2026-08-08": 5,
      "2026-08-09": 2,
      "2026-08-10": 8,
      "2026-08-11": 10,
      "2026-08-12": 7,
      "2026-08-13": 9,
      "2026-08-14": 6,
      "2026-08-15": 5,
      "2026-08-16": 7,
      "2026-08-17": 8,
      "2026-08-18": 10,
      "2026-08-19": 7,
      "2026-08-20": 9,
      "2026-08-21": 12,
      "2026-08-22": 5,
      "2026-08-23": 7,
      "2026-08-24": 8,
      "2026-08-25": 10,
      "2026-08-26": 13,
      "2026-08-27": 10,
      "2026-08-28": 12,
      "2026-08-29": 5,
      "2026-08-30": 7,
      "2026-08-31": 14,
      "2026-09-01": 11,
      "2026-09-02": 13,
      "2026-09-03": 10,
      "2026-09-04": 12,
      "2026-09-05": 11,
      "2026-09-06": 8,
      "2026-09-07": 14,
      "2026-09-08": 11,
      "2026-09-09": 13,
      "2026-09-10": 16,
      "2026-09-11": 13,
      "2026-09-12": 11,
      "2026-09-13": 8,
      "2026-09-14": 14,
      "2026-09-15": 16,
      "2026-09-16": 13,
      "2026-09-17": 15,
      "2026-09-18": 13,
      "2026-09-19": 11,
      "2026-09-20": 13,
      "2026-09-21": 14,
      "2026-09-22": 16,
      "2026-09-23": 13,
      "2026-09-24": 15,
      "2026-09-25": 17,
      "2026-09-26": 10,
      "2026-09-27": 12,
      "2026-09-28": 13,
      "2026-09-29": 15,
      "2026-09-30": 17,
      "2026-10-01": 14,
      "2026-10-02": 16,
      "2026-10-03": 9,
      "2026-10-04": 11,
      "2026-10-05": 17,
      "2026-10-06": 14,
      "2026-10-07": 15,
      "2026-10-08": 12,
      "2026-10-09": 14,
      "2026-10-10": 12,
      "2026-10-11": 9,
      "2026-10-12": 15,
      "2026-10-13": 12,
      "2026-10-14": 13,
      "2026-10-15": 15,
      "2026-10-16": 12,
      "2026-10-17": 10,
      "2026-10-18": 7,
      "2026-10-19": 13,
      "2026-10-20": 14,
      "2026-10-21": 11,
      "2026-10-22": 13,
      "2026-10-23": 10,
      "2026-10-24": 8,
      "2026-10-25": 9,
      "2026-10-26": 10,
      "2026-10-27": 12,
      "2026-10-28": 9,
      "2026-10-29": 10,
      "2026-10-30": 12,
      "2026-10-31": 5,
      "2026-11-01": 7,
      "2026-11-02": 8,
      "2026-11-03": 9,
      "2026-11-04": 11,
      "2026-11-05": 8,
      "2026-11-06": 10,
      "2026-11-07": 3,
      "2026-11-08": 5,
      "2026-11-09": 10,
      "2026-11-10": 7,
      "2026-11-11": 9,
      "2026-11-12": 6,
      "2026-11-13": 8,
      "2026-11-14": 6,
      "2026-11-15": 3,
      "2026-11-16": 8,
      "2026-11-17": 5,
      "2026-11-18": 7,
      "2026-11-19": 9,
      "2026-11-20": 6,
      "2026-11-21": 4,
      "2026-11-22": 1,
      "2026-11-23": 7,
      "2026-11-24": 9,
      "2026-11-25": 6,
      "2026-11-26": 8,
      "2026-11-27": 5,
      "2026-11-28": 3,
      "2026-11-29": 5,
      "2026-11-30": 6,
      "2026-12-01": 8,
      "2026-12-02": 5,
      "2026-12-03": 7,
      "2026-12-04": 9,
      "2026-12-05": 3,
      "2026-12-06": 5,
      "2026-12-07": 6,
      "2026-12-08": 8,
      "2026-12-09": 10,
      "2026-12-10": 7,
      "2026-12-11": 9,
      "2026-12-12": 2,
      "2026-12-13": 5,
      "2026-12-14": 11,
      "2026-12-15": 8,
      "2026-12-16": 10,
      "2026-12-17": 7,
      "2026-12-18": 10,
      "2026-12-19": 8,
      "2026-12-20": 5,
      "2026-12-21": 11,
      "2026-12-22": 8,
      "2026-12-23": 11,
      "2026-12-24": 13,
      "2026-12-25": 10,
      "2026-12-26": 8,
      "2026-12-27": 5,
      "2026-12-28": 12,
      "2026-12-29": 14,
      "2026-12-30": 11,
      "2026-12-31": 13,
    },
  };
  const chart = HeatmapChart.make("#heatmap")
    .range(data.start, data.end)
    .points(data.points)
    .countLabel("contributions")
    .radius(2)
    .colors([
      "#f2f2f7",
      "#d8ecff",
      "#acd7ff",
      "#73baff",
      "#2490ef",
      "#126fbd",
      "#084b83",
    ])
    .ariaLabel("Daily contributions throughout 2026")
    .render();

  return {
    chart,
    source: data,
  };
}

function quarterHeatmapExample() {
  const points = Object.fromEntries(
    Array.from({ length: 91 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 3, index + 1));
      const weekday = date.getUTCDay();
      const baseline = Math.round(5 + 4 * Math.sin(index / 6));
      const isWeekend = weekday === 0 || weekday === 6;
      const value = isWeekend ? Math.max(0, baseline - 4) : baseline + (index % 5);

      return [
        date.toISOString().slice(0, 10),
        value,
      ];
    }),
  );
  const data = {
    start: "2026-04-01T00:00:00.000Z",
    end: "2026-06-30T00:00:00.000Z",
    points,
  };
  const chart = HeatmapChart.make("#heatmap-quarter")
    .range(data.start, data.end)
    .points(data.points)
    .countLabel("events")
    .radius(2)
    .ariaLabel("Daily activity from April through June 2026")
    .render();

  return {
    chart,
    source: data,
  };
}

function sparkLineExample() {
  const data = {
    datasets: [
      {
        name: "Revenue",
        color: "#ff5858",
        values: [
          12,
          18,
          16,
          25,
          21,
          35,
          29,
          42,
          38,
          51,
          47,
          62,
        ],
      },
    ],
  };
  const chart = LineChart.make("#spark-line")
    .dataset(data.datasets[0])
    .height(90)
    .ariaLabel("Revenue trend")
    .legend(false)
    .axes(false)
    .grid(false)
    .valueLabels(false)
    .dots(false)
    .tooltip(false)
    .render();

  return {
    chart,
    source: data,
  };
}

function sparkAreaExample() {
  const data = {
    datasets: [
      {
        name: "Users",
        color: "#2490ef",
        values: [
          12,
          18,
          16,
          25,
          21,
          35,
          29,
          42,
          38,
          51,
          47,
          62,
        ],
      },
    ],
  };
  const chart = LineChart.make("#spark-area")
    .dataset(data.datasets[0])
    .height(90)
    .ariaLabel("User trend")
    .legend(false)
    .axes(false)
    .grid(false)
    .valueLabels(false)
    .dots(false)
    .tooltip(false)
    .area()
    .render();

  return {
    chart,
    source: data,
  };
}

function sparkBarExample() {
  const data = {
    datasets: [
      {
        name: "Deploys",
        color: "#29cd42",
        values: [
          10,
          18,
          14,
          26,
          20,
          32,
          16,
          22,
          28,
          18,
          24,
          20,
        ],
      },
    ],
  };
  const chart = BarChart.make("#spark-bar")
    .dataset(data.datasets[0])
    .height(90)
    .ariaLabel("Deployment trend")
    .legend(false)
    .axes(false)
    .grid(false)
    .valueLabels(false)
    .tooltip(false)
    .render();

  return {
    chart,
    source: data,
  };
}

export const showcaseExamples = [
  [
    "#line",
    lineExample,
  ],
  [
    "#line-gradient",
    lineGradientExample,
  ],
  [
    "#line-region",
    lineRegionExample,
  ],
  [
    "#line-marker",
    lineMarkerExample,
  ],
  [
    "#bar-vertical",
    barVerticalExample,
  ],
  [
    "#bar-horizontal",
    barHorizontalExample,
  ],
  [
    "#bar-horizontal-stacked",
    barHorizontalStackedExample,
  ],
  [
    "#scatter",
    scatterExample,
  ],
  [
    "#bubble",
    bubbleExample,
  ],
  [
    "#radar",
    radarExample,
  ],
  [
    "#polar",
    polarExample,
  ],
  [
    "#mixed",
    mixedExample,
  ],
  [
    "#mixed-signed",
    mixedSignedExample,
  ],
  [
    "#timesheet",
    timesheetExample,
  ],
  [
    "#pie",
    pieExample,
  ],
  [
    "#donut",
    donutExample,
  ],
  [
    "#percentage",
    percentageExample,
  ],
];
export const qualityExamples = [
  [
    "#annotation-collision",
    annotationCollisionExample,
  ],
  [
    "#annotation-bars-vertical",
    annotationBarsVerticalExample,
  ],
  [
    "#annotation-bars-horizontal",
    annotationBarsHorizontalExample,
  ],
  [
    "#annotation-regions-experimental",
    annotationRegionsExperimentalExample,
  ],
  [
    "#fractions",
    fractionsExample,
  ],
  [
    "#large-values",
    largeValuesExample,
  ],
  [
    "#absurd-labels",
    absurdLabelsExample,
  ],
  [
    "#negative-bars",
    negativeBarsExample,
  ],
  [
    "#signed-lines",
    signedLinesExample,
  ],
  [
    "#dense-line",
    denseLineExample,
  ],
  [
    "#flat-values",
    flatValuesExample,
  ],
];
export const backgroundExamples = [
  [
    "#background-bar",
    backgroundBarExample,
  ],
  [
    "#background-bubble",
    backgroundBubbleExample,
  ],
  [
    "#background-donut",
    backgroundDonutExample,
  ],
  [
    "#background-heatmap",
    backgroundHeatmapExample,
  ],
  [
    "#background-line",
    backgroundLineExample,
  ],
  [
    "#background-mixed",
    backgroundMixedExample,
  ],
  [
    "#background-percentage",
    backgroundPercentageExample,
  ],
  [
    "#background-pie",
    backgroundPieExample,
  ],
  [
    "#background-polar-area",
    backgroundPolarAreaExample,
  ],
  [
    "#background-radar",
    backgroundRadarExample,
  ],
  [
    "#background-scatter",
    backgroundScatterExample,
  ],
  [
    "#background-timesheet",
    backgroundTimesheetExample,
  ],
];
export const sparkExamples = [
  [
    "#spark-line",
    sparkLineExample,
  ],
  [
    "#spark-area",
    sparkAreaExample,
  ],
  [
    "#spark-bar",
    sparkBarExample,
  ],
];
export const heatmapExamples = [
  [
    "#heatmap",
    heatmapExample,
  ],
  [
    "#heatmap-quarter",
    quarterHeatmapExample,
  ],
];
