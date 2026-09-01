import { describe, expect, it } from "vitest";

import { chartDefinition } from "../src/core/ChartDefinition.js";
import * as publicApi from "../src/index.js";
import { renderChart } from "../src/renderers/ChartRendering.js";
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
  return [
    ...source(path).matchAll(/from\s+["']([^"']+)["']/g),
  ].map((match) => match[1]);
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
    for (const [
      name,
      definition,
    ] of Object.entries(publicApi)) {
      expect(Object.isFrozen(definition), name).toBe(true);
      expect(Object.keys(definition), name).toEqual([
        "make",
      ]);
    }
  });

  it("keeps only cohesive source areas instead of one-file directories", () => {
    const paths = Object.keys(sources).map((path) => path.replace("../src/", ""));
    const areas = [
      ...new Set(paths.filter((path) => path.includes("/")).map((path) => path.split("/", 1)[0])),
    ].toSorted((left, right) => left.localeCompare(right));

    expect(areas).toEqual([
      "core",
      "renderers",
      "support",
    ]);

    const groups = [
      ...new Set(
        paths
          .filter((path) => path.split("/").length > 2)
          .map((path) => path.split("/").slice(0, 2).join("/")),
      ),
    ].toSorted((left, right) => left.localeCompare(right));

    expect(groups).toEqual([
      "core/builders",
      "renderers/cartesian",
      "renderers/composition",
      "renderers/temporal",
      "support/geometry",
      "support/presentation",
    ]);

    for (const group of groups) {
      expect(paths.filter((path) => path.startsWith(`${group}/`)).length, group).toBeGreaterThanOrEqual(3);
    }
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
      "support/geometry/CartesianGeometry.js",
      "support/geometry/Math.js",
      "support/Normalize.js",
      "support/presentation/Presentation.js",
      "support/geometry/Scale.js",
      "support/geometry/SectorGeometry.js",
    ]);
    const pureModules = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) => policyModules.has(path));

    for (const path of pureModules) {
      expect(imports(path), path).not.toContain(expect.stringContaining("/core/"));
      expect(imports(path), path).not.toContain(expect.stringContaining("/renderers/"));
      expect(source(path), path).not.toMatch(/\b(document|window|Element|SVGElement)\b/);
    }

    const supportModules = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) => path.startsWith("support/"));

    for (const path of supportModules) {
      expect(imports(path), path).not.toContain(expect.stringContaining("/core/"));
      expect(imports(path), path).not.toContain(expect.stringContaining("/renderers/"));
    }
  });

  it("keeps nested areas pointing toward shared policies instead of sibling features", () => {
    const paths = Object.keys(sources).map((path) => path.replace("../src/", ""));
    const builderModules = paths.filter((path) => path.startsWith("core/builders/"));

    for (const path of builderModules) {
      expect(imports(path), path).not.toContain(expect.stringMatching(/^\.\.\//));
    }

    const families = [
      "cartesian",
      "composition",
      "temporal",
    ];
    for (const family of families) {
      const familyModules = paths.filter((path) => path.startsWith(`renderers/${family}/`));
      const siblingFamilies = families.filter((name) => name !== family);

      for (const path of familyModules) {
        for (const sibling of siblingFamilies) {
          expect(imports(path), path).not.toContain(expect.stringContaining(`../${sibling}/`));
        }
      }
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
    expect(source("core/ChartData.js")).toMatch(/class ChartData[\s\S]*#datasets;/);
    expect(source("core/ChartSelection.js")).toMatch(/class ChartSelection[\s\S]*#policy;/);
    expect(source("core/ChartTooltip.js")).toMatch(/class ChartTooltip[\s\S]*#element;/);
    expect(source("core/InteractionController.js")).toMatch(
      /class InteractionController[\s\S]*#selectedIndex;/,
    );
    expect(source("renderers/cartesian/CartesianLayout.js")).toMatch(
      /class CartesianLayout[\s\S]*#chart;[\s\S]*#pointX;/,
    );
    expect(source("renderers/cartesian/CartesianInspectorRenderer.js")).toMatch(
      /class CartesianInspectorRenderer[\s\S]*#layout;/,
    );
    expect(source("renderers/composition/Composition.js")).toMatch(/class Composition[\s\S]*#chart;/);
    expect(source("renderers/SvgSurface.js")).toMatch(/class SvgSurface[\s\S]*#root;/);
    expect(source("renderers/temporal/TimesheetLayout.js")).toMatch(/class TimesheetLayout[\s\S]*#x;/);

    const rendererModules = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) => path.startsWith("renderers/"));
    const classModules = rendererModules.filter((path) => !path.endsWith("Rendering.js"));
    for (const path of classModules) {
      const className = path.split("/").at(-1).replace(".js", "");
      expect(source(path), path).toContain(`export default class ${className}`);
      expect(source(path), path).not.toMatch(/export\s*\{|export\s+(?:const|function|let|var)\b/);
    }

    const renderingModules = rendererModules.filter((path) => path.endsWith("Rendering.js"));
    for (const path of renderingModules) {
      expect(source(path), path).not.toContain("export default");
      expect(source(path), path).toMatch(/export\s*\{/);
    }

    const rendererImports = imports("core/ChartDefinition.js").filter((path) =>
      path.startsWith("../renderers/"),
    );
    expect(rendererImports).toEqual([
      "../renderers/cartesian/CartesianRendering.js",
      "../renderers/composition/AggregationRendering.js",
      "../renderers/composition/PolarAreaRendering.js",
      "../renderers/composition/RadarRendering.js",
      "../renderers/temporal/HeatmapRendering.js",
      "../renderers/temporal/TimesheetRendering.js",
    ]);
    expect(source("core/Chart.js")).not.toMatch(
      /\.call\(this\)|this\.(options|datasets|tooltip|parent|svg)\b/,
    );
  });

  it("fails closed before an unknown renderer can touch chart state", () => {
    expect(() => renderChart({}, "missing-strategy")).toThrow("render implementation must be a function");
    expect(() => chartDefinition(class {}, "line", {})).toThrow("requires createModel and render");
    expect(() => chartDefinition(class {}, "line", { createModel() {} })).toThrow(
      "requires createModel and render",
    );
  });

  it("separates configuration, selection, and radial rendering reasons to change", () => {
    expect(source("core/Chart.js")).not.toMatch(/#validate|#normalizeOptions|ALLOWED_OPTIONS/);
    expect(source("core/Options.js")).toContain("function normalizeChartOptions");
    expect(source("core/ChartData.js")).not.toMatch(/#radarSelection|#heatmapSelection|#seriesSelection/);
    expect(source("core/ChartData.js")).toContain("createSeriesSelection");
    expect(source("renderers/composition/RadarRendering.js")).not.toContain("polar-area");
    expect(source("renderers/composition/PolarAreaRendering.js")).not.toContain("charts2-radar");
    expect(source("renderers/composition/RadialRenderer.js")).toBeUndefined();
  });

  it("avoids classes that only wrap functions or data", () => {
    expect(source("core/ChartOptions.js")).toBeUndefined();
    expect(source("renderers/RendererContext.js")).toBeUndefined();
    expect(source("core/NextChartId.js")).toBeUndefined();
    expect(source("renderers/ChartRenderer.js")).toBeUndefined();
    expect(source("renderers/ChartRendering.js")).toContain("Object.freeze(chartState)");
    expect(source("renderers/ChartRendering.js")).toContain("new SvgSurface(element)");
    expect(source("renderers/Render.js")).toBeUndefined();
    expect(source("renderers/cartesian/CartesianSeriesRenderer.js")).toBeUndefined();
    expect(source("renderers/RenderChart.js")).toBeUndefined();
    expect(source("renderers/RenderCartesianSeries.js")).toBeUndefined();
  });

  it("keeps application vocabulary free from Java-style getter and setter method names", () => {
    const declarations = Object.values(sources)
      .join("\n")
      .split("\n")
      .map((line) => line.trimStart());
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const prefix of [
      "get",
      "set",
    ]) {
      const forbidden = declarations.some((line) => {
        const candidates = [
          prefix,
          `#${prefix}`,
          `static #${prefix}`,
          `function ${prefix}`,
        ];
        return candidates.some(
          (candidate) => line.startsWith(candidate) && uppercase.includes(line[candidate.length]),
        );
      });
      expect(forbidden, `${prefix}* application method`).toBe(false);
    }
  });

  it("contains no removed compatibility implementation", () => {
    const runtime = Object.entries(sources)
      .filter(
        ([
          path,
        ]) => !path.endsWith("core/Chart.js"),
      )
      .map(
        ([
          ,
          contents,
        ]) => contents,
      )
      .join("\n");

    expect(runtime).not.toMatch(/\bSparkline\b|isSparklineAlias|normalizeSparkline|charts2-compact-chart/);
  });

  it("routes closed chart choices through frozen enum values", () => {
    const runtime = Object.entries(sources)
      .filter(
        ([
          path,
        ]) =>
          !path.endsWith("support/Constants.js") &&
          !path.includes("Builder") &&
          !path.endsWith("core/ChartDefinition.js"),
      )
      .map(
        ([
          ,
          contents,
        ]) => contents,
      )
      .join("\n");

    expect(runtime).not.toMatch(
      /===?\s*["'](?:axis-mixed|bar|bubble|donut|heatmap|horizontal|line|percentage|pie|polar-area|radar|right|scatter|timesheet|vertical)["']/,
    );
  });
});
