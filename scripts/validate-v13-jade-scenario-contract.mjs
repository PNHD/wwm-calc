import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DEFAULT_JADE_SCENARIO,
  JADE_SOURCE_ROTATION_CONTRACT,
  compareJadeScenarioResults,
  evaluateSilkbindJade,
} from "../src/pathModels/silkbindJade.mjs";

const panel = { minOuter: 1800, maxOuter: 2800, prec: 110, crit: 90, aff: 20 };
const price = () => 100;
const currentTarget = {
  ...DEFAULT_JADE_SCENARIO,
  judgeRes: 0.65,
  targetResistanceSource: "selected-tier:405|0.65b",
  targetResistanceClassification: "PROVISIONAL_SCENARIO",
};

const headline = evaluateSilkbindJade(panel, currentTarget, "expected-dps", price);
assert.match(headline.scenarioId, /^JADE_EVENT_60S:/);
assert.equal(headline.scenarioContract.pathKey, "silkbind-jade");
assert.equal(headline.scenarioContract.durationSeconds, 60);
assert.equal(headline.scenarioContract.durationSource, "Silkbind-Jade event planner input");
assert.equal(headline.scenarioContract.targetResistanceValue, 0.65);
assert.equal(headline.scenarioContract.targetResistanceSource, "selected-tier:405|0.65b");
assert.equal(headline.scenarioContract.targetResistanceClassification, "PROVISIONAL_SCENARIO");
assert.equal(headline.scenarioContract.rotationSource, "src/pathModels/silkbindJade.mjs priority planner");
assert.equal(headline.scenarioContract.coefficientSource, "src/data/referenceData.ts ClassConfig.ROTATIONS[牵丝玉].skillDatabase");
assert.equal(headline.scenarioContract.unresolvedAssumptions.length, 0);

assert.equal(JADE_SOURCE_ROTATION_CONTRACT.scenarioId, "JADE_SOURCE_ROTATION_49_5S");
assert.equal(JADE_SOURCE_ROTATION_CONTRACT.durationSeconds, 49.5);
assert.notEqual(JADE_SOURCE_ROTATION_CONTRACT.scenarioId, headline.scenarioId);

const same = evaluateSilkbindJade({ ...panel, crit: 100 }, currentTarget, "expected-dps", price);
assert.equal(compareJadeScenarioResults(headline, same).available, true);

const differentPlanner = evaluateSilkbindJade(panel, { ...currentTarget, firstQiBreakTime: 25 }, "expected-dps", price);
assert.notEqual(differentPlanner.scenarioId, headline.scenarioId);
assert.equal(compareJadeScenarioResults(headline, differentPlanner).reason, "SCENARIO_MISMATCH");

const gearPerturbation = evaluateSilkbindJade(panel, { ...currentTarget, attunementBonuses: { "vernal-frequent-projectile": 5 }, cacheSalt: "candidate" }, "expected-dps", price);
assert.equal(gearPerturbation.scenarioId, headline.scenarioId);
assert.equal(compareJadeScenarioResults(headline, gearPerturbation).available, true);

const differentDuration = evaluateSilkbindJade(panel, { ...currentTarget, duration: 49.5 }, "expected-dps", price);
const mismatch = compareJadeScenarioResults(headline, differentDuration);
assert.deepEqual({ available: mismatch.available, value: mismatch.value, reason: mismatch.reason }, {
  available: false,
  value: null,
  reason: "SCENARIO_MISMATCH",
});

const unresolved = evaluateSilkbindJade(panel, DEFAULT_JADE_SCENARIO, "expected-dps", price);
assert.equal(compareJadeScenarioResults(unresolved, unresolved).reason, "UNRESOLVED_SCENARIO_CONTRACT");
assert.equal(unresolved.scenarioContract.targetResistanceValue, 0.45);
assert.equal(unresolved.scenarioContract.targetResistanceSource, "UNKNOWN_LEGACY_JADE_DEFAULT");
assert.notEqual(unresolved.scenarioId, headline.scenarioId);

