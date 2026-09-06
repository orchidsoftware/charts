import {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../../src/index.js";

export const demoCards = [
  ["line", "#line"],
  ["line-gradient", "#line-gradient"],
  ["bar-vertical", "#bar-vertical"],
  ["bar-horizontal", "#bar-horizontal"],
  ["bar-horizontal-stacked", "#bar-horizontal-stacked"],
  ["scatter", "#scatter"],
  ["bubble", "#bubble"],
  ["radar", "#radar"],
  ["polar", "#polar"],
  ["mixed", "#mixed"],
  ["axis-mixed-signed", "#mixed-signed"],
  ["pie", "#pie"],
  ["donut", "#donut"],
  ["percentage", "#percentage"],
  ["timesheet", "#timesheet"],
  ["heatmap", "#heatmap"],
  ["spark-line", "#spark-line"],
  ["spark-area", "#spark-area"],
  ["spark-bar", "#spark-bar"],
];

export const responsiveCards = [
  ["bubble", "#bubble"],
  ["line", "#line"],
  ["bar-horizontal", "#bar-horizontal"],
  ["radar", "#radar"],
  ["percentage", "#percentage"],
  ["timesheet", "#timesheet"],
  ["heatmap", "#heatmap"],
];

export const sharedMixedCards = [
  ["mixed-shared-hover", "#mixed"],
  ["mixed-dual-axis-shared-hover", "#mixed-signed"],
];

export const demoXYCards = [
  ["scatter-real-hover", "#scatter", "$799", 2],
  ["bubble-real-hover", "#bubble", "Music", 1],
];

export const demoCompositionCards = [
  ["pie-real-hover", "#pie"],
  ["donut-real-hover", "#donut"],
  ["percentage-real-hover", "#percentage"],
];

export const demoSections = [
  ["supported-families", "#supported-charts"],
  ["trends-and-targets", "#gallery"],
  ["compare-and-diagnose", "section[aria-labelledby='comparison-title']"],
  ["composition-and-activity", "section[aria-labelledby='composition-title']"],
];

export const stateFixtures = [
  [
    "line",
    (host) =>
      LineChart.make(host)
        .height(300)
        .ariaLabel("line interaction fixture")
        .onSelect(() => {})
        .labels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
        .dataset({
          name: "Actual",
          values: [18, 31, 27, 44, 39, 56],
        })
        .dataset({
          name: "Plan",
          values: [20, 25, 31, 37, 44, 50],
        })
        .render(),
  ],
  [
    "horizontal-bar",
    (host) =>
      BarChart.make(host)
        .height(300)
        .ariaLabel("horizontal-bar interaction fixture")
        .onSelect(() => {})
        .horizontal()
        .labels(["Europe", "Americas", "Asia-Pacific", "Africa"])
        .dataset({
          name: "Standard",
          values: [36, 42, 54, 61],
        })
        .dataset({
          name: "Express",
          values: [16, 18, 24, 28],
        })
        .render(),
  ],
  [
    "pie",
    (host) =>
      PieChart.make(host)
        .height(300)
        .ariaLabel("pie interaction fixture")
        .onSelect(() => {})
        .labels(["Search", "Direct", "Referrals"])
        .dataset({
          values: [48, 34, 18],
        })
        .render(),
  ],
  [
    "donut",
    (host) =>
      DonutChart.make(host)
        .height(300)
        .ariaLabel("donut interaction fixture")
        .onSelect(() => {})
        .labels(["Individual", "Family", "Student"])
        .dataset({
          values: [61, 27, 12],
        })
        .render(),
  ],
  [
    "percentage",
    (host) =>
      PercentageChart.make(host)
        .height(300)
        .ariaLabel("percentage interaction fixture")
        .onSelect(() => {})
        .labels(["Photos", "Apps", "Free"])
        .dataset({
          values: [72, 58, 64],
        })
        .render(),
  ],
  [
    "scatter",
    (host) =>
      ScatterChart.make(host)
        .height(300)
        .ariaLabel("scatter interaction fixture")
        .onSelect(() => {})
        .dataset({
          name: "Phone",
          values: [
            { x: 1, y: 18 },
            { x: 2, y: 24 },
          ],
        })
        .dataset({
          name: "Tablet",
          values: [
            { x: 1, y: 24 },
            { x: 2, y: 31 },
          ],
        })
        .render(),
  ],
  [
    "bubble",
    (host) =>
      BubbleChart.make(host)
        .height(300)
        .ariaLabel("bubble interaction fixture")
        .onSelect(() => {})
        .dataset({
          name: "Apps",
          values: [
            { x: 1, y: 78, r: 18 },
            { x: 2, y: 52, r: 10 },
          ],
        })
        .render(),
  ],
  [
    "mixed",
    (host) =>
      MixedChart.make(host)
        .height(300)
        .ariaLabel("mixed interaction fixture")
        .onSelect(() => {})
        .labels(["W1", "W2", "W3"])
        .dataset({
          name: "Actual",
          chartType: "bar",
          values: [28, 37, 34],
        })
        .dataset({
          name: "Plan",
          chartType: "line",
          values: [32, 35, 39],
        })
        .render(),
  ],
  [
    "mixed-dual-axis",
    (host) =>
      MixedChart.make(host)
        .height(300)
        .ariaLabel("mixed-dual-axis interaction fixture")
        .onSelect(() => {})
        .yAxis((axis) => axis.position("right"))
        .labels(["Mon", "Tue", "Wed"])
        .dataset({
          name: "Change",
          chartType: "bar",
          values: [-18, 9, -6],
        })
        .dataset({
          name: "Trend",
          chartType: "line",
          values: [-8, -4, -2],
        })
        .render(),
  ],
  [
    "radar",
    (host) =>
      RadarChart.make(host)
        .height(300)
        .ariaLabel("radar interaction fixture")
        .onSelect(() => {})
        .labels(["Speed", "Battery", "Camera", "Display", "Value"])
        .dataset({
          name: "Current",
          values: [92, 84, 89, 91, 72],
        })
        .dataset({
          name: "Previous",
          values: [74, 77, 71, 78, 81],
        })
        .render(),
  ],
  [
    "timesheet",
    (host) =>
      TimesheetChart.make(host)
        .height(300)
        .ariaLabel("timesheet interaction fixture")
        .onSelect(() => {})
        .range("2026-09-01T00:00:00Z", "2026-09-10T00:00:00Z")
        .task({
          label: "Design",
          start: "2026-09-01T00:00:00Z",
          end: "2026-09-03T00:00:00Z",
          group: "Product",
        })
        .task({
          label: "Implementation",
          start: "2026-09-03T00:00:00Z",
          end: "2026-09-07T00:00:00Z",
          group: "Engineering",
        })
        .task({
          label: "Release",
          start: "2026-09-07T00:00:00Z",
          end: "2026-09-10T00:00:00Z",
          group: "Distribution",
        })
        .render(),
  ],
  [
    "heatmap",
    (host) =>
      HeatmapChart.make(host)
        .ariaLabel("heatmap interaction fixture")
        .onSelect(() => {})
        .countLabel("events")
        .range(new Date("2026-01-01T00:00:00Z"), new Date("2026-03-31T00:00:00Z"))
        .points(
          Object.fromEntries(
            Array.from({ length: 90 }, (_, index) => {
              const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10);
              return [date, (index * 7 + (index % 5)) % 13];
            }),
          ),
        )
        .render(),
  ],
];

export const stateVariants = ["hover", "pressed", "pointer-active", "keyboard-focus", "keyboard-active"];
