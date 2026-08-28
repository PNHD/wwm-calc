import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildSync } = require("esbuild");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "wwm-global-v2-outcome-"));
const bundle = path.join(scratch, "calc.cjs");
const rotationItem = (name) => ({ name, count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 });
const panel = { crit: 0, aff: 0, prec: 65, dcrit: 0, daff: 0, critDmg: 0, affDmg: 0 };
const opts = { set: "", datang: false, yishui: false, buildKey: "bamboocut-dust" };

try {
  buildSync({
    entryPoints: [path.resolve("src/utils/calc.ts")],
    bundle: true,
    format: "cjs",
    outfile: bundle,
    platform: "node",
    target: "node22",
    logLevel: "silent",
  });
  const { calcSkill, TIERS } = require(bundle);
  const tier = TIERS["405|0.65b"];
  const guaranteed = calcSkill(rotationItem("Burn and Bury"), panel, tier, opts).sim;
  const ordinary = calcSkill(rotationItem("Piercing Dart"), panel, tier, opts).sim;

  assert.equal(guaranteed.pCrit, 1, "evidence-backed Burn and Bury must force Crit");
  assert.equal(guaranteed.pAff, 0, "forced Crit must not also resolve as Affinity");
  assert.equal(ordinary.pCrit, 0, "an unrelated skill without a rule retains normal outcome behavior");
  assert.equal(ordinary.pWhite > 0, true, "an unrelated skill retains a non-forced outcome distribution");
  console.log("[global-v2-outcome-routing] PASS — guaranteed-critical evidence is consumed by calcSkill without changing ordinary skill outcomes.");
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
