import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ARENA_ATTUNEMENT_CATALOG, ARENA_MODE_IDS, ARENA_MODE_RULES, ATTUNEMENT_APPLICABILITY,
  BAMBOOCUT_DUST_ARENA, BAMBOOCUT_DUST_GVG, BATTLEGROUPS, COMBAT_STATES, COMMAND_CATALOG,
  DOCTRINE_TEMPLATES, EFFECT_SCOPE, EVIDENCE_MATRIX, EVIDENCE_STATE, GUILD_TECHNIQUES,
  GVG_EX_CATALOG, GVG_EX_COOLDOWN_RULE, GVG_LEAGUE_SCALING, GVG_OFFICIAL_RULES, GVG_PHASES,
  LEVEL_ADJUSTMENT, NETWORK_RESOLUTION, PERCEPTION_FOREST, P0_CLIENT_CAPTURE_CHECKLIST,
  applyCombatEvent, attunementDecision, canOptimizeNumericStats, clampEnduranceReduction,
  createArenaCombatState, effectAllowed, halftimeDamageBonus, matchupAnalysis, objectiveSensitivity,
  validate3v3Rules, validateCompetitiveResearch,
} from "../src/competitive/competitive-v2.mjs";

assert.equal(validateCompetitiveResearch().length, 0, validateCompetitiveResearch().join("\n"));
assert.deepEqual(ARENA_MODE_IDS, ["1V1_ARENA","3V3_ARENA","GROUP_STRATEGY","5V5_ARENA","PERCEPTION_FOREST","TRAINING_TERRACE"]);
assert.equal(BATTLEGROUPS.length, 5);
assert.equal(ARENA_MODE_RULES["1V1_ARENA"].schedule, "24/7");
assert.equal(ARENA_MODE_RULES["3V3_ARENA"].levelAdjustment, EVIDENCE_STATE.CONFIRMED_OFFICIAL);
assert.equal(ARENA_MODE_RULES.GROUP_STRATEGY.levelAdjustment, EVIDENCE_STATE.CONFIRMED_OFFICIAL);
assert.notEqual(ARENA_MODE_RULES.GROUP_STRATEGY.id, ARENA_MODE_RULES["5V5_ARENA"].id);

const noHealer = validate3v3Rules({ healer: false, sameMartialArtCount: 2 });
assert.equal(noHealer.branch, "NO_HEALER"); assert.equal(noHealer.reviveOpportunities, 1); assert.equal(noHealer.reviveRangeMeters, 10); assert.equal(noHealer.reviveWindowSeconds, 15);
const healer = validate3v3Rules({ healer: true, sameMartialArtCount: 2, royalRemedyT6: true });
assert.equal(healer.branch, "WITH_HEALER"); assert.equal(healer.royalRemedyT6Exception, true);
assert.equal(validate3v3Rules({ healer: false, sameMartialArtCount: 3 }).valid, false);

const normalized = canOptimizeNumericStats("3V3_ARENA");
assert.equal(normalized.allowed, false); assert.ok(normalized.unknownFields.includes("physicalAttack")); assert.ok(normalized.unknownFields.includes("playerTargetBoost"));
assert.equal(canOptimizeNumericStats("GROUP_STRATEGY").allowed, false);
assert.equal(LEVEL_ADJUSTMENT["3V3_ARENA"].fields.mysticBranches.evidence, EVIDENCE_STATE.CONFIRMED_OFFICIAL);

assert.equal(ATTUNEMENT_APPLICABILITY["3V3_ARENA"].arena, EVIDENCE_STATE.CONFIRMED_OFFICIAL);
assert.equal(ATTUNEMENT_APPLICABILITY.GUILD_WAR.arena, EVIDENCE_STATE.UNKNOWN);
assert.equal(attunementDecision("GUILD_WAR").recommendationAllowed, false);
assert.equal(ATTUNEMENT_APPLICABILITY["3V3_ARENA"].stacking, false);

