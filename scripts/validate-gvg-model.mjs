import assert from "node:assert/strict";
import {
  ARCHETYPES,
  EVIDENCE,
  EX_TECHNIQUES,
  GVG_ROLES,
  OFFICIAL_GVG,
  SCENARIOS,
  applyGuildWarQiDamage,
  canChangeOutpostOwnership,
  canResurrectSameTarget,
  compareBuildsByRole,
  createShareEnvelope,
  defaultWorkspace,
  getBamboocutDustProfile,
  leagueObjectiveMultiplier,
  migrateWorkspace,
  neutralBossWindow,
  proximitySensitivity,
  proximityStacks,
  redactPlayerNames,
  rosterDiagnostics,
  scoreRole,
  selectAttunementProfile,
  simulateObjective,
  validateRoster,
  validateShareEnvelope,
} from "../src/gvg/model.js";
import { consumeGvgStorageRecovery, loadGvgAssignmentsV2, loadGvgManualV2, loadGvgPhaseV2, saveGvgAssignmentsV2, saveGvgManualV2, saveGvgPhaseV2 } from "../src/competitive/storage-v2.mjs";

const technique = (id) => EX_TECHNIQUES.find((item) => item.id === id);
const memoryStorage = () => { const rows = new Map(); return { getItem: (key) => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, String(value)), rows }; };

const secondaryStorage = memoryStorage();
secondaryStorage.setItem("wwm_gvg_phase_v2", "BROKEN");
assert.equal(loadGvgPhaseV2(secondaryStorage), "PREPARATION");
assert.equal(secondaryStorage.getItem("wwm_gvg_phase_v2__recovery_backup_v1"), "BROKEN");
secondaryStorage.setItem("wwm_gvg_v2_assignments", "{");
assert.deepEqual(loadGvgAssignmentsV2(secondaryStorage), {});
assert.equal(secondaryStorage.getItem("wwm_gvg_v2_assignments__recovery_backup_v1"), "{");
secondaryStorage.setItem("wwm_gvg_v2_manual", JSON.stringify({ halftimeTrigger: 900 }));
assert.deepEqual(loadGvgManualV2(secondaryStorage), { halftimeTrigger: 900 });
assert.equal(saveGvgPhaseV2("OUTPOST_PHASE", secondaryStorage), "OUTPOST_PHASE");
assert.deepEqual(saveGvgAssignmentsV2({ BULWARK: "Main Ball", BAD: "drop" }, secondaryStorage), { BULWARK: "Main Ball" });
assert.deepEqual(saveGvgManualV2({ halftimeTrigger: 1200 }, secondaryStorage), { halftimeTrigger: 1200 });
assert.match(consumeGvgStorageRecovery(), /Guild War/);

// Scenario architecture is explicit and GvG remains separate from the PvE/Arena engines.
assert.deepEqual(SCENARIOS, ["PVE_BOSS", "ARENA", "GUILD_WAR"]);
assert.equal(new Set(SCENARIOS).size, 3);

// Current official Guild War mechanics.
assert.equal(OFFICIAL_GVG.outpostSpawnSeconds, 180);
assert.equal(OFFICIAL_GVG.outpostOwnershipLockSeconds, 60);
assert.equal(OFFICIAL_GVG.resurrectionSameTargetLockSeconds, 60);
assert.equal(OFFICIAL_GVG.bulwarkMaxProximityStacks, 15);
assert.equal(OFFICIAL_GVG.gooseMaxProximityStacks, 30);
assert.equal(OFFICIAL_GVG.qiDamageTakenMultiplier, 0.5);
assert.equal(applyGuildWarQiDamage(100), 50);
assert.equal(canChangeOutpostOwnership(180, 239), false);
assert.equal(canChangeOutpostOwnership(180, 240), true);
assert.equal(canResurrectSameTarget(100, 159), false);
assert.equal(canResurrectSameTarget(100, 160), true);
assert.equal(proximityStacks("BULWARK", 30), 15);
assert.equal(proximityStacks("GOOSE", 30), 30);
assert.equal(OFFICIAL_GVG.bulwarkDrPerStack, null);
assert.equal(OFFICIAL_GVG.gooseDrPerStack, null);
assert.equal(OFFICIAL_GVG.halftimeTime, null);
assert.equal(OFFICIAL_GVG.halftimeReward, null);
assert.equal(OFFICIAL_GVG.halftimeTimeEvidence, EVIDENCE.COMMUNITY_CONFLICTING);
assert.equal(OFFICIAL_GVG.halftimeRewardEvidence, EVIDENCE.COMMUNITY_CONFLICTING);
assert.equal(OFFICIAL_GVG.neutralBossSpawnJitterSeconds, 60);
assert.deepEqual(neutralBossWindow(900), { earliest: 840, latest: 960, evidence: EVIDENCE.CONFIRMED_OFFICIAL });
assert.equal(neutralBossWindow(null), null);

