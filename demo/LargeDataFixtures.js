import { BarChart, LineChart } from "../src/index.js";

export function largeDataLineExample() {
  const values = Array.from({ length: 100_000 }, (_, index) => {
    const position = index / 99_999;
    const trend = 24 + 20 * position;
    const wave = 10 * Math.sin(position * Math.PI * 6);
    const peak = 42 * Math.exp(-(((position - 0.28) / 0.045) ** 2));
    const dip = 28 * Math.exp(-(((position - 0.6) / 0.06) ** 2));
    const recovery = 28 * Math.exp(-(((position - 0.82) / 0.035) ** 2));
    return Math.round((trend + wave + peak - dip + recovery) * 100) / 100;
  });
  const chart = LineChart.make("#large-data-line")
    .dataset({ name: "Signal · 100,000 values", values })
    .height(320)
    .dots(false)
    .smooth(false)
    .ariaLabel("Line chart with 100,000 values")
    .description(
      "A rising trend with three broad waves, a peak near 28,000, a dip near 60,000, and recovery near 82,000.",
    )
    .render();

  return {
    chart,
  };
}

export function largeDataBarExample() {
  const values = Array.from({ length: 100_000 }, (_, index) => {
    const position = index / 99_999;
    const trend = 24 + 20 * position;
    const wave = 10 * Math.sin(position * Math.PI * 6);
    const peak = 42 * Math.exp(-(((position - 0.28) / 0.045) ** 2));
    const dip = 28 * Math.exp(-(((position - 0.6) / 0.06) ** 2));
    const recovery = 28 * Math.exp(-(((position - 0.82) / 0.035) ** 2));
    return Math.round((trend + wave + peak - dip + recovery) * 100) / 100;
  });
  const chart = BarChart.make("#large-data-bar")
    .dataset({ name: "Signal · 100,000 values", values })
    .height(320)
    .radius(0)
    .ariaLabel("Bar chart with 100,000 values")
    .description(
      "A rising trend with three broad waves, a peak near 28,000, a dip near 60,000, and recovery near 82,000.",
    )
    .render();

  return {
    chart,
  };
}
