import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

const base = "4debf129fe9353c058020129dae0712b6befe29e";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wwm-upstream-"));
const source = ["calc", "rotationTimeline", "scenarioEvaluation", "timelineEngine", "damageSimulation", "orderedRotation", "rotationPresets"].map(name => `export * from './src/utils/${name}.ts';`).join("\n");
const bundle = async (name, contents, plugins = []) => {
  const outfile = path.join(dir, `${name}.mjs`);
  await build({ stdin: { contents, resolveDir: process.cwd() }, outfile, bundle: true, platform: "node", format: "esm", plugins });
  return import(pathToFileURL(outfile).href);
};
const original = await bundle("original", "export * from './src/utils/calc.ts'; export * from './src/utils/rotationTimeline.ts';", [{ name: "immutable-baseline", setup(build) {
  build.onLoad({ filter: /(?:calc|rotationTimeline)\.ts$/ }, ({ path: file }) => {
    const relative = path.relative(process.cwd(), file).replaceAll("\\", "/");
    return { contents: execFileSync("git", ["show", `${base}:${relative}`], { encoding: "utf8", maxBuffer: 5e6 }), loader: "ts" };
  });
} }]);
const current = await bundle("current", source);
const { calcSkill, TIERS, getRotationForBuild, simulateTimeline, evaluateScenario, simulateDamage, simulateOrdered, normalizePreset, normalizeReference, duplicatePreset } = current;
const tier = TIERS["405|0.65b"];
const panel = { minOuter: 1614, maxOuter: 2777, minPz: 327, maxPz: 835, outerPen: 43.5, pzPen: 18, crit: 132.5, prec: 122.1, aff: 17.8, critDmg: 54, affDmg: 35, dcrit: 4.6, daff: 0, set: "none" };
const opts = { set: "none", datang: false, yishui: false, buildKey: "bamboocut-dust" };
const rotation = getRotationForBuild(opts.buildKey);
const before = original.simulateTimeline(rotation, panel, [], tier, opts, 60);
const after = simulateTimeline(rotation, panel, [], tier, opts, 60);
assert.equal(after.total, before.total, "valid accepted frequency model changes");
for (const row of rotation) for (const change of [{}, { crit: 0, aff: 0, prec: 65 }, { crit: 300, aff: 100, dcrit: 10 }, { minOuter: 3000, maxOuter: 2000 }]) {
  assert.deepEqual(calcSkill(row, { ...panel, ...change }, tier, opts), original.calcSkill(row, { ...panel, ...change }, tier, opts), "valid formula input differs from immutable baseline");
}
const oldExtreme = original.calcSkill(rotation[0], { ...panel, daff: 200 }, tier, opts).sim;
assert.ok(oldExtreme.pAff > 1, "defect not reproduced in immutable baseline");
for (const change of [{ daff: 200, dcrit: 200 }, { crit: -50, aff: -50, daff: -50, dcrit: -50 }, { prec: 200, aff: 400, dcrit: 500 }]) {
  const s = calcSkill(rotation[0], { ...panel, ...change }, tier, opts).sim;
  for (const key of ["pCrit", "pAff", "pWhite", "pGraze"]) assert.ok(s[key] >= 0 && s[key] <= 1);
  assert.ok(Math.abs(s.pCrit + s.pAff + s.pWhite + s.pGraze - 1) < 1e-12);
}
const input = { rotation, duration: 60, tier, opts, buffs: [], timingOverrides: {}, skillOverrides: {} };
assert.equal(evaluateScenario(panel, input).total, after.total);
const overrides = { [rotation[0].name]: { outerRatio: 0, fixed: 0, eleRatio: 0 } };
const changed = evaluateScenario(panel, { ...input, skillOverrides: overrides });
assert.ok(changed.total < after.total);
assert.equal(original.simulateTimeline(rotation, panel, [], tier, opts, 60, {}, overrides).total, before.total, "ignored override not reproduced");
assert.equal(changed.total, simulateTimeline(rotation, panel, [], tier, opts, 60, {}, overrides).total);
const pathOnlyRow = rotation.find(row => current.getSkillDefinition(row.name, "bamboocut-dust") && !current.getSkillDefinition(row.name, "bellstrike-umbra"));
assert.ok(pathOnlyRow, "cross-Path test must exercise a Path-only definition");
assert.ok(original.calcSkill(pathOnlyRow, panel, tier, { ...opts, buildKey: "bellstrike-umbra" }).total > 0, "old singleton did not reproduce Path-cache contamination");
assert.equal(calcSkill(pathOnlyRow, panel, tier, { ...opts, buildKey: "bellstrike-umbra" }).total, 0, "another Path's dynamically resolved skill leaked");
for (const name of ["constructor", "__proto__", "toString"]) {
  assert.equal(current.getSkillDefinition(name, opts.buildKey), undefined, "prototype key accepted as a skill ID");
  assert.equal(calcSkill({ ...rotation[0], name, count: 1 }, panel, tier, opts).total, 0);
  assert.ok(!Number.isFinite(original.calcSkill({ ...rotation[0], name, count: 1 }, panel, tier, opts).total), "baseline prototype lookup defect not reproduced");
}
const expectedSamples = after.samples.reduce((sum, s) => sum + s.casts * (s.pCrit * s.critHit + s.pAff * s.affHit + s.pWhite * s.normHit + s.pGraze * s.grazeHit), 0);
assert.ok(Math.abs(expectedSamples - after.total) < 1e-8, "MC priced expectation differs from evaluator");
const job = { generation: 1, fingerprint: "actual-t96", seed: 17, runs: 2000, duration: 60, expected: after.total, samples: after.samples };
const started = performance.now();
const result = simulateDamage(job);
const elapsedMs = performance.now() - started;
assert.deepEqual(result, simulateDamage(job), "seed repeatability");
assert.notEqual(result.avgDps, simulateDamage({ ...job, seed: 18 }).avgDps);
assert.equal(result.analyticDps, after.total / 60, "analytic expectation uses the same priced outcomes");
assert.ok(Math.abs(result.avgDps - result.expectedDps) < 6 * result.meanStdErrorDps, "seeded convergence within six standard errors");
assert.throws(() => simulateDamage({ ...job, expected: job.expected * 1.08 }), /expectation/);
assert.throws(() => simulateDamage({ ...job, samples: [{ ...after.samples[0], pAff: 2 }] }), /sample/);
const references = JSON.parse(fs.readFileSync("src/data/umbraReferences.json", "utf8"));
assert.equal(references.length, 5);
for (const reference of references) {
  assert.ok(normalizeReference(reference));
  const preset = normalizePreset({ id: reference.id, name: reference.name, buildKey: reference.buildKey, rotation: [], reference });
  assert.deepEqual(normalizePreset(JSON.parse(JSON.stringify(preset))), preset, "source/window/Qi loss on roundtrip");
}
assert.equal(normalizePreset({ name: "invalid", rotation: [{ name: rotation[0].name, count: 1e9 }] }), null);
assert.equal(normalizePreset({ name: "invalid", rotation: [{ name: rotation[0].name, count: "4" }] }), null);
assert.equal(normalizeReference({ ...references[0], qiBreak: { startSec: Infinity } }), null);
assert.equal(normalizeReference({ ...references[0], buildKey: "__proto__" }), null);
assert.equal(normalizePreset({ name: "invalid key", buildKey: "constructor", rotation: [] }), null);
const legacy = normalizePreset({ id: "old", name: "legacy", rotation: [{ name: rotation[0].name, count: 4 }] });
assert.equal(legacy.schemaVersion, 2);
assert.equal(legacy.rotation[0].count, 4);
const sourcePreset = normalizePreset({ id: "source", name: "Reference", buildKey: references[0].buildKey, rotation: [], reference: references[0] });
const copiedPreset = duplicatePreset(sourcePreset, "Reference copy");
assert.notEqual(copiedPreset.id, sourcePreset.id);
assert.deepEqual(copiedPreset.reference, sourcePreset.reference);
assert.equal(copiedPreset.buildKey, sourcePreset.buildKey);
assert.equal(copiedPreset.schemaVersion, sourcePreset.schemaVersion);
copiedPreset.reference.steps[0].skillId = "changed-in-copy";
assert.notEqual(copiedPreset.reference.steps[0].skillId, sourcePreset.reference.steps[0].skillId);

