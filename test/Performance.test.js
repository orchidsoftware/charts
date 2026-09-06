import { beforeEach, describe, expect, it } from "vitest";

import { LineChart } from "../src/index.js";

function measure(callback) {
  const startedAt = performance.now();
  callback();
  return performance.now() - startedAt;
}

function median(samples) {
  return samples.toSorted((left, right) => left - right)[Math.floor(samples.length / 2)];
}

function mountDuration(values) {
  const startedAt = performance.now();
  const chart = LineChart.make("#chart").dataset(values).render();
  const duration = performance.now() - startedAt;
  expect(chart.point(values.length - 1).values).toEqual([
    values.at(-1),
  ]);
  chart.destroy();
  return duration;
}

function sampledMount(values) {
  mountDuration(values);
  mountDuration(values);
  return median(Array.from({ length: 5 }, () => mountDuration(values)));
}

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width:640px"></div>';
});

describe("performance budgets in Chromium", () => {
  it("mounts a typical 90-day line within a 50ms median budget", () => {
    const values = Array.from({ length: 90 }, (_value, index) => 100 + Math.sin(index / 7) * 20);
    expect(sampledMount(values)).toBeLessThan(50);
  });

  it("mounts 50,000 values within a one-second median budget while retaining all public values", () => {
    const values = Array.from({ length: 50_000 }, (_value, index) => Math.sin(index / 100) * 100);
    expect(sampledMount(values)).toBeLessThan(1000);
  });

  it("handles 200 live updates within a one-second median budget", () => {
    const chart = LineChart.make("#chart")
      .dataset([
        1,
      ])
      .render();
    const update = () => {
      for (let iteration = 0; iteration < 200; iteration += 1) {
        chart.update({
          datasets: [
            { values: Array.from({ length: 100 }, (_value, index) => index + iteration) },
          ],
        });
      }
    };
    update();
    const samples = Array.from({ length: 5 }, () => measure(update));
    expect(median(samples)).toBeLessThan(1000);
    expect(chart.point(99).values).toEqual([
      298,
    ]);
  });

  it("has measurable chart geometry at the next rendered frame within one second", async () => {
    const startedAt = performance.now();
    const chart = LineChart.make("#chart")
      .dataset([
        1,
        3,
        2,
      ])
      .render();
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    expect(chart.element.getBBox().width).toBeGreaterThan(0);
    expect(chart.element.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });
});
