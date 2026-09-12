import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { compareArenaBuilds, rankArenaCandidates } from "../src/arena/arena-core.mjs";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-capabilities-"));
const states = { A: "ALLOW", P: "PROVISIONAL", R: "REFERENCE_ONLY", D: "DISABLED" };
const expected = {
  "bellstrike-splendor": ["MODELED_PROVISIONAL", "P P P D D P D D P R A"],
  "bellstrike-umbra": ["MODELED_PROVISIONAL", "P P P D D P D D P R A"],
  "silkbind-jade": ["MODELED_PROVISIONAL", "P P P D P P P D D R A"],
  "silkbind-deluge": ["MODELED_PROVISIONAL", "P P P D D D D D P D A"],
  "stonesplit-might": ["UNMODELED", "D D D D D D D D D R R"],
  "stonesplit-strength": ["UNMODELED", "D D D D D D D D D D R"],
  "bamboocut-wind": ["REFERENCE_ONLY", "D D R D D D D D D R R"],
  "bamboocut-dust": ["MODELED_PROVISIONAL", "P P P D D D D D P R A"],
  "bamboocut-kite": ["UNMODELED", "D D D D D D D D D D R"],
  "bamboocut-draught": ["UNMODELED", "D D D D D D D D D D R"],
};

try {
  await build({ entryPoints: { catalog: "src/data/pathCatalog.ts", calc: "src/utils/calc.ts", gear: "src/utils/globalT96Gear.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const catalog = await import(pathToFileURL(path.join(tempDir, "catalog.mjs")).href);
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const gear = await import(pathToFileURL(path.join(tempDir, "gear.mjs")).href);
  const paths = catalog.CANONICAL_GLOBAL_PATHS;
  const capabilities = catalog.PRODUCT_CAPABILITIES;

  assert.equal(paths.length, 10, "canonical Global roster must contain exactly ten paths");
  assert.equal(Object.keys(catalog.PATH_CAPABILITY_REGISTRY).length, 10, "capability registry must contain exactly ten paths");
  assert.deepEqual(Object.keys(catalog.PATH_CAPABILITY_REGISTRY).sort(), paths.map((item) => item.id).sort(), "every canonical path must have exactly one capability record");
  assert.ok(!Object.hasOwn(catalog.PATH_CAPABILITY_REGISTRY, "stonesplit-awe"), "obsolete aliases cannot enter the capability registry");

  for (const [pathKey, [maturity, matrix]] of Object.entries(expected)) {
    assert.equal(catalog.getPathMaturity(pathKey), maturity, `${pathKey}: maturity`);
    assert.deepEqual(capabilities.map((capability, index) => catalog.getCapabilityState(pathKey, capability)), matrix.split(" ").map((state) => states[state]), `${pathKey}: exact capability matrix`);
  }
  assert.equal(catalog.getPathMaturity("not-a-path"), "UNKNOWN", "unknown paths must report UNKNOWN maturity");
  assert.ok(capabilities.every((capability) => catalog.getCapabilityState("not-a-path", capability) === "DISABLED"), "unknown paths must fail closed");
  for (const pathKey of paths.map((item) => item.id)) assert.equal(catalog.isProductCapabilityEnabled(pathKey, "gearPathFit"), false, `${pathKey}: gear path fit must be disabled`);
  assert.deepEqual(paths.filter((item) => catalog.isProductCapabilityEnabled(item.id, "statPriority")).map((item) => item.id), ["silkbind-jade"], "only Jade retains stat priority");
  assert.deepEqual(paths.filter((item) => catalog.isProductCapabilityEnabled(item.id, "gearCompare")).map((item) => item.id), ["bellstrike-splendor", "bellstrike-umbra", "silkbind-jade"], "Dust gear comparison must be unavailable");
  assert.deepEqual(paths.filter((item) => catalog.isProductCapabilityEnabled(item.id, "bestBuild")).map((item) => item.id), ["silkbind-jade"], "only Jade retains Best Build");
  assert.ok(paths.every((item) => !catalog.isProductCapabilityEnabled(item.id, "simulation")), "simulation must be disabled for every current path");
  assert.ok(catalog.isPathModeled("bamboocut-wind"), "Wind latent local data remains available only to internal lookups");
  for (const capability of ["headlineDps", "bestBuild", "simulation"]) assert.equal(catalog.isProductCapabilityEnabled("bamboocut-wind", capability), false, `Wind latent data must not enable ${capability}`);
  for (const pathKey of ["stonesplit-might", "stonesplit-strength", "bamboocut-kite"]) assert.ok(capabilities.every((capability) => !catalog.isProductCapabilityEnabled(pathKey, capability)), `${pathKey}: latent data cannot enable product capability`);
  assert.equal(calc.calcBaseline(calc.TIERS.T96, "bamboocut-wind"), null, "Wind headline baseline must fail closed");
  assert.equal(gear.scoreGlobalT96Gear([{ type: "Max Phys ATK", val: "100" }], "bamboocut-dust", 7, "Helmet").overall, null, "disabled gear path fit cannot produce an overall recommendation");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-dust", "bamboocut-dust"), false, "persisted Dust Best Build results cannot render after authorization is removed");
  assert.equal(catalog.canRenderBestBuildResult("bamboocut-dust", "silkbind-jade"), false, "late Jade Best Build results cannot republish after switching to Dust");
  assert.ok(catalog.isReferenceCapabilityAvailable("bamboocut-wind", "referenceGuides"), "reference guides remain available for Wind");
  for (const path of ["Bamboocut-Dust", "Bamboocut-Wind", "Bellstrike-Splendor", "Bellstrike-Umbra", "Stonesplit-Might", "Silkbind-Jade"]) {
    assert.equal(compareArenaBuilds({ path }, { path: "Bamboocut-Dust" }).verdict, "INSUFFICIENT EVIDENCE", `${path}: Arena comparison must not claim a numerical winner`);
    assert.equal(rankArenaCandidates([{ path }])[0].arenaObjectiveScore, null, `${path}: Arena ranking must fail closed`);
  }
  for (const sourcePath of ["src/App.tsx", "src/product/ProductShell.tsx", "src/utils/globalT96Gear.ts"]) {
    const source = await readFile(sourcePath, "utf8");
    assert.match(source, /isProductCapabilityEnabled/, `${sourcePath}: product gates must use the named capability API`);
    assert.doesNotMatch(source, /isPathModeled|isBestBuildEligible|canRenderBestBuildResult|getNumericalPathAvailability/, `${sourcePath}: legacy broad authorization cannot gate product behavior`);
  }
  console.log("[v13-capability-matrix] PASS — exact ten-path maturity/capability contract and fail-closed guards verified.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
