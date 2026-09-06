import { describe, expect, it } from "vitest";

import {
  AxisBuilder,
  BarDatasetBuilder,
  DatasetBuilder,
  HeatmapTooltipBuilder,
  LineDatasetBuilder,
  MarkerBuilder,
  RegionBuilder,
  SeriesTooltipBuilder,
  TimesheetTooltipBuilder,
  runScope,
} from "../../src/core/builders/BuilderScopes.js";

const formatter = String;

function scopeCases() {
  return [
    [() => new DatasetBuilder({}), (scope) => scope.color("red"), "Dataset"],
    [() => new LineDatasetBuilder({}), (scope) => scope.dots(true), "Dataset"],
    [() => new BarDatasetBuilder({}), (scope) => scope.radius(2), "Dataset"],
    [() => new SeriesTooltipBuilder({}), (scope) => scope.formatValue(formatter), "Tooltip"],
    [() => new AxisBuilder({}), (scope) => scope.position("left"), "Y-axis"],
    [() => new MarkerBuilder({}), (scope) => scope.width(1), "Marker"],
    [() => new RegionBuilder({}), (scope) => scope.opacity(1), "Region"],
    [() => new HeatmapTooltipBuilder({}), (scope) => scope.formatDate(formatter), "Heatmap tooltip"],
    [() => new TimesheetTooltipBuilder({}), (scope) => scope.formatDuration(formatter), "Timesheet tooltip"],
  ];
}

describe("callback builder scopes", () => {
  it("expires every scope after successful and failed callbacks", () => {
    for (const [createScope, configure, name] of scopeCases()) {
      const scope = createScope();
      expect(runScope(scope, () => 42)).toBeUndefined();
      expect(() => configure(scope)).toThrow(`${name} scope has expired`);

      const failedScope = createScope();
      const failure = new Error("callback failed");
      expect(() =>
        runScope(failedScope, () => {
          throw failure;
        }),
      ).toThrow(failure);
      expect(() => configure(failedScope)).toThrow(`${name} scope has expired`);
    }
  });

  it("copies caller-owned scoped values before retaining them", () => {
    const record = {};
    const pattern = [2, 3];
    runScope(new MarkerBuilder(record), (marker) => marker.dash(pattern));
    pattern.push(4);

    expect(record.dash).toEqual([2, 3]);
  });
});
