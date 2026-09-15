import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-assumptions-"));

try {
  await build({
    entryPoints: { calc: "src/utils/calc.ts", catalog: "src/data/pathCatalog.ts", gear: "src/utils/globalT96Gear.ts", timing: "src/data/skillTiming.ts", timeline: "src/utils/rotationTimeline.ts", rotation: "src/utils/timelineEngine.ts" },
    bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" },
  });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const catalog = await import(pathToFileURL(path.join(tempDir, "catalog.mjs")).href);
  const gear = await import(pathToFileURL(path.join(tempDir, "gear.mjs")).href);
  const timing = await import(pathToFileURL(path.join(tempDir, "timing.mjs")).href);
  const timeline = await import(pathToFileURL(path.join(tempDir, "timeline.mjs")).href);
  const rotation = await import(pathToFileURL(path.join(tempDir, "rotation.mjs")).href);
  const unknown = { name: "Unmapped custom skill", count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 };
  const opts = { set: "", datang: false, yishui: false, buildKey: "bamboocut-dust" };
  const t96 = calc.TIERS["405|0.65b"];
  const ownedMissingTiming = calc.getRotationForBuild("bamboocut-dust").find((item) => item.count > 0 && calc.getSkillForBuild("bamboocut-dust", item.name) && !timing.lookupKnownTiming(item.name));
  assert.ok(ownedMissingTiming, "fixture requires one owned skill without authorized timing");

  assert.equal(timing.lookupKnownTiming(unknown.name), undefined, "unmatched timing cannot silently become a numerical default");
  assert.equal(timing.lookupTiming(unknown.name).castTime, 0.6, "the editor placeholder remains display-only");
  const missing = timeline.simulateTimeline([unknown], {}, [], t96, opts, 60);
  assert.equal(missing.available, false, "missing load-bearing timing must return an unavailable result");
  assert.deepEqual(missing.missingTiming, [unknown.name]);
  const overridden = timeline.simulateTimeline([ownedMissingTiming], {}, [], t96, opts, 60, { [ownedMissingTiming.name]: { castTime: 0.8 } });
  assert.equal(overridden.available, true, "an explicit user timing override may execute an owned skill");
  assert.equal(timeline.simulateTimeline([unknown], {}, [], t96, opts, 60, { [unknown.name]: { castTime: 0.8 } }).reason, "MISSING_PATH_SKILL_MODEL", "override cannot invent a coefficient model");
  const customRotation = rotation.simulateRotation([unknown], {}, t96, opts, 60);
  assert.equal(customRotation.available, false, "custom rotation cannot bypass the timing gate");

  assert.equal(catalog.isProductCapabilityEnabled("bamboocut-dust", "gearPathFit"), false, "capability remains independent of weight-table presence");
  assert.equal(gear.scoreGlobalT96Gear([{ type: "Max Phys ATK", val: "100" }], "bamboocut-dust", 7).overall, null, "DEFAULT_WEIGHTS cannot produce a selected-path recommendation");
  assert.ok(Object.values(gear.BUILD_WEIGHT_CLASSIFICATION).every((state) => state === "PROVISIONAL_ASSUMPTION"), "every extant BUILD_WEIGHTS row remains provisional");

  assert.equal(calc.CURRENT_VALIDATED_BASELINE, null, "no current Global validated baseline may be fabricated");
  const legacy = calc.getLegacyReferenceBaseline(t96, "bamboocut-dust");
  assert.equal(legacy?.assumptions[0]?.id, "legacy-t91-graduation-baseline", "legacy baseline is separately classified reference input");
  const app = await readFile("src/App.tsx", "utf8");
  const bestBuildObjective = app.slice(app.indexOf("const gradRateForGearCombo"), app.indexOf("const RING_OPTS"));
  assert.match(bestBuildObjective, /return totalDmg;/, "Best Build ranks direct modeled damage");
  assert.doesNotMatch(bestBuildObjective, /baselineScore/, "legacy baseline cannot determine Best Build ranking");
  const dustSkill = calc.getRotationForBuild("bamboocut-dust")[0];
  const panel = { minOuter: 1600, maxOuter: 2700, minPz: 300, maxPz: 700, crit: 100, aff: 20, prec: 110, critDmg: 50, affDmg: 35 };
  const normal = calc.calcSkill(dustSkill, panel, t96, { ...opts, armorSet: "" });
  const hawkwing = calc.calcSkill(dustSkill, panel, t96, { ...opts, set: "hawkwing", armorSet: "" });
  assert.equal(hawkwing.total, normal.total, "Hawkwing linearization cannot alter provisional recommendation math");
  assert.ok(hawkwing.assumptions.some((item) => item.id === "hawkwing-affinity-linearization" && item.classification === "UNSAFE_FOR_RECOMMENDATION"), "excluded Hawkwing assumption remains machine-readable");
  assert.ok(normal.assumptions.some((item) => item.id === "fixed-damage-22.5-percent"), "shared load-bearing assumptions remain machine-readable");

  console.log("[v13-unsafe-assumptions] PASS — generic timing/weights and legacy or heuristic numerical assumptions fail closed or remain explicit.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
