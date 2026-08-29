import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

import { build } from "vite";

const gzipAsync = promisify(gzip);
const MAXIMUM_GZIP_BYTES = 15_000;
const SOURCE_BUDGET = Object.freeze({ bytes: 348_606, files: 46, imports: 120, lines: 11_094 });
const DEFINITIONS = Object.freeze([
  "BarChart",
  "BubbleChart",
  "DonutChart",
  "HeatmapChart",
  "LineChart",
  "MixedChart",
  "PercentageChart",
  "PieChart",
  "PolarAreaChart",
  "RadarChart",
  "ScatterChart",
  "TimesheetChart",
]);
const COMBINATIONS = Object.freeze({
  "Line + Bar": ["LineChart", "BarChart"],
  "Line + Heatmap": ["LineChart", "HeatmapChart"],
  "Line + Pie": ["LineChart", "PieChart"],
  "All definitions": DEFINITIONS,
});
const root = process.cwd();
const isReportOnly = process.env.CHARTS2_REPORT_ONLY === "1";

/**
 * Lists production JavaScript and CSS files without relying on shell-specific tools.
 *
 * @param {string} directory - Directory to inspect recursively.
 * @returns {Promise<string[]>} Sorted production source paths.
 */
async function productionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return await productionFiles(entryPath);
      }

      return /\.(?:css|js)$/u.test(entry.name) ? [entryPath] : [];
    }),
  );

  return files.flat().toSorted((left, right) => left.localeCompare(right));
}

/**
 * Measures maintainability budgets over authored production code.
 *
 * @returns {Promise<{bytes: number, files: number, imports: number, lines: number}>} Source metrics.
 */
async function sourceMetrics() {
  const files = await productionFiles(path.resolve(root, "src"));
  const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));

  return {
    bytes: contents.reduce((total, content) => total + Buffer.byteLength(content), 0),
    files: files.length,
    imports: contents.reduce(
      (total, content) => total + (content.match(/\bfrom\s+["'][^"']+["']/gu)?.length ?? 0),
      0,
    ),
    lines: contents.reduce((total, content) => total + (content.match(/\n/gu)?.length ?? 0), 0),
  };
}

/**
 * Builds one real consumer entry through the public package specifiers.
 *
 * @param {readonly string[]} definitions - Named definitions retained by the consumer.
 * @returns {Promise<{gzipBytes: number, rawBytes: number}>} Combined JavaScript and CSS size.
 */
async function consumerSize(definitions) {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "charts2-size-"));
  const entry = path.join(temporaryDirectory, "entry.js");
  const bindings = definitions.join(", ");
  const values = definitions.join(", ");

  await writeFile(
    entry,
    `import { ${bindings} } from "@charts2/core";\nimport "@charts2/core/style.css";\nglobalThis.__charts2Definitions = [${values}];\n`,
  );

  try {
    const result = await build({
      configFile: false,
      logLevel: "silent",
      resolve: {
        alias: [
          { find: "@charts2/core/style.css", replacement: path.resolve(root, "src/styles.css") },
          { find: "@charts2/core", replacement: path.resolve(root, "dist/index.js") },
        ],
      },
      build: {
        cssCodeSplit: false,
        minify: "terser",
        rollupOptions: {
          input: entry,
          output: { format: "es" },
          preserveEntrySignatures: "strict",
        },
        sourcemap: false,
        terserOptions: {
          compress: { module: true, passes: 5, toplevel: true },
          ecma: 2022,
          format: { comments: false },
          module: true,
          toplevel: true,
        },
        write: false,
      },
    });
    const artifacts = result.output.filter(
      (output) => output.type === "chunk" || !output.fileName.endsWith(".map"),
    );
    const contents = artifacts.map((output) =>
      Buffer.from(output.type === "chunk" ? output.code : output.source),
    );
    const compressed = await Promise.all(contents.map((content) => gzipAsync(content, { level: 9 })));

    return {
      rawBytes: contents.reduce((total, content) => total + content.byteLength, 0),
      gzipBytes: compressed.reduce((total, content) => total + content.byteLength, 0),
    };
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

/**
 * Records one failed release constraint without hiding the remaining report.
 *
 * @param {boolean} condition - Whether the release constraint is satisfied.
 * @param {string} message - Actionable failure description.
 * @returns {void} The process exit status is marked only outside reporting mode.
 */
function enforce(condition, message) {
  if (condition || isReportOnly) {
    return;
  }

  console.error(message);
  process.exitCode = 1;
}

const sources = await sourceMetrics();
const familySizes = Object.fromEntries(
  await Promise.all(DEFINITIONS.map(async (definition) => [definition, await consumerSize([definition])])),
);
const combinationSizes = Object.fromEntries(
  await Promise.all(
    Object.entries(COMBINATIONS).map(async ([name, definitions]) => [name, await consumerSize(definitions)]),
  ),
);
const largestFamily = Object.entries(familySizes).toSorted(
  (left, right) => right[1].gzipBytes - left[1].gzipBytes,
)[0];
const aggregate = combinationSizes["All definitions"];

console.log(
  Object.entries(familySizes)
    .map(([name, size]) => `${name}: ${(size.gzipBytes / 1000).toFixed(2)} kB gzip`)
    .join("\n"),
);
console.log(`Largest family: ${largestFamily[0]} ${(largestFamily[1].gzipBytes / 1000).toFixed(2)} kB gzip`);
console.log(
  `Complete package: ${(aggregate.rawBytes / 1000).toFixed(1)} kB (${(aggregate.gzipBytes / 1000).toFixed(1)} kB gzip)`,
);
console.log(
  `Production source: ${sources.lines} lines, ${sources.bytes} bytes, ${sources.files} files, ${sources.imports} imports`,
);

for (const [name, size] of Object.entries(familySizes)) {
  enforce(
    size.gzipBytes <= MAXIMUM_GZIP_BYTES,
    `${name} exceeds the 15.00 kB gzip limit by ${((size.gzipBytes - MAXIMUM_GZIP_BYTES) / 1000).toFixed(2)} kB`,
  );
}

for (const [metric, maximum] of Object.entries(SOURCE_BUDGET)) {
  enforce(
    sources[metric] <= maximum,
    `Production source ${metric} exceeds ${maximum} by ${sources[metric] - maximum}`,
  );
}

await writeFile(
  path.resolve(root, "demo/BuildSize.js"),
  `export default {
  aggregateGzipBytes: ${aggregate.gzipBytes.toLocaleString("en-US").replaceAll(",", "_")},
  aggregateRawBytes: ${aggregate.rawBytes.toLocaleString("en-US").replaceAll(",", "_")},
  gzipBytes: ${largestFamily[1].gzipBytes.toLocaleString("en-US").replaceAll(",", "_")},
  rawBytes: ${largestFamily[1].rawBytes.toLocaleString("en-US").replaceAll(",", "_")},
};\n`,
);
