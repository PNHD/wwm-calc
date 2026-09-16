import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-formula-parity-"));

try {
  await build({
    entryPoints: { calc: "src/utils/calc.ts", sets: "src/data/setCatalog.ts" },
    bundle: true,
    format: "esm",
    platform: "node",
    outdir: tempDir,
    outExtension: { ".js": ".mjs" },
  });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const sets = await import(pathToFileURL(path.join(tempDir, "sets.mjs")).href);

  const cases = [
    [0.65, 0.4, 0.1],
    [1, 0.8, 0.4],
    [0.9, 1.8, 0.3],
    [0.9, 0.2, 1.2],
    [0.9, 0.2, -0.3],
    [Number.NaN, Number.POSITIVE_INFINITY, -1],
  ];
  for (const values of cases) {
    const outcomes = calc.resolveOutcomeProbabilities(...values);
    const probabilities = Object.values(outcomes);
    assert(probabilities.every((value) => value >= 0 && value <= 1), `outcomes must be bounded for ${values}`);
    assert(Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 1) < 1e-15, `outcome mass must equal one for ${values}`);
  }

  assert.deepEqual(
    calc.resolveOutcomeProbabilities(0.9, 0.2, 1.2),
    { pCrit: 0, pAff: 1, pWhite: 0, pGraze: 0 },
    "over-cap Direct Affinity must not create more than one hit of expected damage",
  );
  assert.deepEqual(
    calc.resolveOutcomeProbabilities(0.9, 0.2, -0.3),
    { pCrit: 0.18000000000000002, pAff: 0, pWhite: 0.72, pGraze: 0.09999999999999998 },
    "negative imported rates must not create negative outcome probability",
  );
  const overCapCrit = calc.resolveOutcomeProbabilities(0.9, 1.8, 0.3);
  assert(Math.abs(overCapCrit.pCrit - 0.63) < 1e-15 && Math.abs(overCapCrit.pGraze - 0.07) < 1e-15 && overCapCrit.pWhite < 1e-15,
    "over-cap Direct Critical must be bounded before Precision gates it");
  assert.deepEqual(
    calc.resolveOutcomeProbabilities(0.8, 0.3, 0.2, true),
    { pCrit: 1, pAff: 0, pWhite: 0, pGraze: 0 },
    "forced critical must consume all probability mass",
  );

  const expectedT96Stats = {
    hawkwing: ["aff", 4.5],
    starweave: ["minOuter", 77.8],
    jadeware: ["maxOuter", 77.8],
    rainwhisper: ["prec", 8],
    cleftpeak: ["minOuter", 77.8],
    mistwillow: ["prec", 8],
    ivorybloom: ["crit", 9],
    swallowcall: ["minOuter", 77.8],
    etherwrath: ["minOuter", 77.8],
    "swift-gale": ["maxOuter", 77.8],
    "swaying-heights": ["minOuter", 77.8],
    tiltrim: ["minOuter", 77.8],
  };
  for (const [id, [stat, expected]] of Object.entries(expectedT96Stats)) {
    assert.equal(sets.getCurrentGlobalSet(id)?.stat2pc?.[stat], expected, `${id} must use its T96 two-piece stat`);
  }
  for (const id of ["hawkwing", "jadeware", "swallowcall", "swaying-heights", "tiltrim"]) {
    assert.equal(sets.setEffectModelUnavailable(id), true, `${id} must not enter a numerical comparison without its missing state/effect evidence`);
  }
  assert.equal(sets.setEffectModelUnavailable("starweave"), false, "the bounded verified Starweave component remains modeled");

  const dustRow = calc.getRotationForBuild("bamboocut-dust")[0];
  const unsafeSetResult = calc.calcSkill(dustRow, {}, calc.TIERS["405|0.65b"], { set: "jadeware", armorSet: "none", datang: false, yishui: false, buildKey: "bamboocut-dust" });
  assert.equal(unsafeSetResult.available, false, "a conditional set without required encounter state must fail at the shared formula boundary");
  assert.equal(unsafeSetResult.reason, "SET_EFFECT_MODEL_UNAVAILABLE");
  const modeledSetResult = calc.calcSkill(dustRow, {}, calc.TIERS["405|0.65b"], { set: "starweave", armorSet: "none", datang: false, yishui: false, buildKey: "bamboocut-dust" });
  assert.equal(modeledSetResult.available, true, "a bounded modeled set must remain calculable");

  console.log("[formula-parity] PASS — bounded outcome mass, forced outcomes, T96 set stats, and conditional-set fail-closed gates verified.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
