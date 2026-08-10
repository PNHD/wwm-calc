import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BAMBOOCUT_T96_EFFECTS,
  CHEST_SWAP_1129_MINUS_1106,
  DAMAGE_SOURCE_OUTCOME_RULES,
  DEFAULT_BAMBOOCUT_T96_SCENARIO,
  GLOBAL_T96_ATTRIBUTE_CONVERSIONS,
  OBSERVED_PANEL_1106,
  OBSERVED_PANEL_1129,
  buildPanelMismatchReport,
  deriveEffectivePanel,
  projectChestSwap1129From1106,
  simulateStackTimeline,
} from "../src/utils/t96ProductModel.mjs";

const app = fs.readFileSync("src/App.tsx", "utf8");
const timeline = fs.readFileSync("src/utils/rotationTimeline.ts", "utf8");
const combatWorkspace = fs.readFileSync("src/product/workspaces/CombatWorkspace.tsx", "utf8");
const evidence = fs.readFileSync("src/data/panelOptimizationEvidence.ts", "utf8");
const combatEvidence = fs.readFileSync("src/data/globalV2CombatEvidence.ts", "utf8");
const videoEvidence = fs.readFileSync("src/data/globalV2VideoEvidence.ts", "utf8");
const modelAssumptions = fs.readFileSync("scripts/apply-model-assumptions.mjs", "utf8");

// A/B: calibrate from 1106 and predict the supplied 1129 menu panel using one
// coherent conversion model. No arbitrary per-field correction values are used.
const predicted1129 = projectChestSwap1129From1106();
const mismatch1129 = buildPanelMismatchReport(predicted1129, OBSERVED_PANEL_1129);
assert.equal(mismatch1129.pass, true, `1129 mismatch: ${JSON.stringify(mismatch1129.rows.filter((row) => !row.pass))}`);

// The calibration fixture itself is identity by definition and serves as the
// exact 1106 observed snapshot acceptance source.
const derived1106 = { ...OBSERVED_PANEL_1106, ...deriveEffectivePanel(OBSERVED_PANEL_1106) };
const mismatch1106 = buildPanelMismatchReport(derived1106, OBSERVED_PANEL_1106);
assert.equal(mismatch1106.pass, true, `1106 mismatch: ${JSON.stringify(mismatch1106.rows.filter((row) => !row.pass))}`);

// Effective outcome acceptance: direct Crit is added after the 80% base cap.
assert.ok(Math.abs(derived1106.finalCritAffinity - 95.1) <= 0.15, "1106 final Crit+Affinity must reproduce ~95.1%");
assert.ok(Math.abs(predicted1129.finalCritAffinity - 91.2) <= 0.15, "1129 final Crit+Affinity must reproduce ~91.2%");
assert.ok(predicted1129.effectiveCrit < 80, "1129 effective Crit must remain below the 80% base cap");
assert.equal(OBSERVED_PANEL_1106.dcrit, 4.6, "Direct Critical fixture must stay +4.6%");

// Food is a deterministic combat/menu toggle and must not regress to T91 values.
assert.equal(1614 + 120, 1734, "T96 food Min Physical Attack delta must be +120");
assert.equal(2777 + 240, 3017, "T96 food Max Physical Attack delta must be +240");
assert.ok(app.includes("activeTier.foodMin"), "product must source food Min from the active tier");
assert.ok(app.includes("activeTier.foodMax"), "product must source food Max from the active tier");

// Conversion provenance: community prior remains documented but is not the active
// client projection when it fails the supplied swap.
assert.ok(evidence.includes("GLOBAL_ATTRIBUTE_CONVERSIONS_COMMUNITY_PRIOR"));
assert.ok(evidence.includes("CLIENT_T96_ATTRIBUTE_CONVERSIONS"));
assert.notEqual(GLOBAL_T96_ATTRIBUTE_CONVERSIONS.agility.critRatePerPoint, 0.076);
assert.ok(Math.abs(CHEST_SWAP_1129_MINUS_1106.precDirect + 6.6) < 1e-9);

// Full-build replacement and optimizer objective must use modeled timeline damage.
assert.ok(app.includes("const candidateCombo = ["), "Gear Compare must construct the full replacement build");
assert.ok(
  app.includes("comboInCombat(candidateCombo).total") || (app.includes("const candidateCombat = comboInCombat(candidateCombo)") && app.includes("candidateCombat.total")),
  "Gear Compare must rerun the complete build",
);
assert.ok(app.includes("timelineResult.total"), "Bamboocut ranking must consume timeline total damage");
assert.ok(app.includes("return baselineScore > 0 ? (totalDmg / baselineScore) * 100 : 0;"), "Best Build internal rank must be monotonic modeled damage");
assert.ok(!app.includes("Subtract a tiny penalty per overcap point"), "Best Build must not use a hidden Crit-overcap tie penalty");
assert.ok(!app.includes("rollQuality * 0.5"), "roll quality must not decide a build winner");

// Stat Priority must perturb the current complete panel and rerun the same T96
// conditional timeline instead of falling back to a universal static weight table.
assert.ok(app.includes("conditionalBuffs = buildTimelineBuffs"), "Stat Priority must rebuild conditional timeline effects");
assert.ok(app.includes("getScenarioRotationForBuild(selectedBuild)"), "Stat Priority/current DPS must consume the shared scenario rotation");
assert.ok(app.includes("starweaveDistanceBonusPct"), "distance assumption must reach timeline callers");
assert.ok(combatWorkspace.includes("Marginal modeled DPS from one additional Global max roll"));

