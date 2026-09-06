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
  type BarChartBuilder,
  type BubbleChartBuilder,
  type DonutChartBuilder,
  type HeatmapChartBuilder,
  type LineChartBuilder,
  type MixedChartBuilder,
  type PercentageChartBuilder,
  type PieChartBuilder,
  type PolarAreaChartBuilder,
  type RadarChartBuilder,
  type ScatterChartBuilder,
  type TimesheetChartBuilder,
} from "../src/index.js";

LineChart.make("#line") satisfies LineChartBuilder;
BarChart.make("#bar") satisfies BarChartBuilder;
ScatterChart.make("#scatter") satisfies ScatterChartBuilder;
MixedChart.make("#mixed") satisfies MixedChartBuilder;
BubbleChart.make("#bubble") satisfies BubbleChartBuilder;
PieChart.make("#pie") satisfies PieChartBuilder;
DonutChart.make("#donut") satisfies DonutChartBuilder;
PercentageChart.make("#percentage") satisfies PercentageChartBuilder;
RadarChart.make("#radar") satisfies RadarChartBuilder;
PolarAreaChart.make("#polar") satisfies PolarAreaChartBuilder;
HeatmapChart.make("#heatmap") satisfies HeatmapChartBuilder;
TimesheetChart.make("#timesheet") satisfies TimesheetChartBuilder;

const line = LineChart.make("#line")
  .labels(["Jan", "Feb"])
  .dataset("Revenue", [1, 2], (dataset) => dataset.gradient().smooth().dotSize(4))
  .marker("Target", 2)
  .region("Expected", [1, 3])
  .render();
line.update({ labels: ["Mar"], datasets: [{ name: "Revenue", values: [3] }] });
line.point()?.values satisfies readonly (number | undefined)[] | undefined;

const scatter = ScatterChart.make("#scatter")
  .dataset("Observed", [{ x: 1, y: 2 }])
  .render();
scatter.point()?.datasetIndex satisfies number | undefined;

MixedChart.make("#mixed")
  .line("Plan", [1, 2], (dataset) => dataset.gradient())
  .bar("Actual", [2, 3], (dataset) => dataset.radius(3))
  .scatter("Events", [{ x: 1, y: 2 }], (dataset) => dataset.opacity(0.5));

HeatmapChart.make("#heatmap")
  .points({ "2026-01-01": 2 })
  .tooltip((tooltip) => tooltip.formatDate(String));
TimesheetChart.make("#timesheet").task("Build", "2026-01-01", "2026-01-02");

// @ts-expect-error Heatmaps do not expose legends.
HeatmapChart.make("#heatmap").legend(true);
// @ts-expect-error Heatmaps derive their height from the adaptive calendar layout.
HeatmapChart.make("#heatmap").height(240);
// @ts-expect-error Radar does not expose Cartesian markers.
RadarChart.make("#radar").marker("Target", 2);
// @ts-expect-error Percentage does not expose sector start angles.
PercentageChart.make("#percentage").startAngle(90);
// @ts-expect-error Mixed positional datasets must name a concrete mark type.
MixedChart.make("#mixed").dataset([1, 2]);
// @ts-expect-error Bubble points require radius.
BubbleChart.make("#bubble").dataset([{ x: 1, y: 2 }]);
// @ts-expect-error A bar dataset callback does not expose gradient.
BarChart.make("#bar").dataset([1], (dataset) => dataset.gradient());

scatter.point()?.label satisfies string | number | undefined;
PieChart.make("#pie")
  .dataset([1, 2])
  .onSelect((selection) => {
    if (!selection) return;
    selection.label satisfies string | number;
    // @ts-expect-error Generated composition labels require narrowing before string methods.
    selection.label.toUpperCase();
    if (typeof selection.label === "string") selection.label.toUpperCase();
  });
