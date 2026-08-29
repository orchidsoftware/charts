import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);
const MAXIMUM_GZIP_BYTES = 32_000;
const files = ["dist/charts2.js", "dist/charts2.css"];
const contents = await Promise.all(files.map((file) => readFile(file)));
const compressed = await Promise.all(contents.map((content) => gzipAsync(content)));
const rawBytes = contents.reduce((total, content) => total + content.byteLength, 0);
const gzipBytes = compressed.reduce((total, content) => total + content.byteLength, 0);
const serializedRawBytes = rawBytes.toLocaleString("en-US").replaceAll(",", "_");
const serializedGzipBytes = gzipBytes.toLocaleString("en-US").replaceAll(",", "_");

await writeFile(
  "demo/BuildSize.js",
  `export default { rawBytes: ${serializedRawBytes}, gzipBytes: ${serializedGzipBytes} };\n`,
);
console.log(
  `Demo bundle size: ${(rawBytes / 1000).toFixed(1)} kB (${(gzipBytes / 1000).toFixed(1)} kB gzip)`,
);

if (gzipBytes > MAXIMUM_GZIP_BYTES) {
  console.error(
    `Bundle size exceeds the ${(MAXIMUM_GZIP_BYTES / 1000).toFixed(1)} kB gzip limit by ${(
      (gzipBytes - MAXIMUM_GZIP_BYTES) /
      1000
    ).toFixed(1)} kB`,
  );
  process.exitCode = 1;
}