// Unknown DR must stay unknown until a user supplies a scenario parameter.
const unknownSensitivity = proximitySensitivity("BULWARK", null);
assert.deepEqual(unknownSensitivity.map((row) => row.nearbyPlayers), [5, 10, 20, 30]);
assert.ok(unknownSensitivity.every((row) => row.damageMultiplier === null && row.evidence === EVIDENCE.UNKNOWN));
const manualSensitivity = proximitySensitivity("BULWARK", 0.01);
assert.equal(manualSensitivity[3].stacks, 15);
assert.equal(manualSensitivity[3].damageMultiplier, 0.85);
assert.equal(manualSensitivity[3].evidence, EVIDENCE.MODELED);

// League objective scaling uses the exact official May table.
assert.equal(leagueObjectiveMultiplier("DIVINARCHE", "BULWARK").hpMultiplier, 0.75);
assert.equal(leagueObjectiveMultiplier("JESTING_HERO", "GOOSE").hpMultiplier, 0.5);
assert.equal(leagueObjectiveMultiplier("STEALTH_JESTER", "GOOSE").attackMultiplier, 0.25);
assert.equal(leagueObjectiveMultiplier("DIVINARCHE", "ZHANG_BAO").attackMultiplier, 1);

// Current Guild War EX values.
assert.equal(technique("nameless-sword").values.lv3AlliedQiRestore, 60);
assert.equal(technique("strategic-sword").values.bleedDetonationStacks, 5);
assert.equal(technique("heavenquaker-spear").values.storedUses, 2);
assert.equal(technique("stormbreaker-spear").values.selfDamageReductionPct, 75);
assert.equal(technique("vernal-umbrella").values.ballisticDamagePctPerStack, 10);
assert.equal(technique("vernal-umbrella").values.maxStacks, 5);
assert.equal(technique("mortal-rope-dart").values.immobilizeWindowSeconds, 8);
assert.equal(technique("soulshade-umbrella").values.alliedEndurancePerSecond, 20);
assert.equal(technique("everspring-umbrella").values.healingReductionPct, 45);
assert.equal(technique("everspring-umbrella").values.lv3HealingReductionPct, 65);
assert.equal(technique("unfettered-rope-dart").values.radiusMeters, 12);
assert.equal(technique("snowparting-blade").values.maxShieldedAllies, 5);
assert.equal(technique("phalanxbane-blade").values.triggerIntervalSeconds, 1.2);
assert.equal(technique("phalanxbane-blade").values.lv1Triggers, 10);
assert.equal(technique("phalanxbane-blade").values.lv3EnduranceDrain, 30);

// Normal and Arena attunement profiles are selected, never stacked.
const profiles = { normal: { id: "normal", attack: 10 }, arena: { id: "arena", survival: 20 } };
assert.deepEqual(selectAttunementProfile(profiles, "NORMAL"), profiles.normal);
assert.deepEqual(selectAttunementProfile(profiles, "ARENA"), profiles.arena);
assert.equal(selectAttunementProfile(profiles, "ARENA").attack, undefined);

// Role-specific ranking is intentionally non-universal.
const bamboocut = getBamboocutDustProfile(3);
assert.equal(bamboocut.antiHealPct, 65);
assert.equal(bamboocut.unfetteredRadiusMeters, 12);
assert.equal(bamboocut.dimensions.antiHeal, 100);
const healer = ARCHETYPES.find((item) => item.id === "silkbind-healer-reference");
assert.ok(scoreRole(bamboocut.dimensions, "ANTI_ESCORT").score > scoreRole(healer.dimensions, "ANTI_ESCORT").score);
assert.ok(scoreRole(healer.dimensions, "HEALER").score > scoreRole(bamboocut.dimensions, "HEALER").score);
const comparison = compareBuildsByRole(bamboocut, healer);
assert.equal(comparison.length, GVG_ROLES.length);
assert.ok(comparison.some((row) => row.winner === "A"));
assert.ok(comparison.some((row) => row.winner === "B"));

