import { LineChart } from "../src/index.js";

import buildSize from "./BuildSize.js";
import { showExampleCode } from "./ExampleCode.js";
import {
  backgroundExamples,
  heatmapExamples,
  qualityExamples,
  showcaseExamples,
  sparkExamples,
} from "./Examples.js";

function formatBundleSize(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

const bundleSizeValue = document.querySelector("#bundle-size-value");
const bundleSizeGzip = document.querySelector("#bundle-size-gzip");
if (bundleSizeValue && bundleSizeGzip) {
  bundleSizeValue.textContent = formatBundleSize(buildSize.rawBytes);
  bundleSizeGzip.textContent = `(${formatBundleSize(buildSize.gzipBytes)} gzip)`;
}

const updatableCharts = [];
const heroRevenueHost = document.querySelector("#hero-revenue");

if (heroRevenueHost) {
  const source = {
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
        name: "Revenue",
        color: "var(--charts2-demo-blue)",
        values: [
          42,
          47,
          45,
          53,
          58,
          61,
          60,
          68,
          65,
          70,
          79,
          81,
        ],
      },
      {
        name: "Plan",
        color: "var(--charts2-demo-coral)",
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
    ],
  };
  const chart = LineChart.make(heroRevenueHost)
    .labels(source.labels)
    .dataset(source.datasets[0])
    .dataset(source.datasets[1])
    .height(220)
    .legend(false)
    .dots(false)
    .gradient()
    .ariaLabel("Monthly recurring revenue and plan")
    .render();

  updatableCharts.push({ chart, source });
}

for (const [
  selector,
  renderExample,
] of showcaseExamples) {
  if (document.querySelector(selector)) {
    updatableCharts.push(renderExample());
  }
}

for (const examples of [
  qualityExamples,
  backgroundExamples,
  heatmapExamples,
]) {
  for (const [
    selector,
    renderExample,
  ] of examples) {
    if (document.querySelector(selector)) {
      renderExample();
    }
  }
}

const sparks = [];
for (const [
  selector,
  renderExample,
] of sparkExamples) {
  if (document.querySelector(selector)) {
    sparks.push(renderExample());
  }
}

showExampleCode([
  ...showcaseExamples,
  ...qualityExamples,
  ...backgroundExamples,
  ...heatmapExamples,
  ...sparkExamples,
]);

function varyValue(value) {
  const factor = 0.72 + Math.random() * 0.56;
  return typeof value === "number" ? value * factor : { ...value, y: value.y * factor };
}

document.querySelector("#shuffle")?.addEventListener("click", () => {
  for (const { chart, source } of [
    ...updatableCharts,
    ...sparks,
  ]) {
    if (!source.datasets) {
      continue;
    }
    chart.update({
      ...source,
      datasets: source.datasets.map((dataset) => ({
        ...dataset,
        values: dataset.values.map((value) => varyValue(value)),
      })),
    });
  }
});
