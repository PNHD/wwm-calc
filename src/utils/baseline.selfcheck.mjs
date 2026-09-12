import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-baseline-selfcheck-"));

try {
  await build({ entryPoints: { calc: "src/utils/calc.ts", catalog: "src/data/pathCatalog.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const catalog = await import(pathToFileURL(path.join(tempDir, "catalog.mjs")).href);
  const t96 = calc.TIERS["405|0.65b"];
  const dust = calc.getLegacyReferenceBaseline(t96, "bamboocut-dust");
  const jade = calc.getLegacyReferenceBaseline(t96, "silkbind-jade");

  assert.equal(calc.CURRENT_VALIDATED_BASELINE, null, "legacy anchors must not become a current validated baseline");
  assert.equal(dust?.value, 39_117 * calc.getRotationTimeForBuild("bamboocut-dust"), "the retained Dust T91 anchor must remain exact at the current tier");
  assert.equal(jade?.value, 35_321 * calc.getRotationTimeForBuild("silkbind-jade"), "the retained Jade T91 anchor must remain exact at the current tier");
  assert.equal(calc.calcBaseline(t96, "bamboocut-dust"), dust?.value, "the compatibility accessor must expose the same legacy reference value");
  assert.equal(calc.calcBaseline(t96, "bamboocut-wind"), null, "a legacy-only path must not receive a reference baseline");
  for (const capability of ["headlineDps", "bestBuild", "statPriority", "gearPathFit"]) {
    assert.equal(catalog.isProductCapabilityEnabled("bamboocut-wind", capability), false, `legacy reference data must not authorize ${capability}`);
  }
  console.log("baseline self-check OK");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
