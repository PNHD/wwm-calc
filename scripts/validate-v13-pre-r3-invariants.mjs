import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const preview = readFileSync(new URL("../src/utils/skillPreview.ts", import.meta.url), "utf8");

assert.match(preview, /name: skillName, count: 1/, "Skill preview must calculate the selected path-owned skill identity");
assert.match(preview, /return calcSkill\(rot, panel, tier, \{ \.\.\.opts, skillOverride \}\)/, "Skill preview must pass its selected identity to calcSkill");
assert.match(preview, /skillOverride/, "Skill preview must pass the edited coefficients as a calcSkill override");
assert.doesNotMatch(preview, /SKILL_DB|__skill_preview__/, "Skill preview must not mutate the global skill registry");
assert.match(app, /getSkillForBuild\(selectedBuild, editorSkillName\)/, "Skill Editor must resolve its original definition from the selected path");
assert.match(app, /canApplySkillRotationOverride/, "Skill Editor Apply must be split from preview capability");
assert.match(app, /disabled=\{!canApplySkillRotationOverride \|\| !editorSkillName \|\| !editorOverrides\}/, "Jade must not apply an edited preview to rotation DPS");
assert.match(app, /const gearCompareEnabled = isProductCapabilityEnabled\(selectedBuild, "gearCompare"\);/, "Inventory must have one canonical compare-capability gate");
assert.match(app, /if \(!gearCompareEnabled\) return a\.name\.localeCompare\(b\.name\);/, "Disabled Compare inventory must use a non-modeled sort");
assert.match(app, /const selectedBuildLegacyClass = Object\.entries\(CLASS_DISPLAY_NAME\)\.find/, "Legacy targets must be explicitly mapped to the selected path");
assert.doesNotMatch(app, /Bamboocut Dust damage scales heavily|Everspring Umbrella execution chain jumps exponentially/, "Jade Stat Priority must not publish Dust-specific advice");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-pre-r3-invariants-"));
try {
  await build({ entryPoints: { calc: "src/utils/calc.ts", preview: "src/utils/skillPreview.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" }, logLevel: "silent" });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const previewModule = await import(pathToFileURL(path.join(tempDir, "preview.mjs")).href);
  const panel = { minOuter: 1800, maxOuter: 2600, minPz: 300, maxPz: 700, crit: 90, aff: 20, prec: 100, critDmg: 50, affDmg: 35 };
  const opts = { set: "", datang: false, yishui: false, buildKey: "bamboocut-dust" };
  const dustSkill = calc.getRotationForBuild("bamboocut-dust").find((row) => calc.getSkillForBuild("bamboocut-dust", row.name));
  assert.ok(dustSkill, "fixture requires a real modeled Dust skill");
  const base = previewModule.previewSkill(dustSkill.name, panel, calc.TIERS["405|0.65b"], opts);
  const edited = previewModule.previewSkill(dustSkill.name, panel, calc.TIERS["405|0.65b"], opts, { fixed: (calc.getSkillForBuild("bamboocut-dust", dustSkill.name).fixed || 0) + 1 });
  assert.equal(base.available, true, "real modeled preview must be available");
  assert.equal(edited.available, true, "edited modeled preview must be available");
  assert.notEqual(base.sim.normHit, edited.sim.normHit, "coefficient override must change preview");
  const missing = previewModule.previewSkill("missing-path-owned-skill", panel, calc.TIERS["405|0.65b"], opts);
  assert.equal(missing.available, false, "missing preview must not become a zero result");
  assert.equal(missing.reason, "MISSING_PATH_SKILL_MODEL");
  const jadeSkill = calc.getRotationForBuild("silkbind-jade").find((row) => calc.getSkillForBuild("silkbind-jade", row.name));
  assert.ok(jadeSkill, "fixture requires a real modeled Jade skill");
  assert.equal(previewModule.previewSkill(jadeSkill.name, panel, calc.TIERS["405|0.65b"], { ...opts, buildKey: "silkbind-jade" }).available, true, "Jade preview remains available");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

console.log("[v13-pre-r3-invariants] PASS — path ownership and unavailable contracts are closed.");