// Objective model is transparent and refuses fake precision when DR is unknown.
const unknownSim = simulateObjective({ objective: "BULWARK", objectiveHp: 1_000_000, teamObjectiveDps: 25_000, nearbyPlayers: 10, manualDrPerStack: null, league: "STANDARD" });
assert.equal(unknownSim.breakTimeSeconds, null);
assert.equal(unknownSim.winProbability, null);
assert.equal(unknownSim.drEvidence, EVIDENCE.UNKNOWN);
const manualSim = simulateObjective({ objective: "BULWARK", objectiveHp: 1_000_000, teamObjectiveDps: 25_000, nearbyPlayers: 10, manualDrPerStack: 0.01, league: "DIVINARCHE" });
assert.ok(manualSim.breakTimeSeconds > 0);
assert.equal(manualSim.winProbability, null);

// Roster max 30 and diagnostics.
const mkMember = (index) => ({ id: `p${index}`, name: `Player ${index}`, path: "Test", weapons: [], roles: index === 1 ? ["HEALER"] : ["MAIN_BALL"], availability: true });
const roster30 = Array.from({ length: 30 }, (_, index) => mkMember(index + 1));
assert.equal(validateRoster(roster30).valid, true);
assert.equal(validateRoster([...roster30, mkMember(31)]).valid, false);
assert.equal(rosterDiagnostics(roster30).healingCoverage, 1);

// Versioned sharing round-trip and privacy redaction.
const strategyPayload = { roster: roster30.slice(0, 2), strategy: { positions: { p1: { x: 10, y: 20 } }, arrows: [{ from: { x: 10, y: 20 }, to: { x: 50, y: 50 } }], notes: "Push mid" } };
const envelope = createShareEnvelope("STRATEGY", strategyPayload, { redactPlayerNames: true, createdAt: "2026-08-17T00:00:00.000Z" });
assert.equal(validateShareEnvelope(envelope).valid, true);
assert.equal(JSON.parse(JSON.stringify(envelope)).payload.strategy.notes, "Push mid");
assert.equal(envelope.payload.roster[0].name, "Player 01");
assert.equal(envelope.payload.roster[1].name, "Player 02");
const directRedaction = redactPlayerNames({ roster: [{ id: "a", name: "Alice", roles: ["HEALER"], path: "X" }, { id: "b", name: "Bob", roles: ["DUELIST"], path: "Y" }] });
assert.deepEqual(directRedaction.roster.map((member) => member.name), ["Player 01", "Player 02"]);

// Deterministic migration; legacy/reference input is not reinterpreted as combat data.
const legacy = { version: 0, legacyReference: "wwm_chars_v3" };
assert.deepEqual(migrateWorkspace(legacy), migrateWorkspace(legacy));
assert.equal(migrateWorkspace(legacy).scenario, "GUILD_WAR");
assert.equal(defaultWorkspace().scenario, "GUILD_WAR");

console.log(JSON.stringify({
  ok: true,
  tests: "Global Guild War model",
  scenarios: SCENARIOS,
  official: {
    outpostSpawnSeconds: OFFICIAL_GVG.outpostSpawnSeconds,
    outpostOwnershipLockSeconds: OFFICIAL_GVG.outpostOwnershipLockSeconds,
    resurrectionLockSeconds: OFFICIAL_GVG.resurrectionSameTargetLockSeconds,
    qiMultiplier: OFFICIAL_GVG.qiDamageTakenMultiplier,
    bulwarkCap: OFFICIAL_GVG.bulwarkMaxProximityStacks,
    gooseCap: OFFICIAL_GVG.gooseMaxProximityStacks,
  },
  exTechniques: EX_TECHNIQUES.length,
  shareVersion: envelope.version,
  rosterMaxValidated: 30,
}, null, 2));
