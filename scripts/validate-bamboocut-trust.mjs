import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");
const trust = fs.readFileSync("src/data/modelTrust.ts", "utf8");
const compare = fs.readFileSync("src/product/workspaces/GearCompareWorkspace.tsx", "utf8");
const model = fs.readFileSync("src/utils/t96ProductModel.mjs", "utf8");
const combatEvidence = fs.readFileSync("src/data/globalV2CombatEvidence.ts", "utf8");
const videoEvidence = fs.readFileSync("src/data/globalV2VideoEvidence.ts", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(`[bamboocut-trust] ${message}`);
}

for (const level of ["VERIFIED_PANEL", "VERIFIED_CLIENT", "OFFICIAL", "OBSERVED_PARSE", "COMMUNITY_MEASURED", "MODELED", "UNKNOWN"]) {
  assert(trust.includes(`"${level}"`), `missing evidence level ${level}`);
}
for (const confidence of ["HIGH", "MEDIUM", "CLOSE CALL", "EXPERIMENTAL"]) {
  assert(trust.includes(`"${confidence}"`), `missing confidence category ${confidence}`);
}

assert(trust.includes('ownership: "MY BUILD"') && trust.includes('maturity: "CALIBRATED"'), "Bamboocut must be labeled as the calibrated owner build");
assert(trust.includes('ownership: "REFERENCE BUILD"') && trust.includes('maturity: "MODELED"'), "Jade must remain an explicit reference/model, not owner inventory");
assert(trust.includes('margin < 2'), "deterministic close-call guard band missing");
assert(!trust.includes("confidencePct") && !trust.includes("probabilityOfWinning"), "fake statistical confidence field introduced");

// 1106 / 1129 client contract: the displayed weapon-martial row is invariant,
// while Everspring Attunement changes only the combat-only aggregate.
assert(/"1106"[\s\S]*umbMartial: 5\.8[\s\S]*attunedBonus: 20\.0/.test(trust), "1106 fixture contract missing");
assert(/"1129"[\s\S]*umbMartial: 5\.8[\s\S]*attunedBonus: 20\.2/.test(trust), "1129 attunement fixture contract missing");
assert(app.includes('semanticRole === "attunement" || sub.type === "Attuned Bonus"'), "normalized/legacy attunement guard missing from generated App");
assert(app.includes("next.attunedBonus = Number(gearSum.attunedBonus)"), "combat-only attunement aggregate is not recomputed from candidate gear");

assert(app.includes("factorDeltas,"), "Gear Compare marginal DPS payload missing");
assert(app.includes("Outcome probability (Precision/Critical/Affinity)"), "joint outcome diagnostic missing");
assert(app.includes('label: "Song of Tang"') && app.includes('label: "Morale Chant"') && app.includes('label: "Phantom Chime"') && app.includes('label: "Starweave"'), "known lifecycle mechanic differential checks missing");
assert(app.includes("fixtureDiagnostic,"), "1106/1129 modeled-vs-observed diagnostic missing");
assert(app.includes("Best Build recommendation confidence"), "Best Build confidence summary missing");
assert(compare.includes("COMBAT DELTA · MARGINAL DPS") && compare.includes("CONFIDENCE:") && compare.includes("MODELED vs OBSERVED"), "Compare trust UX incomplete");
assert(compare.includes("Parse is diagnostic only; no auto-calibration is applied."), "parse diagnostic could be mistaken for auto-calibration");

// Eligibility/evidence guardrails.
assert(trust.includes('{ source: "Scarlet Spin", outcome: "standard-roll", martialArt: true, starweave: true, everspring: true'), "Scarlet Spin eligibility contract missing");
assert(trust.includes('{ source: "Resonance", outcome: "standard-roll", martialArt: true, starweave: true, everspring: true'), "Resonance eligibility contract missing");
assert(trust.includes('{ source: "Burn and Bury", outcome: "guaranteed-critical"'), "Burn and Bury forced-critical contract missing");
assert(trust.includes('{ source: "Soulbreak", outcome: "special-resolution"') && trust.includes('evidence: "UNKNOWN"'), "Soulbreak special-resolution uncertainty must stay explicit");
assert(combatEvidence.includes('outcomeRule: "guaranteed-critical"') && combatEvidence.includes('outcomeRule: "special-resolution"'), "upstream combat evidence outcome rules missing");

// Existing observed evidence remains calibration evidence only.
assert(videoEvidence.includes("47_224") && videoEvidence.includes("45_825"), "observed 1129/1106 parse evidence missing");
assert(model.includes("OBSERVED_PANEL_1106") && model.includes("OBSERVED_PANEL_1129"), "client panel fixtures missing from product model");
assert(!app.includes("DPS_CALIBRATION_FACTOR") && !app.includes("parseCalibrationMultiplier"), "parse-to-model force-fit introduced");

// Winner must remain modeled DPS. These strings are forbidden as optimizer tie-break objectives.
assert(!app.includes("Subtract a tiny penalty per overcap point"), "crit overcap tie-break leaked back into Best Build");
assert(!app.includes("rollQualityPenalty") && !app.includes("masteryWinner"), "roll/mastery winner logic introduced");

console.log("[bamboocut-trust] PASS — evidence, eligibility, attunement boundary, confidence and diagnostics verified.");
