import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const temporary = await mkdtemp(path.join(os.tmpdir(), "orchid-package-"));

/**
 * Installs only the actual release archive into a clean consumer directory.
 *
 * @returns {Promise<string>} Installed package directory.
 */
async function unpackConsumer() {
  const packed = execFileSync(
    path.join(path.dirname(process.execPath), "npm"),
    [
      "pack",
      "--ignore-scripts",
      "--json",
      "--pack-destination",
      temporary,
      "--cache",
      path.join(temporary, "cache"),
    ],
    { encoding: "utf8" },
  );
  const [
    { filename },
  ] = JSON.parse(packed);
  execFileSync("/usr/bin/tar", [
    "-xzf",
    path.join(temporary, filename),
    "-C",
    temporary,
  ]);
  const scope = path.join(temporary, "node_modules/@orchidsoftware");
  await mkdir(scope, { recursive: true });
  const installed = path.join(scope, "charts");
  await rename(path.join(temporary, "package"), installed);
  await writeFile(path.join(temporary, "package.json"), '{"type":"module"}\n');
  await writeFile(
    path.join(temporary, "index.ts"),
    'import { LineChart } from "@orchidsoftware/charts";\nimport "@orchidsoftware/charts/style.css";\nLineChart.make("#chart").dataset([1, 2]).render();\n',
  );

  return installed;
}

try {
  const installed = await unpackConsumer();
  const manifest = JSON.parse(await readFile(path.join(installed, "package.json"), "utf8"));
  const exports = await import(pathToFileURL(path.join(installed, manifest.main)).href);
  assert.equal(Object.keys(exports).length, 12);
  for (const [
    module,
    resolution,
  ] of [
    [
      "ESNext",
      "Bundler",
    ],
    [
      "Node16",
      "Node16",
    ],
    [
      "NodeNext",
      "NodeNext",
    ],
  ]) {
    execFileSync(
      path.join(root, "node_modules/.bin/tsc"),
      [
        "--strict",
        "--noEmit",
        "--target",
        "ES2023",
        "--module",
        module,
        "--moduleResolution",
        resolution,
        "index.ts",
      ],
      { cwd: temporary, stdio: "pipe" },
    );
    console.log(`Packed consumer: ${resolution} imports JavaScript and CSS`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
