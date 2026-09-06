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
    const pureModules = Object.keys(sources)
      .map((path) => path.replace("../src/", ""))
      .filter((path) => path.startsWith("support/data/") || path.startsWith("support/geometry/"));

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

  it("keeps model projections transitively independent from browser mechanisms", () => {
    const pending = [
      "core/ChartData.js",
      "core/ChartPoints.js",
      "core/ChartSelection.js",
    ];
    const visited = new Set();
    while (pending.length > 0) {
      const path = pending.pop();
      if (visited.has(path)) {
        continue;
      }
      visited.add(path);
      const code = source(path).replaceAll(/\/\*[\s\S]*?\*\//g, "");
      expect(code, path).not.toMatch(/\b(document|window|Element|SVGElement|ResizeObserver)\b/);
      const dependencies = imports(path).filter((value) => value.startsWith("."));
      for (const dependency of dependencies) {
        const resolved = new URL(dependency, `https://source.test/src/${path}`).pathname.slice(5);
        expect(resolved, path).not.toMatch(/^(renderers\/|support\/Dom\.js|support\/ChartMark\.js)/);
        pending.push(resolved);
      }
    }
  });

  it("keeps nested areas pointing toward shared policies instead of sibling features", () => {
    const paths = Object.keys(sources).map((path) => path.replace("../src/", ""));
    const builderModules = paths.filter((path) => path.startsWith("core/builders/"));

    for (const path of builderModules) {
      expect(imports(path), path).not.toContain(expect.stringContaining("/renderers/"));
      expect(imports(path), path).not.toContain("../Chart.js");
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

  it("fails closed before an unknown renderer can touch chart state", () => {
    expect(() => renderChart({}, "missing-strategy")).toThrow("render implementation must be a function");
    expect(() => chartDefinition(class {}, "line", {})).toThrow("requires createModel and render");
    expect(() => chartDefinition(class {}, "line", { createModel() {} })).toThrow(
      "requires createModel and render",
    );
  });

  it("has an acyclic local dependency graph with resolvable imports", () => {
    const graph = new Map(
      Object.keys(sources).map((path) => {
        const key = new URL(path, "https://source.test/test/").pathname;
        const dependencies = imports(path.replace("../src/", ""))
          .filter((specifier) => specifier.startsWith("."))
          .map((specifier) => new URL(specifier, `https://source.test${key}`).pathname);
        return [
          key,
          dependencies,
        ];
      }),
    );
    const complete = new Set();
    function visit(path, ancestors) {
      expect(ancestors, `Cycle through ${path}`).not.toContain(path);
      expect(graph.has(path), `Missing module ${path}`).toBe(true);
      if (complete.has(path)) {
        return;
      }
      for (const dependency of graph.get(path)) {
        visit(dependency, [
          ...ancestors,
          path,
        ]);
      }
      complete.add(path);
    }
    for (const path of graph.keys()) {
      visit(path, []);
    }
  });
});
