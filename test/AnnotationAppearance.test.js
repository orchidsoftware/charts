import { expect, it } from "vitest";

import { BarChart, LineChart } from "../src/index.js";
import "../src/styles.css";

const paths = (chart) =>
  [...chart.element.querySelectorAll(".orchid-charts-line")].map((path) => path.getAttribute("d"));

it("renders unoutlined auxiliary labels and preserves explicit colors and halos in standalone SVG", () => {
  const host = document.createElement("div");
  host.style.width = "360px";
  document.body.append(host);
  const chart = BarChart.make(host)
    .dataset("Actual", [64, 72, 68])
    .marker("Average", 68)
    .region("Expected", [42, 58], (region) => region.opacity(0.18))
    .render();

  for (const [surface, primary, expectedText] of [
    ["#ffffff", "#343a40", "rgb(52, 58, 64)"],
    ["#1c1c1e", "#eef0f3", "rgb(238, 240, 243)"],
  ]) {
    host.style.setProperty("--orchid-charts-mark-separator", surface);
    host.style.setProperty("--orchid-charts-label-color", primary);
    const label = host.querySelector(".orchid-charts-marker-label");
    const appearance = getComputedStyle(label);
    const exported = new DOMParser().parseFromString(chart.toSvg(), "image/svg+xml");
    const exportedLabel = exported.querySelector(".orchid-charts-marker-label");

    expect(appearance.opacity).toBe("1");
    expect(appearance.fill).toBe(expectedText);
    expect(appearance.stroke).toBe("none");
    expect(appearance.fontWeight).toBe("400");
    expect(exportedLabel.style.stroke).toBe(appearance.stroke);
    expect(exportedLabel.style.fill).toBe(appearance.fill);
    expect(exportedLabel.style.fontWeight).toBe("400");
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
  const exported = new DOMParser().parseFromString(chart.toSvg(), "image/svg+xml");
  const exportedLabel = exported.querySelector(".orchid-charts-marker-label");
  expect(exportedLabel.style.fill).toBe(appearance.fill);
  expect(exportedLabel.style.stroke).toBe(appearance.stroke);
  expect(exportedLabel.style.strokeWidth).toBe("2px");
  expect(exportedLabel.style.paintOrder).toBe("stroke");
  chart.destroy();
  host.remove();
});

it("keeps the original inline reference and plot geometry while using readable text", () => {
  const hosts = Array.from({ length: 2 }, () => {
    const host = document.createElement("div");
    host.style.width = "360px";
    host.style.setProperty("--orchid-charts-label-color", "#343a40");
    document.body.append(host);
    return host;
  });
  const builders = hosts.map((host) =>
    LineChart.make(host).dataset("Actual", [320, 410, 385, 530, 610, 684]).gradient().smooth().height(220),
  );
  const control = builders[0].render();
  const reference = builders[1].marker("План", 500, { lineStyle: "dashed" }).render();
  const line = reference.element.querySelector(".orchid-charts-marker");
  const label = reference.element.querySelector(".orchid-charts-marker-label");
  const bounds = label.getBBox();
  expect(bounds.x).toBeGreaterThan(Number(line.getAttribute("x1")));
  expect(bounds.x + bounds.width).toBeLessThan(Number(line.getAttribute("x2")));
  expect(bounds.y + bounds.height).toBeLessThan(Number(line.getAttribute("y1")));
  expect(reference.element.getAttribute("viewBox")).toBe(control.element.getAttribute("viewBox"));
  expect(paths(control)).toHaveLength(1);
  expect(paths(reference)).toEqual(paths(control));
  expect(getComputedStyle(label).fill).toBe("rgb(52, 58, 64)");
  expect(getComputedStyle(label).stroke).toBe("none");
  expect(
    reference.element.querySelector(".orchid-charts-marker-leader, .orchid-charts-annotation-background"),
  ).toBeNull();
  control.destroy();
  reference.destroy();
  for (const host of hosts) {
    host.remove();
  }
});