for (const patch of [
  { targetResistanceSource: "different-target-source" },
  { targetResistanceClassification: "UNKNOWN" },
  { durationSource: "different-duration-source" },
  { rotationSource: "different-rotation-source" },
  { coefficientSource: "different-coefficient-source" },
]) {
  const candidate = evaluateSilkbindJade(panel, { ...currentTarget, ...patch }, "expected-dps", price);
  assert.equal(compareJadeScenarioResults(headline, candidate).available, false);
}

const forged = { ...headline, scenarioId: "JADE_EVENT_60S:FORGED" };
assert.equal(compareJadeScenarioResults(headline, forged).reason, "UNRESOLVED_SCENARIO_CONTRACT");

const app = fs.readFileSync("src/App.tsx", "utf8");
for (const surface of ["stat-priority", "best-build", "gear-compare"]) {
  assert.ok(app.includes(`jade-scenario-guard:${surface}`), `${surface} must guard scenario identity`);
}
assert.ok(app.includes("targetResistanceSource: activeTier.source"), "Jade pricing and diagnostics must share the selected-tier target contract");
assert.ok(app.includes('duration={selectedBuild === "silkbind-jade" ? rotationStats.duration : modeledDurationOrZero(selectedBuild)}'), "headline duration must come from its result contract");
assert.ok(app.includes("jadeScenarioForCombo(active.filter((item) => isItemEquipped(item, active)))"), "headline must resolve current gear without a temporal-dead-zone read");
assert.ok(app.includes("const statPriorityGear = getActiveGear();"), "Stat Priority must derive its current gear before constructing a Jade scenario");
assert.ok(app.includes("jadeScenarioForCombo(statPriorityGear.filter((item) => isItemEquipped(item, statPriorityGear)))"), "Stat Priority must preserve the canonical equipped-item filter when constructing its Jade scenario");
assert.ok(!app.includes("jadeScenarioForCombo(equippedGear) : null"), "Stat Priority must not read the later equippedGear binding");
assert.ok(app.includes("function jadeScenarioForCombo"), "scenario helper must be callable by the earlier headline calculation");
assert.ok(app.includes("function priceJadeEvent"), "event pricer must be callable by the earlier headline calculation");
assert.ok(app.includes("candidate.scenarioId === currentScenario.scenarioId"), "Best Build candidates must match the current scenario");
for (const dependency of ["pathKey: selectedBuild", "scenario: selectedBuild === \"silkbind-jade\" ? jadeScenario : null", "objective: selectedBuild === \"silkbind-jade\" ? jadeObjective : null", "tier: activeTier", "panel,", "baseOverride:", "innerWays:", "innerWayTiers:", "gear: getActiveGear()"] ) {
  assert.ok(app.includes(dependency), `Best Build calculation identity is missing ${dependency}`);
}
assert.ok(app.includes("[bestBuildCalculationIdentity]"), "Best Build must invalidate every calculation identity change");
assert.ok(app.includes("const factorDeltas = comparisonAvailable ?"), "Gear Compare must not expose numerical factor deltas for unavailable scenarios");
assert.ok(!app.includes("JADE_SOURCE_ROTATION_49_5S"), "the 49.5s source reference must not feed the active product result");

const calc = fs.readFileSync("src/utils/calc.ts", "utf8");
assert.match(calc, /CURRENT_VALIDATED_BASELINE:\s*null\s*=\s*null/);

const capabilities = fs.readFileSync("src/data/pathCatalog.ts", "utf8");
for (const capability of ["headlineDps", "rotationDps", "skillPreview", "statPriority", "gearCompare", "bestBuild"]) {
  assert.match(capabilities, new RegExp(`silkbind-jade[\\s\\S]*?${capability}: \\"PROVISIONAL\\"`));
}

console.log("[v13-jade-scenario-contract] PASS — Jade result, target, duration, and recommendation scenario isolation verified.");
