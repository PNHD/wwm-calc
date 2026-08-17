import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BAMBOOCUT_EVENT_TAGS,
  BAMBOOCUT_SETTLEMENT_RUNTIME_FIXTURE,
  CROSS_AUDIT_EVIDENCE,
  applyIndependentAttunement,
  hasBamboocutEventTag,
  modeledResidualPenZone,
  settlementSensitivityRows,
} from "../src/utils/bamboocutMechanicsAudit.mjs";

const calcSource = fs.readFileSync("src/utils/calc.ts", "utf8");

// AUDIT A — Attunement zone. Current production applies Attunement after the
// ordinary additive damage zone, as an independent multiplier on eligible events.
assert.match(calcSource, /attMul\s*=\s*1\s*\+\s*panel\.attunedBonus\s*\/\s*100/);
assert.match(calcSource, /perHit\s*\*=\s*attMul/);
const base = 100;
const existingAdditiveZone = 0.50;
const beforeAttunement = base * (1 + existingAdditiveZone);
const eligible0 = applyIndependentAttunement(beforeAttunement, 0, true);
const eligible5 = applyIndependentAttunement(beforeAttunement, 5, true);
const ineligible5 = applyIndependentAttunement(beforeAttunement, 5, false);
assert.equal(eligible0, 150);
assert.equal(eligible5, 157.5);
assert.equal(eligible5 / eligible0, 1.05);
assert.equal(ineligible5 / eligible0, 1);
// If +5% were merged into the pre-existing +50% additive zone, the ratio would
// be 155/150 instead. Lock the distinction explicitly.
assert.notEqual(eligible5 / eligible0, 155 / 150);

// AUDIT B — Penetration/resistance boundary. This locks the CURRENT branch only.
// Evidence remains MODELED/UNKNOWN for exact Global T96 denominators.
assert.match(calcSource, /return\s+delta\s*>=\s*0\s*\?\s*delta\s*\/\s*200\s*:\s*delta\s*\/\s*100/);
assert.equal(modeledResidualPenZone(10, 20), -0.10); // Pen < Resistance
assert.equal(modelledZero(modeledResidualPenZone(20, 20)), 0); // Pen = Resistance
assert.equal(modeledResidualPenZone(30, 20), 0.05); // Pen > Resistance

// AUDIT C — event eligibility and explicit special-resolution tags.
assert.ok(hasBamboocutEventTag("Scarlet Spin", "everspring-eligible"));
assert.ok(hasBamboocutEventTag("Resonance", "everspring-eligible"));
assert.ok(hasBamboocutEventTag("Resonance", "standard-outcome"));
assert.ok(hasBamboocutEventTag("Burn and Bury", "guaranteed-crit"));
assert.ok(hasBamboocutEventTag("Soulbreak", "settlement"));
assert.ok(hasBamboocutEventTag("Soulbreak", "special-resolution"));
assert.ok(!hasBamboocutEventTag("Soulbreak", "standard-outcome"));
assert.ok(hasBamboocutEventTag("Divinecraft Fire", "divinecraft"));
assert.ok(BAMBOOCUT_EVENT_TAGS.Soulbreak.length >= 2);

const rows = settlementSensitivityRows();
assert.equal(rows.length, 4);
const current = rows.find((row) => row.id === "current-special-resolution");
assert.ok(current);
assertClose(current.dps1106, 61266.44125288431);
assertClose(current.dps1129, 60673.87643198421);
assert.equal(current.winner, "1106");

// No hypothesis is allowed to rewrite the authoritative runtime fixture or force
// the observed one-run winner into the model. These are diagnostics only.
for (const row of rows) {
  assert.equal(row.winner, "1106", `${row.id} unexpectedly flips the bounded fixture`);
  assert.ok(row.evidence.includes(CROSS_AUDIT_EVIDENCE.MODELED));
}
assertClose(BAMBOOCUT_SETTLEMENT_RUNTIME_FIXTURE["1106"].modeledDps, 61266.44125288431);
assertClose(BAMBOOCUT_SETTLEMENT_RUNTIME_FIXTURE["1129"].modeledDps, 60673.87643198421);

const broad = rows.find((row) => row.id === "derived-final-all-modeled");
const martial = rows.find((row) => row.id === "derived-final-martial-weapon");
const rope = rows.find((row) => row.id === "derived-final-rope-only");
assertClose(broad.dps1106, 67393.08537817275);
assertClose(broad.dps1129, 66741.26407518263);
assertClose(martial.dps1106, 66324.04197984897);
assertClose(martial.dps1129, 65682.59835496287);
assertClose(rope.dps1106, 61764.399572431576);
assertClose(rope.dps1129, 61166.567582005715);

console.log("[bamboocut-mechanics-audit] PASS");
console.table(rows.map((row) => ({
  hypothesis: row.id,
  dps1106: row.dps1106.toFixed(2),
  dps1129: row.dps1129.toFixed(2),
  deltaPct: `${row.deltaPct.toFixed(3)}%`,
  winner: row.winner,
})));

function assertClose(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

function modelledZero(value) {
  return Object.is(value, -0) ? 0 : value;
}