const action = (at, rest = {}) => ({ skillId: "verified-test-hit", at, castTime: 1, hitOffsets: [0], ...rest });
const encounter = { schemaVersion: 1, mode: "ordered", buildKey: "test-only", fixedWindowSec: 30, openingResources: { energy: 0 }, qiWindows: [{ startSec: 5, durationSec: 2, lowQiLeadSec: 1 }, { startSec: 20, durationSec: 3, lowQiLeadSec: 2 }], actions: [
  action(-1, { prePull: true, grants: [{ id: "opening", stacks: 2, maxStacks: 3, duration: 3 }], resourceDelta: { energy: 2 } }),
  action(0), action(2), action(5), action(19), action(21),
  action(28, { hitOffsets: [0, .8], cancelAt: .4, dot: { applyOffset: 0, firstOffset: 1, interval: .5, ticks: 8 } }),
  action(30),
] };
const supported = new Set(["verified-test-hit"]);
const ordered = simulateOrdered(encounter, supported, (e, state) => 10 + (state.buffs.opening ?? 0) + state.resources.energy + (state.qiPhase === "broken" ? 100 : state.qiPhase === "low" ? 50 : 0));
assert.deepEqual(ordered.events.map(e => e.at), [0, 2, 5, 19, 21, 28, 29, 29.5]);
assert.equal(ordered.events[0].damage, 14);
assert.equal(ordered.events[1].damage, 12, "buff expiry at exact boundary");
assert.equal(ordered.events[2].state.qiPhase, "broken");
assert.equal(ordered.events[3].state.qiPhase, "low");
assert.equal(ordered.events[4].state.qiPhase, "broken");
assert.equal(ordered.total, 348);
assert.equal(ordered.dps, ordered.total / 30);
const sixty = simulateOrdered({ ...encounter, fixedWindowSec: 60 }, supported, () => 1);
assert.equal(sixty.events.filter(e => e.kind === "dot").length, 8, "tail ticks lost after last action");
assert.throws(() => simulateOrdered(encounter, new Set(), () => 1), /Unsupported skill IDs/);
assert.throws(() => simulateOrdered({ ...encounter, actions: [action(0, { dot: { applyOffset: 0, firstOffset: 0, interval: 0, ticks: 10 } })] }, supported, () => 1), /cadence/);

const report = { base, beforeTotal: before.total, afterTotal: after.total, oldInvalidAffinity: oldExtreme.pAff, correctedAffinity: calcSkill(rotation[0], { ...panel, daff: 200 }, tier, opts).sim.pAff, overriddenTotal: changed.total, actualSamples: after.samples.length, duration: 60, monteCarlo: { ...result, elapsedMs }, ordered: { total: ordered.total, events: ordered.events.length }, references: references.map(r => ({ id: r.id, steps: r.steps.length, fixedWindowSec: r.fixedWindowSec })) };
fs.mkdirSync(".local-evidence/upstream-20261001", { recursive: true });
fs.writeFileSync(".local-evidence/upstream-20261001/kernel-contract-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log("PASS actual kernel, immutable baseline, ordered windows, reference migration, seeded outcomes");
