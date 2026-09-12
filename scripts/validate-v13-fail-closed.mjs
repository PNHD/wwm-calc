import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { compareArenaBuilds, loadArenaState, rankArenaCandidates } from "../src/arena/arena-core.mjs";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-fail-closed-"));
const fakeStorage = (seed) => ({ getItem: (key) => seed[key] ?? null, setItem: () => {} });
const zeroSkill = (calc, buildKey) => calc.calcSkill({ name: "not-a-real-skill", count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 }, {}, calc.TIERS.T96, { set: "", datang: false, yishui: false, buildKey }).total;

try {
  await build({ entryPoints: { calc: "src/utils/calc.ts", catalog: "src/data/pathCatalog.ts" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const calc = await import(pathToFileURL(path.join(tempDir, "calc.mjs")).href);
  const catalog = await import(pathToFileURL(path.join(tempDir, "catalog.mjs")).href);
  const unavailable = ["not-a-path", "stonesplit-awe", "stonesplit-pure-datang", "stonesplit-might", "stonesplit-strength", "bamboocut-kite", "bamboocut-draught"];

  for (const buildKey of unavailable) {
    assert.equal(calc.getRotationForBuild(buildKey), null, `${buildKey}: rotation must fail closed`);
    assert.equal(calc.getRotationTimeForBuild(buildKey), null, `${buildKey}: duration must fail closed`);
    assert.equal(calc.calcBaseline(calc.TIERS.T96, buildKey), null, `${buildKey}: baseline must fail closed`);
    assert.equal(calc.getSkillForBuild(buildKey, "not-a-real-skill"), null, `${buildKey}: skill config must fail closed`);
    assert.equal(zeroSkill(calc, buildKey), 0, `${buildKey}: calculator must not produce a result`);
    assert.equal(catalog.isBestBuildEligible(buildKey), false, `${buildKey}: Best Build must remain unavailable`);
  }

  assert.ok(calc.getRotationForBuild("bamboocut-dust")?.length, "Dust remains explicitly modeled");
  assert.ok(calc.getRotationTimeForBuild("bamboocut-dust") > 0, "Dust retains its own duration");
  assert.ok(calc.calcBaseline(calc.TIERS["405|0.65b"], "bamboocut-dust") > 0, "Dust retains its own baseline");

  for (const unsupportedPath of ["Bamboocut-Kite", "Bamboocut-Draught", "Stonesplit-Strength"]) {
    const comparison = compareArenaBuilds({ path: unsupportedPath }, { path: "Bamboocut-Dust" });
    assert.equal(comparison.verdict, "INSUFFICIENT EVIDENCE", `${unsupportedPath}: Arena compare must not borrow Dust`);
    assert.deepEqual(comparison.dimensions, [], `${unsupportedPath}: Arena dimensions must remain absent`);
    const [ranked] = rankArenaCandidates([{ id: unsupportedPath, path: unsupportedPath }]);
    assert.equal(ranked.arenaObjectiveScore, null, `${unsupportedPath}: Arena score must remain unavailable`);
    assert.ok(["INSUFFICIENT EVIDENCE", "REFERENCE_ONLY"].includes(ranked.rankingConfidence), `${unsupportedPath}: Arena ranking must disclose evidence gap`);
    const state = loadArenaState(fakeStorage({ wwm_arena_state_v1: JSON.stringify({ profiles: [{ id: "p", path: unsupportedPath }] }) }));
    assert.equal(state.profiles[0].path, unsupportedPath, `${unsupportedPath}: persisted identity must not become Dust`);
    assert.deepEqual(state.profiles[0].weapons, [], `${unsupportedPath}: persisted identity must not receive Dust weapons`);
  }

  console.log("[v13-fail-closed] PASS — unsupported, legacy, and UNMODELED paths have no numerical fallback; Dust remains explicit.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
