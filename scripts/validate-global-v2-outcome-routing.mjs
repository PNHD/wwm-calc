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
  const { calcSkill, getRotationForBuild, getSkillForBuild, TIERS } = require(bundle);
  const tier = TIERS["405|0.65b"];
  const dustSkill = getRotationForBuild("bamboocut-dust")?.[0];
  assert.ok(dustSkill, "Dust must retain an explicitly owned modeled rotation skill");
  const wrongPath = calcSkill(rotationItem("Burn and Bury"), panel, tier, opts).sim;
  const wrongPathResult = calcSkill(rotationItem("Burn and Bury"), panel, tier, opts);
  const samePath = calcSkill(dustSkill, panel, tier, opts).sim;

  // The old forced-Critical assertion priced the official display label through
  // a generic skill table. That label is not an owned Dust calculator key, so the
  // valid regression is explicit unavailability plus a positive owned-skill check.
  assert.equal(getSkillForBuild("bamboocut-dust", "Burn and Bury"), null, "a raw evidence name must not bypass path-owned calculator aliases");
  assert.equal(wrongPathResult.available, false, "unowned outcome evidence cannot become a numerical result");
  assert.equal(wrongPathResult.reason, "MISSING_PATH_SKILL_MODEL");
  assert.equal(wrongPath.pCrit, 0, "a wrong-path skill must fail closed instead of borrowing a generic rule");
  assert.equal(wrongPath.casts, 0, "a wrong-path skill must not simulate a cast");
  assert.ok(getSkillForBuild("bamboocut-dust", dustSkill.name), "a Dust-owned rotation skill must resolve in Dust");
  assert.equal(calcSkill(dustSkill, panel, tier, opts).available, true, "owned Dust pricing remains available");
  assert.ok(samePath.casts > 0, "a Dust-owned rotation skill must simulate its own casts");
  assert.ok(samePath.pCrit + samePath.pAff + samePath.pWhite + samePath.pGraze > 0, "a Dust-owned skill must retain an outcome distribution");
  assert.equal(getSkillForBuild("silkbind-jade", dustSkill.name), null, "Jade must not inherit Dust-owned skills");
  assert.equal(getSkillForBuild("silkbind-deluge", dustSkill.name), null, "Deluge must not inherit Dust-owned skills");
  console.log("[global-v2-outcome-routing] PASS — path-scoped outcome routing fails closed and preserves Dust, Jade, and Deluge isolation.");
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
