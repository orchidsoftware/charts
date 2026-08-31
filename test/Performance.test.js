import { beforeEach, describe, expect, it } from "vitest";

import createChart from "./support/MountChart.js";

function measure(callback) {
  const startedAt = performance.now();
  callback();
  return performance.now() - startedAt;
}

describe("performance budgets in Chromium", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"></div>';
  });

  it("renders a typical 90-day line in under 50 milliseconds", () => {
    const labels = Array.from({ length: 90 }, (_value, index) => `Day ${index + 1}`);
    const values = Array.from({ length: 90 }, (_value, index) => 100 + Math.sin(index / 7) * 20);
    const duration = measure(() =>
      createChart("#chart", {
        type: "line",
        data: {
          labels,
          datasets: [
            { name: "Daily value", values },
          ],
        },
      }),
    );

    const path = document.querySelector(".charts2-line").getAttribute("d");

    expect(path.match(/ C/gu)).toHaveLength(89);
    expect(duration).toBeLessThan(50);
  });

  it("renders a 50,000-point line in under one second", () => {
    const values = Array.from({ length: 50_000 }, (_, index) => Math.sin(index / 100) * 100);
    const duration = measure(() =>
      createChart("#chart", {
        type: "line",
        data: {
          datasets: [
            { values },
          ],
        },
      }),
    );
    expect(document.querySelector(".charts2-line").getAttribute("d").length).toBeGreaterThan(1_000_000);
    expect(duration).toBeLessThan(1000);
  });

  it("handles 200 live updates of 100 points in under one second", () => {
    const chart = createChart("#chart", {
      type: "line",
      data: {
        datasets: [
          {
            values: [
              1,
            ],
          },
        ],
      },
    });
    const duration = measure(() => {
      for (let iteration = 0; iteration < 200; iteration += 1) {
        chart.update({
          datasets: [
            { values: Array.from({ length: 100 }, (_, index) => index + iteration) },
          ],
        });
      }
    });
    expect(duration).toBeLessThan(1000);
  });
});