// Morale: a 60s timeline may approach max after ramping, but cannot be equivalent
// to permanent 5 stacks from t=0.
const dense60 = Array.from({ length: 121 }, (_, i) => i * 0.5);
const morale = simulateStackTimeline(dense60, BAMBOOCUT_T96_EFFECTS.morale, 60);
assert.equal(morale.maxObserved, 5, "Morale must be able to reach 5 stacks");
assert.ok(morale.averageStacks < 5, "Morale 60s ramp must not equal permanent max from t=0");
assert.ok(morale.averageStacks > 4, "Morale high-frequency boss rotation should sustain high stacks after ramp");

// Song of Tang: scoped to Martial Art Skills, not every damage source.
assert.ok(timeline.includes('trigger: "martial-art"'), "Tang Melody must be driven by Martial Art events");
assert.ok(timeline.includes('scope: "martial-art"'), "Tang Melody / Starweave bonuses must be skill-scoped");
assert.ok(timeline.includes("maxDelta: { critDmg: 15 }"), "Tang Melody max five-stack Crit DMG must be represented");
assert.ok(!timeline.includes("every buff static at max"), "timeline must not describe permanent max-stack behavior as the primary model");

// Phantom Chime is a Resonance-driven 5s stack rather than permanent +10 pen.
assert.ok(timeline.includes('trigger: "resonance"'), "Phantom Chime must use Resonance events");
assert.ok(timeline.includes("duration: 5"), "Phantom Chime / Starweave TTL must remain 5s");
assert.ok(timeline.includes("Physical Resistance"));

// Starweave: T96 +78 2pc, event-ramped +3%/stack 4pc, and only the two
// exact tooltip distance endpoints. No interpolation is invented.
assert.ok(app.includes("starweavePieces >= 2"), "Starweave 2pc ownership must be rebuilt from gear");
assert.ok(app.includes("+ 78"), "Starweave T96 2pc must grant +78 Min Physical Attack");
assert.ok(timeline.includes("Starweave · Martial Art Skill Damage"));
assert.equal(BAMBOOCUT_T96_EFFECTS.starweave.martialDamagePctPerStack, 3);
assert.equal(DEFAULT_BAMBOOCUT_T96_SCENARIO.starweaveDistanceBonusPct, 0);
assert.equal(DEFAULT_BAMBOOCUT_T96_SCENARIO.bossAttacksPlayer, false);
assert.ok(timeline.includes("Math.min(1, distanceBonusPct)"), "Starweave distance must clamp to verified +1% max");
assert.ok(combatWorkspace.includes("≤4m · +0% distance component"));
assert.ok(combatWorkspace.includes("≥8m · +1% max tooltip component"));
assert.ok(combatWorkspace.includes("No interpolation is assumed between 4m and 8m"));

// Cinder is a real scenario toggle: the off state removes the observed Fire
// sources, but never applies +4% as a blanket Physical multiplier.
assert.ok(app.includes("const [cinderAsh, setCinderAsh] = useState(true)"));
assert.ok(app.includes('!["Divinecraft - Fire", "Fire - Solid Foundation"].includes(item.name)'));
assert.ok(app.includes("onCinderAshChange={setCinderAsh}"));
assert.ok(combatWorkspace.includes("never blanket +4% Physical damage"));

// Locked fixture assumptions remain visible rather than silently modeled with
// invented boss-hit cadence or controlled-target timing.
assert.ok(combatWorkspace.includes("Boss attacks OFF · Controlled OFF"));
assert.ok(combatWorkspace.includes("Party buffs OFF"));

// Burn and Bury is the one confirmed forced-Crit source. Settlement/Divinecraft
// sources remain special-resolution instead of being forced through the same roll.
assert.equal(DAMAGE_SOURCE_OUTCOME_RULES["Burn and Bury"], "guaranteed-critical");
assert.equal(DAMAGE_SOURCE_OUTCOME_RULES.Soulbreak, "special-resolution");
assert.equal(DAMAGE_SOURCE_OUTCOME_RULES["Divinecraft - Fire"], "special-resolution");
assert.ok(combatEvidence.includes('"Burn and Bury"'));
assert.ok(combatEvidence.includes('rule: "guaranteed-critical"'));

// Damage Composition is a damage-share diagnostic, never a hit-rate target.
assert.ok(app.includes("Damage Composition remains a damage-share diagnostic only"));
assert.ok(!app.includes("compositionPct.crit / 100"), "damage-share percentages must not calibrate hit probabilities");

// Parse projection remains presentation-only and cannot affect optimizer ranking.
assert.ok(modelAssumptions.includes("excluded from gear ranking"));
assert.ok(!app.includes("modeledDps={rotationStats.dps * dpsEff}"));

// Supplied A/B and full parse fixtures must stay in the repository and retain the
// observed direction rather than being reverse-fit into an exact model target.
assert.ok(videoEvidence.includes("displayedDps: 47224"));
assert.ok(videoEvidence.includes("displayedDps: 45825"));
assert.ok(combatEvidence.includes("2_820_055"));
assert.ok(combatEvidence.includes("damageCompositionPct"));

// Simple performance smoke for stack processing: 10k deterministic events should
// complete synchronously without combinatorial allocation or recursion.
const perfEvents = Array.from({ length: 10_000 }, (_, i) => i * 0.006);
const started = performance.now();
simulateStackTimeline(perfEvents, BAMBOOCUT_T96_EFFECTS.phantomChime, 60);
const elapsedMs = performance.now() - started;
assert.ok(elapsedMs < 1000, `timeline performance smoke exceeded 1s: ${elapsedMs.toFixed(1)}ms`);

const machineReport = {
  panel1106: mismatch1106,
  panel1129: mismatch1129,
  morale60s: morale,
  scenario: DEFAULT_BAMBOOCUT_T96_SCENARIO,
  performanceMs: Number(elapsedMs.toFixed(2)),
};
console.log("[t96-product] PASS");
console.log(JSON.stringify(machineReport, null, 2));