for (const state of ["HIT_STAGGER","CONTROLLED","IMMOBILIZED","AIRBORNE","KNOCKBACK","KNOCKDOWN","TENACITY","SUPER_ARMOR","CONTROL_IMMUNITY","INVINCIBILITY","DEFENSE","DEFLECT","CONTINUOUS_DEFLECT","PERFECT_DODGE","DODGE_IFRAME","SPRINT","DASH","BREAK_DEFENSE","EXECUTION","EXECUTED_KNOCKDOWN","GET_UP_PROTECTION","PASSIVE_BREAK_CONTROL","GUARDING_QI_CORE"]) assert.ok(COMBAT_STATES.includes(state));

let combat = createArenaCombatState({ hp: 50, qi: 40, state: "HIT_STAGGER", tags: ["CONTROLLED"] });
combat = applyCombatEvent(combat, { t: 2, type: "GUARDING_QI_CORE", hpRestore: 10, qiRestore: 20 });
assert.equal(combat.hp, 60); assert.equal(combat.qi, 60); assert.equal(combat.invincibleUntil, 2.5); assert.ok(!combat.tags.includes("CONTROLLED"));
const neutralGqc = applyCombatEvent(createArenaCombatState({ hp: 80, qi: 80 }), { t: 3, type: "GUARDING_QI_CORE", hpRestore: 1, qiRestore: 1 });
assert.match(neutralGqc.log.at(-1).note, /control-clear does not trigger outside/i);
const extended = applyCombatEvent(createArenaCombatState({ state: "HIT_STAGGER" }), { t: 1, type: "GUARDING_QI_CORE", inescapableHitStaggerUntil: 2.4 });
assert.equal(extended.invincibleUntil, 2.4);

let executed = applyCombatEvent(createArenaCombatState({ qi: 70 }), { type: "EXECUTED_KNOCKDOWN" });
executed = applyCombatEvent(executed, { type: "QI_DAMAGE", amount: 30 });
assert.equal(executed.qi, 70);
executed = applyCombatEvent(executed, { type: "GET_UP" });
assert.ok(executed.tags.includes("TENACITY")); assert.ok(executed.tags.includes("CONTROL_IMMUNITY")); assert.ok(executed.tags.includes("SUPER_ARMOR"));
assert.notEqual("TENACITY", "SUPER_ARMOR");

let breakControl = applyCombatEvent(createArenaCombatState(), { type: "BREAK_CONTROL_PROGRESS", delta: 40 });
assert.equal(breakControl.breakControlProgress, 40);
breakControl = applyCombatEvent({ ...breakControl, breakControlFrozen: true }, { type: "BREAK_CONTROL_PROGRESS", delta: 40 });
assert.equal(breakControl.breakControlProgress, 40);
const serene = applyCombatEvent(createArenaCombatState(), { type: "SERENE_BREEZE" });
assert.ok(serene.tags.includes("SUPER_ARMOR")); assert.ok(!serene.tags.includes("TENACITY"));

assert.equal(clampEnduranceReduction(80), 40);
assert.equal(NETWORK_RESOLUTION.reverseHitValidation, true); assert.equal(NETWORK_RESOLUTION.latencyDamageCoefficient, null);

assert.equal(BAMBOOCUT_DUST_ARENA.burnAndBury.unblockable, true);
assert.equal(BAMBOOCUT_DUST_ARENA.piercingDart.tenacityStartsAfterSeconds, 0.5);
assert.equal(BAMBOOCUT_DUST_ARENA.phantomRally.resonanceMustNotInterruptTenacity, true);
assert.equal(BAMBOOCUT_DUST_ARENA.pveLeakRejected.scope, EFFECT_SCOPE.NON_PLAYER_ONLY);
assert.equal(effectAllowed(BAMBOOCUT_DUST_ARENA.pveLeakRejected.scope, "1V1_ARENA"), false);
assert.equal(effectAllowed(BAMBOOCUT_DUST_ARENA.pveLeakRejected.scope, "GUILD_WAR"), false);

