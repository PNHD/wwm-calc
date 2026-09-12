import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-static-contract-"));
const failures = [];
const check = async (name, fn) => {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
};
const item = (name, count = 1) => ({ name, count, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 });

try {
  await build({ entryPoints: { catalog: "src/data/pathCatalog.ts", timing: "src/data/skillTiming.ts", calc: "src/utils/calc.ts", rotation: "src/utils/timelineEngine.ts", timeline: "src/utils/rotationTimeline.ts", jade: "src/pathModels/silkbindJade.mjs" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" }, logLevel: "silent" });
  const load = (name) => import(pathToFileURL(path.join(tempDir, `${name}.mjs`)).href);
  const catalog = await load("catalog");
  const timing = await load("timing");
  const calc = await load("calc");
  const rotation = await load("rotation");
  const timeline = await load("timeline");
  const jade = await load("jade");
  const tier = calc.TIERS["405|0.65b"];
  const opts = { set: "", datang: false, yishui: false, buildKey: "bamboocut-dust" };
  const owned = calc.getRotationForBuild("bamboocut-dust").find((row) => calc.getSkillForBuild("bamboocut-dust", row.name));

  await check("inherited registry ids fail closed", () => {
    for (const pathKey of ["UNKNOWN", "retired-path", "constructor", "__proto__", "toString", "hasOwnProperty"]) {
      assert.equal(catalog.getPathMaturity(pathKey), "UNKNOWN", pathKey);
      assert.ok(catalog.PRODUCT_CAPABILITIES.every((capability) => catalog.getCapabilityState(pathKey, capability) === "DISABLED"), pathKey);
      assert.ok(catalog.PRODUCT_CAPABILITIES.every((capability) => !catalog.isProductCapabilityEnabled(pathKey, capability)), pathKey);
      assert.equal(catalog.isReferenceCapabilityAvailable(pathKey, "referenceGuides"), false, pathKey);
      assert.equal(calc.getSkillForBuild("bamboocut-dust", pathKey), null, `skill ${pathKey}`);
    }
  });

  await check("numerical timing rejects fuzzy and inherited names", () => {
    for (const name of ["Totally unknown charged ability", "Unknown Perfect Ability", "Flute of the Tides", "constructor", "toString", "an unmatched unknown name"]) assert.equal(timing.lookupKnownTiming(name), undefined, name);
    assert.equal(timing.lookupKnownTiming("UmbQ")?.castTime, 0.55);
    assert.equal(timing.lookupKnownTiming("UmbDrone")?.castTime, 0, "canonical internal zero-lock remains explicit");
  });

  await check("timing override domain", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 0]) {
      for (const result of [rotation.simulateRotation([owned], {}, tier, opts, 60, { [owned.name]: { castTime: value } }), timeline.simulateTimeline([owned], {}, [], tier, opts, 60, { [owned.name]: { castTime: value } })]) {
        assert.equal(result.available, false, String(value));
        assert.equal(result.reason, "INVALID_TIMING_OVERRIDE", String(value));
      }
    }
    assert.equal(rotation.simulateRotation([owned], {}, tier, opts, 60, { [owned.name]: { castTime: 0.8 } }).available, true);
    assert.equal(timeline.simulateTimeline([owned], {}, [], tier, opts, 60, { [owned.name]: { castTime: 0.8 } }).available, true);
  });

  await check("missing coefficient remains unavailable", () => {
    const result = calc.calcSkill(item("UmbQ"), {}, tier, opts);
    assert.equal(result.available, false);
    assert.equal(result.reason, "MISSING_PATH_SKILL_MODEL");
    const aggregate = rotation.simulateRotation([owned, item("UmbQ")], {}, tier, opts, 60);
    assert.equal(aggregate.available, false);
    assert.equal(aggregate.reason, "MISSING_PATH_SKILL_MODEL");
    const priced = jade.evaluateSilkbindJade({ minOuter: 100, maxOuter: 100 }, {}, jade.JADE_OBJECTIVES.EXPECTED_DPS, () => result);
    assert.equal(priced.available, false);
    assert.equal(priced.reason, "MISSING_PATH_SKILL_MODEL");
    assert.equal(priced.totalDamage, null);
    const unavailableCandidate = { total: 0, unavailable: result };
    assert.equal(calc.getNumericalUnavailable(unavailableCandidate), result, "Best Build/Gear Compare must see unavailable instead of ranking zero");
  });

  await check("missing timing remains unavailable", () => {
    const missingTimingOwned = calc.getRotationForBuild("bamboocut-dust").find((row) => row.count > 0 && calc.getSkillForBuild("bamboocut-dust", row.name) && !timing.lookupKnownTiming(row.name));
    assert.ok(missingTimingOwned);
    assert.equal(rotation.simulateRotation([missingTimingOwned], {}, tier, opts, 60).reason, "MISSING_LOAD_BEARING_TIMING");
  });

  await check("valid zero differs from unavailable", () => {
    const zero = rotation.simulateRotation([item(owned.name, 0)], {}, tier, opts, 60);
    assert.equal(zero.available, true);
    assert.equal(zero.totalDmg, 0);
    assert.equal(calc.calcSkill(item("UmbQ"), {}, tier, opts).available, false);
  });

  await check("Best Build identity covers same-path changes and late completion", () => {
    assert.equal(typeof calc.createBestBuildCalculationIdentity, "function");
    assert.equal(typeof calc.isBestBuildRequestCurrent, "function");
    const base = { pathKey: "silkbind-jade", scenario: { duration: 60 }, objective: "expected-dps", tier: { name: "T96" }, panel: { crit: 90 }, baseOverride: null, food: true, bow: "crit", innerWays: ["a"], innerWayTiers: { a: 6 }, starweaveDistanceBonusPct: 0, gear: [{ id: "g1", slot: "Head", subs: [] }] };
    const identity = calc.createBestBuildCalculationIdentity(base);
    for (const changed of [
      { ...base, scenario: { duration: 49.5 } },
      { ...base, objective: "speedrun-ceiling" },
      { ...base, panel: { crit: 91 } },
      { ...base, gear: [{ id: "g2", slot: "Head", subs: [] }] },
      { ...base, pathKey: "bamboocut-dust" },
    ]) assert.notEqual(calc.createBestBuildCalculationIdentity(changed), identity);
    assert.equal(calc.isBestBuildRequestCurrent(identity, identity, 7, 7), true);
    assert.equal(calc.isBestBuildRequestCurrent(calc.createBestBuildCalculationIdentity({ ...base, scenario: { duration: 49.5 } }), identity, 7, 7), false, "completed scenario A cannot render under B");
    assert.equal(calc.isBestBuildRequestCurrent(identity, identity, 8, 7), false, "late request cannot publish");
  });

  await check("App binds Best Build result and render to calculation identity", async () => {
    const app = await readFile("src/App.tsx", "utf8");
    assert.ok(app.includes("calculationIdentity"), "Best Build result lacks calculation identity");
    assert.ok(app.includes("isBestBuildRequestCurrent"), "Best Build publish/render lacks current-request guard");
    assert.ok(app.includes("getNumericalUnavailable(current, candidate)"), "Best Build does not reject unavailable candidates");
    assert.ok(app.includes("getNumericalUnavailable(currentCompareCombat, candidateCombat)"), "Gear Compare does not reject unavailable candidates");
    assert.ok(app.includes('getCanonicalGlobalPath(stored)?.id ?? "UNKNOWN"'), "persisted malformed Path identity is not normalized to fail-closed UNKNOWN");
  });
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n[v13-static-contract-closure] FAIL ${failures.length} checks`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else console.log("[v13-static-contract-closure] PASS — registry, timing, availability, and Best Build identity fail closed.");
