import { describe, expect, it } from "vitest";

import * as publicApi from "../src/index.js";
import { renderChart } from "../src/renderers/Render.js";
import {
  ChartOrientation,
  ChartType,
  DEFAULT_COLORS,
  TIME_TICK_STEPS,
  TYPES,
  YAxisPosition,
} from "../src/support/Constants.js";

const sources = import.meta.glob("../src/**/*.js", {
  eager: true,
  import: "default",
  query: "?raw",
});

function source(path) {
  return sources[`../src/${path}`];
}

function imports(path) {
  return [...source(path).matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

describe("architecture fitness functions", () => {
  it("exports only the frozen named chart definitions", () => {
    const names = [
      "LineChart",
      "BarChart",
      "ScatterChart",
      "MixedChart",
      "BubbleChart",
      "PieChart",
      "DonutChart",
      "PercentageChart",
      "RadarChart",
      "PolarAreaChart",
      "HeatmapChart",
      "TimesheetChart",
    ].toSorted((left, right) => left.localeCompare(right));

    expect(Object.keys(publicApi)).toEqual(names);
    for (const [name, definition] of Object.entries(publicApi)) {
      expect(Object.isFrozen(definition), name).toBe(true);
      expect(Object.keys(definition), name).toEqual(["make"]);
    }
  });

  it("keeps only cohesive source areas instead of one-file directories", () => {
    const areas = [
      ...new Set(
        Object.keys(sources)
          .map((path) => path.replace("../src/", ""))
          .filter((path) => path.includes("/"))
          .map((path) => path.split("/", 1)[0]),
      ),
    ].toSorted((left, right) => left.localeCompare(right));

    expect(areas).toEqual(["core", "renderers", "support"]);
  });

  it("keeps closed vocabularies and shared value collections immutable", () => {
    for (const value of [
      ChartType,
      ChartOrientation,
      YAxisPosition,
      TYPES,
      DEFAULT_COLORS,
      TIME_TICK_STEPS,
    ]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(ChartType, "LINE", "changed")).toBe(false);
    expect(Reflect.set(TYPES, 0, "changed")).toBe(false);
    expect(ChartType.LINE).toBe("line");
    expect(TYPES).toContain(ChartType.LINE);
  });

  it("keeps pure policies independent from core and renderers", () => {
    const policyModules = new Set([
      "support/CartesianGeometry.js",
      "support/Math.js",
      "support/Normalize.js",
      "support/Presentation.js",
      "support/Scale.js",
      "support/SectorGeometry.js",
    ]);
    const pureModules = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) => policyModules.has(path));

    for (const path of pureModules) {
      expect(imports(path), path).not.toContain(expect.stringContaining("/core/"));
      expect(imports(path), path).not.toContain(expect.stringContaining("/renderers/"));
      expect(source(path), path).not.toMatch(/\b(document|window|Element|SVGElement)\b/);
    }
  });

  it("keeps renderers from owning hosts, tooltips, or browser listeners", () => {
    const rendererModules = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) => path.startsWith("renderers/"));

    for (const path of rendererModules) {
      expect(source(path), path).not.toMatch(
        /createElement|createElementNS|addEventListener|replaceChildren/,
      );
      expect(imports(path), path).not.toContain(expect.stringContaining("/core/"));
      expect(imports(path), path).not.toContain(expect.stringContaining("/interactions/"));
    }
  });

  it("uses classes for stateful behavior and native private fields for ownership", () => {
    expect(source("core/Chart.js")).toMatch(/class Chart[\s\S]*#host;[\s\S]*#options;[\s\S]*#model;/);
    expect(source("core/ChartData.js")).toMatch(/class ChartData[\s\S]*#datasets = \[\];/);
    expect(source("core/ChartSelection.js")).toMatch(/class ChartSelection[\s\S]*#type;/);
    expect(source("core/ChartTooltip.js")).toMatch(/class ChartTooltip[\s\S]*#element;/);
    expect(source("core/InteractionController.js")).toMatch(
      /class InteractionController[\s\S]*#selectedIndex;/,
    );
    expect(source("renderers/CartesianLayout.js")).toMatch(
      /class CartesianLayout[\s\S]*#chart;[\s\S]*#pointX;/,
    );
    expect(source("renderers/CartesianInspectorRenderer.js")).toMatch(
      /class CartesianInspectorRenderer[\s\S]*#layout;/,
    );
    expect(source("renderers/Composition.js")).toMatch(/class Composition[\s\S]*#chart;/);
    expect(source("renderers/SvgSurface.js")).toMatch(/class SvgSurface[\s\S]*#root;/);
    expect(source("renderers/TimesheetLayout.js")).toMatch(/class TimesheetLayout[\s\S]*#x;/);

    const concreteRenderers = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) =>
        /^renderers\/(Aggregation|Cartesian|Heatmap|Legend|PolarArea|Radar|Timesheet)Renderer\.js$/.test(
          path,
        ),
      );
    expect(concreteRenderers).toHaveLength(7);
    for (const path of concreteRenderers) {
      expect(source(path), path).toMatch(/export default class \w+Renderer/);
    }
    expect(source("core/Chart.js")).not.toMatch(
      /\.call\(this\)|this\.(options|datasets|tooltip|parent|svg)\b/,
    );
  });

  it("fails closed before an unknown renderer can touch chart state", () => {
    expect(() => renderChart({}, "missing-strategy")).toThrow("No render strategy");
  });

  it("separates configuration, selection, and radial rendering reasons to change", () => {
    expect(source("core/Chart.js")).not.toMatch(/#validate|#normalizeOptions|ALLOWED_OPTIONS/);
    expect(source("core/Options.js")).toContain("function normalizeChartOptions");
    expect(source("core/ChartData.js")).not.toMatch(/#radarSelection|#heatmapSelection|#seriesSelection/);
    expect(source("core/ChartData.js")).toContain("new ChartSelection");
    expect(source("renderers/RadarRenderer.js")).not.toContain("polar-area");
    expect(source("renderers/PolarAreaRenderer.js")).not.toContain("charts2-radar");
    expect(source("renderers/RadialRenderer.js")).toBeUndefined();
  });

  it("avoids classes that only wrap functions or data", () => {
    expect(source("core/ChartOptions.js")).toBeUndefined();
    expect(source("renderers/RendererContext.js")).toBeUndefined();
    expect(source("core/NextChartId.js")).not.toMatch(/\bclass\b/);
    expect(source("renderers/ChartRenderer.js")).toBeUndefined();
    expect(source("renderers/Render.js")).toContain("Object.freeze(chartState)");
    expect(source("renderers/Render.js")).toContain("new SvgSurface(element)");
  });

  it("keeps application vocabulary free from Java-style getter and setter method names", () => {
    const declarations = Object.values(sources)
      .join("\n")
      .split("\n")
      .map((line) => line.trimStart());
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const prefix of ["get", "set"]) {
      const forbidden = declarations.some((line) => {
        const candidates = [prefix, `#${prefix}`, `static #${prefix}`, `function ${prefix}`];
        return candidates.some(
          (candidate) => line.startsWith(candidate) && uppercase.includes(line[candidate.length]),
        );
      });
      expect(forbidden, `${prefix}* application method`).toBe(false);
    }
  });

  it("contains no removed compatibility implementation", () => {
    const runtime = Object.entries(sources)
      .filter(([path]) => !path.endsWith("core/Chart.js"))
      .map(([, contents]) => contents)
      .join("\n");

    expect(runtime).not.toMatch(/\bSparkline\b|isSparklineAlias|normalizeSparkline|charts2-compact-chart/);
  });

  it("routes closed chart choices through frozen enum values", () => {
    const runtime = Object.entries(sources)
      .filter(
        ([path]) =>
          !path.endsWith("support/Constants.js") &&
          !path.includes("Builder") &&
          !path.endsWith("core/ChartDefinition.js"),
      )
      .map(([, contents]) => contents)
      .join("\n");

    expect(runtime).not.toMatch(
      /===?\s*["'](?:axis-mixed|bar|bubble|donut|heatmap|horizontal|line|percentage|pie|polar-area|radar|right|scatter|timesheet|vertical)["']/,
    );
  });
});