assert.equal(PERCEPTION_FOREST.rodentHunt.durationSeconds, 10);
assert.equal(PERCEPTION_FOREST.rodentHunt.healingReceivedReductionPct, 50);
assert.equal(PERCEPTION_FOREST.rodentHunt.settlementPctDamageTaken, 30);
assert.equal(effectAllowed(PERCEPTION_FOREST.rodentHunt.scope, "1V1_ARENA"), false);
assert.equal(effectAllowed(PERCEPTION_FOREST.rodentHunt.scope, "PERCEPTION_FOREST"), true);

assert.ok(ARENA_ATTUNEMENT_CATALOG.length >= 8);
assert.ok(ARENA_ATTUNEMENT_CATALOG.every((item) => item.slot && item.rarity && item.effect && item.patch && item.evidence));
assert.ok(ARENA_ATTUNEMENT_CATALOG.some((item) => item.id === "disc-stonesplit-might" && /Aug 2/i.test(item.patch)));
const matchup = matchupAnalysis({ myPath: "Bamboocut-Dust", opponentPath: "Stonesplit-Might", mode: "1V1_ARENA" });
assert.ok(Array.isArray(matchup.advantages)); assert.ok(Array.isArray(matchup.risks)); assert.ok(Array.isArray(matchup.keyInteractions)); assert.ok(!("winProbability" in matchup));

assert.equal(GVG_OFFICIAL_RULES.outposts.spawnSeconds, 180);
assert.equal(GVG_OFFICIAL_RULES.outposts.ownershipLockSeconds, 60);
assert.equal(GVG_OFFICIAL_RULES.outposts.reviveOption, true);
assert.equal(GVG_OFFICIAL_RULES.panaceaSameTargetLockSeconds.value, 60);
assert.equal(GVG_OFFICIAL_RULES.bulwark.proximityStackCap, 15);
assert.equal(GVG_OFFICIAL_RULES.goose.proximityStackCap, 30);
assert.equal(GVG_OFFICIAL_RULES.qiDamageReceivedMultiplier.value, 0.5);
assert.equal(GVG_OFFICIAL_RULES.bulwark.breakingBulwarkReducesEnemyGooseAttributes, true);
assert.equal(GVG_OFFICIAL_RULES.neutralBosses.randomSpawnJitterSeconds, 60);
assert.equal(GVG_OFFICIAL_RULES.halftime.triggerSeconds, null);
assert.equal(halftimeDamageBonus(0), 0); assert.equal(halftimeDamageBonus(29), 0); assert.equal(halftimeDamageBonus(30), 30); assert.equal(halftimeDamageBonus(90), 90);
assert.equal(COMMAND_CATALOG[0].cost, null); assert.equal(COMMAND_CATALOG[0].cooldown, null);
assert.equal(GVG_OFFICIAL_RULES.commandSkills.exactCosts, null);

assert.equal(GVG_LEAGUE_SCALING.DIVINARCHE.objectiveHpMultiplier, 0.75);
assert.equal(GVG_LEAGUE_SCALING.JESTING_HERO.objectiveHpMultiplier, 0.5);
assert.equal(GVG_LEAGUE_SCALING.STEALTH_JESTER.objectiveHpMultiplier, 0.25);
assert.equal(GVG_PHASES.find((phase) => phase.id === "OUTPOST_PHASE").fixedStart, 180);
assert.equal(GVG_PHASES.find((phase) => phase.id === "HALFTIME").fixedStart, null);

const ex = Object.fromEntries(GVG_EX_CATALOG.map((item) => [item.id, item]));
assert.equal(ex.NAMELESS_SWORD_EX.values.lv3AlliedQiRestore, 60);
assert.equal(ex.STORMBREAKER_SPEAR_EX.values.selfDamageReductionPct, 75);
assert.equal(ex.EVERSPRING_UMBRELLA_EX.values.healingReductionPct, 45);
assert.equal(ex.EVERSPRING_UMBRELLA_EX.values.lv3HealingReductionPct, 65);
assert.equal(ex.UNFETTERED_ROPE_DART_EX.values.radiusMeters, 12);
assert.equal(ex.PHALANXBANE_BLADE_EX.values.triggerIntervalSeconds, 1.2);
assert.ok(GVG_EX_CATALOG.every((item) => item.cooldownFamily == null));
assert.equal(GVG_EX_COOLDOWN_RULE.familyAssignmentRequiresVerifiedBaseCooldown, true);

