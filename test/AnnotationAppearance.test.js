import { expect, it } from "vitest";

import { BarChart } from "../src/index.js";
import "../src/styles.css";

it("preserves auxiliary label themes and explicit colors in standalone SVG", () => {
  const host = document.createElement("div");
  host.style.width = "360px";
  document.body.append(host);
  const chart = BarChart.make(host)
    .dataset("Actual", [64, 72, 68])
    .marker("Average", 68)
    .region("Expected", [42, 58], (region) => region.opacity(0.18))
    .render();

  for (const [surface, secondary, expectedText] of [
    ["#ffffff", "#6e6e73", "rgb(110, 110, 115)"],
    ["#1c1c1e", "#aeaeb2", "rgb(174, 174, 178)"],
  ]) {
    host.style.setProperty("--orchid-charts-mark-separator", surface);
    host.style.setProperty("--orchid-charts-secondary-label-color", secondary);
    const label = host.querySelector(".orchid-charts-marker-label");
    const appearance = getComputedStyle(label);
    const exported = new DOMParser().parseFromString(chart.toSvg(), "image/svg+xml");
    const exportedLabel = exported.querySelector(".orchid-charts-marker-label");

    expect(appearance.opacity).toBe("1");
    expect(appearance.fill).toBe(expectedText);
    expect(appearance.stroke).not.toBe("none");
    expect(exportedLabel.style.stroke).toBe(appearance.stroke);
    expect(exportedLabel.style.fill).toBe(appearance.fill);
    expect(exportedLabel.style.paintOrder).toBe("stroke");
    expect(exportedLabel.style.opacity).toBe("1");
    expect(getComputedStyle(host.querySelector(".orchid-charts-region")).opacity).toBe("0.18");
  }

  host.style.setProperty("--orchid-charts-annotation-halo", "#243844");
  host.style.setProperty("--reference-text", "#ffcc00");
  chart.update({
    datasets: [
      {
        name: "Actual",
        values: [64, 72, 68],
      },
    ],
    markers: [{ label: "Average", value: 68, labelColor: "var(--reference-text)" }],
  });
  const appearance = getComputedStyle(host.querySelector(".orchid-charts-marker-label"));
  expect(appearance.fill).toBe("rgb(255, 204, 0)");
  expect(appearance.stroke).toBe("rgb(36, 56, 68)");
  chart.destroy();
  host.remove();
});
