import { createChart, type Chart, type HeatmapData, type SeriesData, type TimesheetData } from "../src/index.js";

const axis = createChart("#axis", {
  type: "bar",
  orientation: "horizontal",
  data: { labels: ["A"], datasets: [{ values: [1] }] },
});
axis satisfies Chart<SeriesData>;
axis.update({ labels: ["B"], datasets: [{ values: [2] }] });
axis.point(0)?.values satisfies readonly (number | undefined)[] | undefined;
// @ts-expect-error Series charts update with datasets, not heatmap data.
axis.update({ dataPoints: { "2026-01-01": 4 } });

const heatmap = createChart("#heatmap", {
  type: "heatmap",
  data: { dataPoints: { "2026-01-01": 4 } },
});
heatmap satisfies Chart<HeatmapData>;
heatmap.update({ start: new Date(), dataPoints: {} });
heatmap.point(0)?.date satisfies Date | undefined;
// @ts-expect-error Heatmaps require dated data, not series datasets.
heatmap.update({ datasets: [{ values: [1] }] });

const timesheet = createChart("#plan", {
  type: "timesheet",
  data: { tasks: [{ label: "Build", start: "2026-01-01", end: "2026-01-02" }] },
});
timesheet satisfies Chart<TimesheetData>;
timesheet.update({ tasks: [{ start: new Date(), end: Date.now() + 1000 }] });
timesheet.point(0)?.start satisfies Date | undefined;

// @ts-expect-error The chart type is required; there is no implicit line default.
createChart("#missing-type", { data: { datasets: [{ values: [1] }] } });
// @ts-expect-error Deprecated sparkline routing was removed.
createChart("#spark", { type: "sparkline", values: [1, 2] });
// @ts-expect-error Deprecated compact preset was removed.
createChart("#compact", { type: "line", compact: true, data: { datasets: [{ values: [1, 2] }] } });