assert.ok(GUILD_TECHNIQUES.some((item) => item.id === "BREAKING_ARMY"));
assert.ok(GUILD_TECHNIQUES.some((item) => item.id === "TRIAL"));
assert.ok(GUILD_TECHNIQUES.some((item) => item.id === "GUARDING_QI_CORE"));
assert.equal(BAMBOOCUT_DUST_GVG.antiHeal.basePct, 45);
assert.equal(BAMBOOCUT_DUST_GVG.antiHeal.lv3Pct, 65);
assert.equal(BAMBOOCUT_DUST_GVG.unfetteredRadiusMeters.value, 12);
assert.equal(BAMBOOCUT_DUST_GVG.postDeathImmobilize.allowed, false);

const noDr = objectiveSensitivity({ objective: "BULWARK", baseHp: 1_000_000, teamDps: 25_000, nearbyPlayers: 15, drPerStack: null, league: "DIVINARCHE" });
assert.equal(noDr.killTimeSeconds, null); assert.equal(noDr.evidence, EVIDENCE_STATE.UNKNOWN);
const manualDr = objectiveSensitivity({ objective: "BULWARK", baseHp: 1_000_000, teamDps: 25_000, nearbyPlayers: 15, drPerStack: 0.01, league: "DIVINARCHE" });
assert.ok(manualDr.killTimeSeconds > 0); assert.equal(manualDr.evidence, EVIDENCE_STATE.MODELED); assert.ok(!("winProbability" in manualDr));

assert.equal(DOCTRINE_TEMPLATES.find((item) => item.id === "TOP100_EU_OLD_REFERENCE").evidence, EVIDENCE_STATE.OUTDATED);
assert.ok(P0_CLIENT_CAPTURE_CHECKLIST.length >= 7);
assert.ok(EVIDENCE_MATRIX.some((row) => row.id === "gvg-attunement" && row.evidence === EVIDENCE_STATE.UNKNOWN));
assert.ok(EVIDENCE_MATRIX.some((row) => row.id === "gvg-victory-order" && row.evidence === EVIDENCE_STATE.UNKNOWN));

for (const [path, mode] of [["Dreamwrought +20% non-player", "1V1_ARENA"], ["Perception Forest Rodent Hunt", "GUILD_WAR"]]) {
  if (path.startsWith("Dreamwrought")) assert.equal(effectAllowed(EFFECT_SCOPE.NON_PLAYER_ONLY, mode), false);
  else assert.equal(effectAllowed(EFFECT_SCOPE.PERCEPTION_FOREST_ONLY, mode), false);
}

for (const doc of ["docs/GLOBAL_ARENA_MODEL_V2.md", "docs/GLOBAL_GUILD_WAR_MODEL_V2.md", "docs/COMPETITIVE_MODE_EVIDENCE_MATRIX.md"]) {
  assert.equal(fs.existsSync(doc), true, `${doc} missing`);
}
const arenaDoc = fs.readFileSync("docs/GLOBAL_ARENA_MODEL_V2.md", "utf8");
assert.match(arenaDoc, /NEEDS CURRENT CLIENT DATA/); assert.match(arenaDoc, /PERCEPTION_FOREST/); assert.match(arenaDoc, /Level Adjustment/);
const gvgDoc = fs.readFileSync("docs/GLOBAL_GUILD_WAR_MODEL_V2.md", "utf8");
assert.match(gvgDoc, /Halftime/); assert.match(gvgDoc, /Fun Coins/); assert.match(gvgDoc, /Attunement.*UNKNOWN/is);

console.log(JSON.stringify({ ok: true, suite: "Competitive Modes V2", arenaModes: ARENA_MODE_IDS.length, evidenceRecords: EVIDENCE_MATRIX.length, arenaAttunements: ARENA_ATTUNEMENT_CATALOG.length, gvgExTechniques: GVG_EX_CATALOG.length, p0UnknownsGuarded: ["level-adjustment-stats","gvg-attunement","halftime-trigger","objective-dr-per-stack","command-cost-cd","victory-order"] }, null, 2));
