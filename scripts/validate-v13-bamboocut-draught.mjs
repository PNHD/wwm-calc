import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-draught-"));
const calcBundlePath = path.join(tempDir, "calc.mjs");
const catalogBundlePath = path.join(tempDir, "catalog.mjs");

try {
  await build({
    entryPoints: { calc: "src/utils/calc.ts", catalog: "src/data/pathCatalog.ts" },
    bundle: true,
    format: "esm",
    platform: "node",
    outdir: tempDir,
    outExtension: { ".js": ".mjs" },
  });

  const calc = await import(pathToFileURL(calcBundlePath).href);
  const catalog = await import(pathToFileURL(catalogBundlePath).href);
  const paths = catalog.createProductPathCatalog({ dust: { label: "Dust", weapons: "Known", tier: "Modeled" } }, new Set());
  const draught = paths.find((entry) => entry.id === "bamboocut-draught");
  assert.ok(draught, "Draught must be a normal entry in the canonical primary path catalog");
  assert.equal(draught.capability, "UNMODELED", "Draught must explicitly declare an unmodeled capability");
  assert.equal(draught.currentGlobal, true, "Draught must retain its accepted current-Global status");
  const rotation = calc.getRotationForBuild("bamboocut-draught");
  const duration = calc.getRotationTimeForBuild("bamboocut-draught");
  const baseline = calc.calcBaseline(calc.TIERS.T96, "bamboocut-draught");

  assert.equal(rotation, null, "unmodeled Draught rotation must be unavailable, not an empty modeled rotation");
  assert.equal(duration, null, "unmodeled Draught duration must be unavailable, not numeric zero");
  assert.equal(baseline, null, "unmodeled Draught graduation baseline must be unavailable, not numeric zero");
  const availability = catalog.getNumericalPathAvailability("bamboocut-draught");
  assert.equal(availability.numericalModelAvailable, false, "an unmodeled path must stop at the numerical product boundary");
  assert.equal(catalog.isBestBuildEligible("bamboocut-draught"), false, "Draught must not be eligible for Best Build");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-draught", "bamboocut-dust"), false, "a modeled-path Best Build result must not render after switching to Draught");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-dust", "bamboocut-dust"), true, "a matching modeled-path Best Build result remains renderable");

  console.log("[v13-bamboocut-draught] PASS — canonical Draught capability, explicit unavailable inputs, numerical boundary, and stale-result guard verified.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
