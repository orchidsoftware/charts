import { expect, it } from "vitest";

import Composition from "../../src/renderers/composition/Composition.js";
import { normalizePoint, validateChartData } from "../../src/support/data/SeriesData.js";
import { linePath } from "../../src/support/geometry/CartesianGeometry.js";
import { roundedSectorPath } from "../../src/support/geometry/SectorGeometry.js";
import { intensityLevel } from "../../src/support/Palette.js";
import { formatterText } from "../../src/support/presentation/Formatting.js";

function expectFailure(callback, message) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- Expectations are fixed test-source strings.
  expect(callback).toThrow(new RegExp(message, "iu"));
}

it("rejects invalid point and dataset shapes", () => {
  expectFailure(() => normalizePoint(null, 0), "number or an object");
  expect(normalizePoint({ y: 2 }, 3).x).toBe(3);
  expectFailure(
    () =>
      validateChartData(
        "line",
        [
          {
            points: [{ y: 1 }],
          },
        ],
        "A",
      ),
    "labels must be an array",
  );
  expectFailure(
    () =>
      validateChartData(
        "radar",
        [
          {
            points: [{ y: -1 }],
          },
        ],
        ["A"],
      ),
    "values must be non-negative",
  );
});

it("rejects radial data with no positive total", () => {
  expectFailure(
    () =>
      new Composition({
        labels: ["A"],
        datasets: [
          {
            points: [{ y: 0 }],
          },
        ],
        options: { type: "pie" },
      }),
    "positive total",
  );
});

it("constructs sector paths at zero radius and zero corner radius", () => {
  expect(
    roundedSectorPath({
      center: { x: 0, y: 0 },
      radii: { outer: 10, inner: 0 },
      angles: { outer: { start: 0, end: 1 }, inner: { start: 0, end: 1 } },
      cornerRadius: 0,
    }),
  ).toContain("A10,10");
  expect(
    roundedSectorPath({
      center: { x: 0, y: 0 },
      radii: { outer: 0, inner: 0 },
      angles: { outer: { start: 0, end: 0 }, inner: { start: 0, end: 0 } },
      cornerRadius: 1,
    }),
  ).toContain("A0,0");
});

it("maps flat palettes to their endpoint levels", () => {
  expect(intensityLevel(0, [0, 0], 5)).toBe(0);
  expect(intensityLevel(2, [2, 2], 5)).toBe(4);
});

it("preserves descending coordinates in straight lines", () => {
  expect(
    linePath([
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]),
  ).toBe("M2,1 L1,2");
});

it("requires formatters to return text", () => {
  expectFailure(() => formatterText(1, "Value"), "Value formatter must return a string");
});
