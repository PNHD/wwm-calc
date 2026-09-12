import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-dust-provenance-"));

try {
  await build({ entryPoints: { provenance: "src/product/PathProvenance.tsx" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const { default: PathProvenance } = await import(pathToFileURL(path.join(tempDir, "provenance.mjs")).href);
  const dust = renderToStaticMarkup(PathProvenance({ pathKey: "bamboocut-dust" }));
  assert.match(dust, /Provisional model/, "Dust provenance must describe the model as provisional");
  assert.doesNotMatch(dust, /CALIBRATED|validated absolute DPS/i, "Dust provenance must not overclaim calibration");

  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const fallbackStart = app.lastIndexOf('if ("reason" in rotationStats)');
  assert.notEqual(fallbackStart, -1, "structured numerical-unavailable branch must exist");
  const unavailableBranch = app.slice(fallbackStart, app.indexOf("const handleStatChange", fallbackStart));
  assert.match(unavailableBranch, /<PathProvenance pathKey=\{selectedBuild\} \/>/, "missing-timing fallback must retain path provenance");
  assert.match(unavailableBranch, /numericalUnavailableMessage\(rotationStats/, "structured unavailable reason must remain visible");
  console.log("[v13-dust-unavailable-provenance] PASS — Dust unavailable fallback retains provisional provenance.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
