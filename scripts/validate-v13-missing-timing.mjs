import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-timing-"));
const unknown = { name: "Unmapped custom skill", count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 };

try {
  await build({ entryPoints: { calc: "src/utils/calc.ts", timing: "src/data/skillTiming.ts", timeline: "src/utils/rotationTimeline.ts", rotation: "src/utils/timelineEngine.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const timing = await import(pathToFileURL(path.join(tempDir, "timing.mjs")).href);
  const timeline = await import(pathToFileURL(path.join(tempDir, "timeline.mjs")).href);
  const rotation = await import(pathToFileURL(path.join(tempDir, "rotation.mjs")).href);
  const t96 = calc.TIERS["405|0.65b"];
  const opts = { set: "", datang: false, yishui: false, buildKey: "bamboocut-dust" };
  const ownedMissingTiming = calc.getRotationForBuild("bamboocut-dust").find((item) => item.count > 0 && calc.getSkillForBuild("bamboocut-dust", item.name) && !timing.lookupKnownTiming(item.name));
  assert.ok(ownedMissingTiming, "fixture requires one owned skill without authorized timing");

  assert.equal(timing.lookupKnownTiming(unknown.name), undefined);
  assert.equal(timing.lookupTiming(unknown.name).castTime, 0.6, "editor placeholder remains non-numerical");
  const missing = timeline.simulateTimeline([ownedMissingTiming], {}, [], t96, opts, 60);
  assert.equal(missing.available, false);
  assert.deepEqual(missing.missingTiming, [ownedMissingTiming.name]);
  assert.equal(rotation.simulateRotation([ownedMissingTiming], {}, t96, opts, 60).available, false, "custom rotation shares the fail-closed gate");
  assert.equal(timeline.simulateTimeline([ownedMissingTiming], {}, [], t96, opts, 60, { [ownedMissingTiming.name]: { castTime: 0.8 } }).available, true, "explicit override permits an owned skill to execute");
  assert.equal(timeline.simulateTimeline([unknown], {}, [], t96, opts, 60, { [unknown.name]: { castTime: 0.8 } }).reason, "MISSING_PATH_SKILL_MODEL", "timing cannot authorize a missing coefficient model");
  console.log("[v13-missing-timing] PASS — unmatched timing is unavailable; explicit override works.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
