import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-gear-score-"));
try {
  await build({ entryPoints: { gear: "src/utils/globalT96Gear.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const { scoreGlobalT96Gear } = await import(pathToFileURL(path.join(tempDir, "gear.mjs")).href);
  const lines = [{ type: "Max Phys ATK", val: "100" }];

  for (const pathKey of ["stonesplit-might", "stonesplit-strength", "bamboocut-kite", "bamboocut-draught", "stonesplit-awe", "stonesplit-pure-datang", "not-a-path"]) {
    const score = scoreGlobalT96Gear(lines, pathKey, 7, "Helmet");
    assert.equal(score.pathSpecificAvailable, false, `${pathKey}: path-specific scoring must be unavailable`);
    assert.equal(score.buildFit, null, `${pathKey}: build fit must not be a recommendation`);
    assert.equal(score.modeledContribution, null, `${pathKey}: modeled contribution must be unavailable`);
    assert.equal(score.overall, null, `${pathKey}: overall score must be unavailable`);
    assert.equal(score.lines[0].fitWeight, null, `${pathKey}: line weight must not borrow a path profile`);
    assert.equal(score.rollQualityAvailable, true, `${pathKey}: path-independent roll diagnostics remain available`);
    assert.ok(score.rollQuality > 0, `${pathKey}: recognized roll quality remains diagnostic`);
  }

  for (const pathKey of ["bellstrike-splendor", "bellstrike-umbra", "silkbind-jade", "silkbind-deluge", "bamboocut-wind", "bamboocut-dust"]) {
    const score = scoreGlobalT96Gear(lines, pathKey, 7, "Helmet");
    assert.deepEqual([score.pathSpecificAvailable, score.buildFit, score.modeledContribution, score.overall], [false, null, null, null], `${pathKey}: current matrix disables all path-specific gear fit`);
  }
  const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const arsenal = fs.readFileSync(new URL("../src/product/workspaces/ArsenalWorkspace.tsx", import.meta.url), "utf8");
  assert.ok(app.includes('isProductCapabilityEnabled(selectedBuild, "statPriority")'), "Arsenal stat priorities must use the named statPriority capability");
  assert.ok(arsenal.includes('score === null || score === undefined ? "N/A"'), "Arsenal must render unavailable path-specific scores as N/A");
  console.log("[v13-gear-score-fail-closed] PASS — every current path retains roll diagnostics only; path-specific gear fit is fail-closed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
