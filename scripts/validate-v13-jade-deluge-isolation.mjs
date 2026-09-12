import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-jade-deluge-"));
const panel = { minOuter: 1800, maxOuter: 2600, minPz: 300, maxPz: 700, crit: 90, aff: 20, prec: 100, critDmg: 50, affDmg: 35 };
const item = { name: "太白醉月1-4", count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 };

try {
  await build({ entryPoints: { calc: "src/utils/calc.ts", reference: "src/data/referenceData.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const reference = await import(pathToFileURL(path.join(tempDir, "reference.mjs")).href);
  const options = (buildKey) => ({ set: "", datang: false, yishui: false, buildKey });
  const calculate = (buildKey) => calc.calcSkill(item, panel, calc.TIERS["405|0.65b"], options(buildKey)).total;
  const jadeDefinition = calc.getSkillForBuild("silkbind-jade", item.name);
  const delugeDefinition = calc.getSkillForBuild("silkbind-deluge", item.name);
  assert.ok(jadeDefinition && delugeDefinition, "Jade and Deluge must resolve their own skill rows");
  assert.notDeepEqual(jadeDefinition, delugeDefinition, "the shared name must retain distinct path-owned coefficients");

  const jadeFirst = [calculate("silkbind-jade"), calculate("silkbind-deluge")];
  const delugeFirst = [calculate("silkbind-deluge"), calculate("silkbind-jade")];
  assert.equal(jadeFirst[0], delugeFirst[1], "Jade result must not depend on evaluation order");
  assert.equal(jadeFirst[1], delugeFirst[0], "Deluge result must not depend on evaluation order");

  const owners = new Map();
  for (const [buildKey, classKey] of Object.entries(calc.BUILD_MAP_TO_CHINESE)) {
    if (!calc.getRotationForBuild(buildKey)) continue;
    for (const skillName of Object.keys(reference.ClassConfig.ROTATIONS[classKey]?.skillDatabase ?? {})) {
      const rows = owners.get(skillName) ?? [];
      rows.push(buildKey);
      owners.set(skillName, rows);
    }
  }
  const collisions = [...owners.entries()].filter(([, paths]) => paths.length > 1);
  assert.ok(collisions.some(([name, paths]) => name === item.name && paths.includes("silkbind-jade") && paths.includes("silkbind-deluge")), "Jade/Deluge collision must remain detectable, not silently merged");
  for (const [skillName, paths] of collisions) {
    for (const buildKey of paths) assert.ok(calc.getSkillForBuild(buildKey, skillName), `${skillName} must resolve in its own ${buildKey} scope`);
  }

  console.log(JSON.stringify({ suite: "v13-jade-deluge-isolation", collisions: collisions.map(([skillName, paths]) => ({ skillName, paths })) }));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
