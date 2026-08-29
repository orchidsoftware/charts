import { beforeEach, describe, expect, it } from "vitest";

import ChartData from "../../src/core/ChartData.js";
import { normalizeChartOptions, validateChartOptions } from "../../src/core/Options.js";
import {
  normalizeTimesheetData,
  requireFiniteNumber,
  validateChartData,
} from "../../src/support/Normalize.js";

const scene = { datasets: [{ values: [1] }] };

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});

describe("internal boundary validation", () => {
  it.each([
    [null, "options"],
    [{ type: "line", data: scene, unknown: true }, "Unsupported chart option"],
    [{ type: "unknown", data: scene }, "Chart type"],
    [{ type: "bar", data: scene, orientation: "diagonal" }, "orientation"],
    [{ type: "line", data: scene, yAxisPosition: "center" }, "position"],
    [{ type: "pie", data: scene, padAngle: Infinity }, "Pad angle"],
    [{ type: "pie", data: scene, radius: -1 }, "Radius"],
  ])("rejects invalid runtime options", (options, message) => {
    expect(() => validateChartOptions(options)).toThrow(message);
  });

  it("rejects invalid normalized dimensions and palettes", () => {
    const host = document.querySelector("#chart");

    expect(() => normalizeChartOptions(host, { type: "line", data: scene, width: 0 })).toThrow("width");
    expect(() => normalizeChartOptions(host, { type: "line", data: scene, colors: [] })).toThrow("colors");
  });

  it("covers normalization invariants used by updates and generated labels", () => {
    expect(() => requireFiniteNumber(NaN, "Value")).toThrow("finite");
    expect(() => normalizeTimesheetData({ tasks: [null] }, ["#007aff"])).toThrow("object");
    expect(() =>
      validateChartData(
        "pie",
        [
          { identityName: "A", points: [{ y: 1 }] },
          { identityName: "B", points: [{ y: 1 }] },
        ],
        ["One"],
      ),
    ).toThrow("exactly one dataset");

    const data = new ChartData("line", { labels: [1], datasets: [{ values: [1] }] });
    expect(data.labels).toEqual([1]);
  });
});
