export const COMPETITIVE_PATCH = "Global 2.0 / reviewed 2026-08-18";

export const EVIDENCE_STATE = Object.freeze({
  CONFIRMED_CLIENT: "CONFIRMED_CLIENT",
  CONFIRMED_OFFICIAL: "CONFIRMED_OFFICIAL",
  OFFICIAL_BUT_SCOPE_UNRESOLVED: "OFFICIAL_BUT_SCOPE_UNRESOLVED",
  COMMUNITY_CORROBORATED: "COMMUNITY_CORROBORATED",
  COMMUNITY_CONFLICTING: "COMMUNITY_CONFLICTING",
  MODELED: "MODELED",
  UNKNOWN: "UNKNOWN",
  OUTDATED: "OUTDATED",
  REJECTED_FOR_CURRENT_GLOBAL: "REJECTED_FOR_CURRENT_GLOBAL",
});

export const IMPLEMENTATION_STATE = Object.freeze({
  ENCODED: "ENCODED",
  GUARDED_UNKNOWN: "GUARDED_UNKNOWN",
  DISPLAY_ONLY: "DISPLAY_ONLY",
  HISTORICAL_ONLY: "HISTORICAL_ONLY",
});

export const EFFECT_SCOPE = Object.freeze({
  PVE_ONLY: "PVE_ONLY",
  NON_PLAYER_ONLY: "NON_PLAYER_ONLY",
  ARENA_ONLY: "ARENA_ONLY",
  PERCEPTION_FOREST_ONLY: "PERCEPTION_FOREST_ONLY",
  GVG_ONLY: "GVG_ONLY",
  PLAYER_TARGET: "PLAYER_TARGET",
  ALL_MODES: "ALL_MODES",
});

export const ARENA_MODE_IDS = Object.freeze([
  "1V1_ARENA",
  "3V3_ARENA",
  "GROUP_STRATEGY",
  "5V5_ARENA",
  "PERCEPTION_FOREST",
  "TRAINING_TERRACE",
]);

export const BATTLEGROUPS = Object.freeze([
  { id: "YOUGU", servers: "US East", timezone: "UTC-4 for current published GW schedule", evidence: EVIDENCE_STATE.CONFIRMED_OFFICIAL },
  { id: "LINHE", servers: "US West", timezone: "UTC-7 for current published GW schedule", evidence: EVIDENCE_STATE.CONFIRMED_OFFICIAL },
  { id: "YUNYA", servers: "Europe", timezone: "UTC+2 for current published GW schedule", evidence: EVIDENCE_STATE.CONFIRMED_OFFICIAL },
  { id: "CANGLANG", servers: "Asia + HK/MO/TW", timezone: "UTC+8 for current published GW schedule", evidence: EVIDENCE_STATE.CONFIRMED_OFFICIAL },
  { id: "JIANGZHU", servers: "Southeast Asia", timezone: "UTC+8 for current published GW schedule", evidence: EVIDENCE_STATE.CONFIRMED_OFFICIAL },
]);

const UNKNOWN = EVIDENCE_STATE.UNKNOWN;
const OFFICIAL = EVIDENCE_STATE.CONFIRMED_OFFICIAL;
const UNRESOLVED = EVIDENCE_STATE.OFFICIAL_BUT_SCOPE_UNRESOLVED;

export const ARENA_MODE_RULES = Object.freeze({
  "1V1_ARENA": {
    id: "1V1_ARENA", label: "1v1", players: "1v1", team: false,
    ranked: OFFICIAL, levelAdjustment: UNKNOWN,
    schedule: "24/7", scheduleEvidence: OFFICIAL,
    battlegroup: true, crossServer: true,
    revive: "No published special revive branch in the current sources reviewed.",
    environment: "Standard Arena",
    attunement: UNRESOLVED,
  },
  "3V3_ARENA": {
    id: "3V3_ARENA", label: "3v3", players: "3v3", team: true,
    ranked: OFFICIAL, levelAdjustment: OFFICIAL,
    schedule: "Mon/Wed/Fri/Sun 15:00–02:00 battlegroup local time; in-game schedule is authoritative", scheduleEvidence: OFFICIAL,
    battlegroup: true, crossServer: true,
    revive: "Branch on healer presence; same Martial Art max 2 per team.",
    environment: "Level Adjustment Arena",
    attunement: OFFICIAL,
  },
  "GROUP_STRATEGY": {
    id: "GROUP_STRATEGY", label: "Group Strategy", players: "team", team: true,
    ranked: UNKNOWN, levelAdjustment: OFFICIAL,
    schedule: "Daily 12:00–02:00 battlegroup local time; in-game schedule is authoritative", scheduleEvidence: OFFICIAL,
    battlegroup: true, crossServer: true,
    revive: "Use current client data; do not inherit 3v3 revive rules.",
    environment: "Level Adjustment team mode",
    attunement: UNRESOLVED,
  },
  "5V5_ARENA": {
    id: "5V5_ARENA", label: "5v5 Arena", players: "5v5", team: true,
    ranked: UNKNOWN, levelAdjustment: UNKNOWN,
    schedule: "NEEDS CURRENT CLIENT DATA", scheduleEvidence: UNKNOWN,
    battlegroup: true, crossServer: UNRESOLVED,
    revive: "NEEDS CURRENT CLIENT DATA",
    environment: "Dedicated 5v5 calibration environment exists on Healing Dummy; live queue rules not fully published in reviewed sources.",
    attunement: UNKNOWN,
  },
  "PERCEPTION_FOREST": {
    id: "PERCEPTION_FOREST", label: "Perception Forest", players: "special mode", team: "Solo/Duo references exist",
    ranked: OFFICIAL, levelAdjustment: UNKNOWN,
    schedule: "NEEDS CURRENT CLIENT DATA", scheduleEvidence: UNKNOWN,
    battlegroup: false, crossServer: UNKNOWN,
    revive: "Mode-specific; do not inherit standard Arena rules.",
    environment: "Poison zone + event bosses + Duel Arena + mode skills/items",
    attunement: UNKNOWN,
  },
  "TRAINING_TERRACE": {
    id: "TRAINING_TERRACE", label: "Training Terrace", players: "training", team: false,
    ranked: false, levelAdjustment: UNRESOLVED,
    schedule: "Always-on training surface where available", scheduleEvidence: UNRESOLVED,
    battlegroup: false, crossServer: false,
    revive: "Training semantics only.",
    environment: "Calibration / Preliminary test environment; not ranked Arena truth by default.",
    attunement: UNRESOLVED,
  },
});

export const LEVEL_ADJUSTMENT_FIELDS = Object.freeze([
  "characterLevel", "martialArtBreakthrough", "gearTier", "gearBaseAttributes", "gearAdditionalAttributes",
  "retunedAttributes", "sets", "normalAttunement", "arenaAttunement", "innerWays", "innerWayTiers",
  "mysticSkills", "mysticBranches", "food", "buffScripts", "hp", "physicalAttack", "precision", "crit",
  "affinity", "penetration", "playerTargetBoost",
]);

function unknownFieldMap() {
  return Object.fromEntries(LEVEL_ADJUSTMENT_FIELDS.map((field) => [field, { evidence: UNKNOWN, applies: null }]));
}

export const LEVEL_ADJUSTMENT = Object.freeze({
  "3V3_ARENA": {
    mode: "3V3_ARENA", evidence: OFFICIAL,
    fields: { ...unknownFieldMap(), mysticBranches: { evidence: OFFICIAL, applies: true, note: "Custom Mystic branch trial is explicitly supported in Level Adjustment modes." } },
  },
  "GROUP_STRATEGY": {
    mode: "GROUP_STRATEGY", evidence: OFFICIAL,
    fields: { ...unknownFieldMap(), mysticBranches: { evidence: OFFICIAL, applies: true, note: "Custom Mystic branch trial is explicitly supported in Level Adjustment modes." } },
  },
});

export const ATTUNEMENT_APPLICABILITY = Object.freeze({
  PVE: { normal: OFFICIAL, arena: EVIDENCE_STATE.REJECTED_FOR_CURRENT_GLOBAL, stacking: false },
  "1V1_ARENA": { normal: UNKNOWN, arena: UNRESOLVED, stacking: false },
  "3V3_ARENA": { normal: UNKNOWN, arena: OFFICIAL, stacking: false },
  "GROUP_STRATEGY": { normal: UNKNOWN, arena: UNRESOLVED, stacking: false },
  "5V5_ARENA": { normal: UNKNOWN, arena: UNKNOWN, stacking: false },
  "PERCEPTION_FOREST": { normal: UNKNOWN, arena: UNKNOWN, stacking: false },
  GUILD_WAR: { normal: UNKNOWN, arena: UNKNOWN, stacking: false },
});

export function canOptimizeNumericStats(mode) {
  const adjusted = LEVEL_ADJUSTMENT[mode];
  if (!adjusted) return { allowed: false, reason: "Stat applicability is not established for this mode.", unknownFields: LEVEL_ADJUSTMENT_FIELDS };
  const unknownFields = Object.entries(adjusted.fields).filter(([, value]) => value.evidence === UNKNOWN).map(([key]) => key);
  return unknownFields.length
    ? { allowed: false, reason: "NEEDS CURRENT CLIENT DATA: normalized/stat applicability is unresolved.", unknownFields }
    : { allowed: true, reason: "All numeric stat inputs have established applicability.", unknownFields: [] };
}

export function attunementDecision(mode) {
  const row = ATTUNEMENT_APPLICABILITY[mode] ?? { normal: UNKNOWN, arena: UNKNOWN, stacking: false };
  const resolved = [row.normal, row.arena].every((value) => ![UNKNOWN, UNRESOLVED].includes(value));
  return { ...row, resolved, recommendationAllowed: resolved };
}

export function validate3v3Rules({ healer = false, sameMartialArtCount = 0, royalRemedyT6 = false } = {}) {
  const violations = sameMartialArtCount > 2 ? ["Same Martial Art may appear at most twice per 3v3 team."] : [];
  if (!healer) return {
    valid: violations.length === 0, violations,
    branch: "NO_HEALER", reviveOpportunities: 1, reviveRangeMeters: 10, reviveWindowSeconds: 15,
    successfulReviveBuff: "Temporary Physical Attack buff; exact magnitude/duration not published in reviewed official notes.",
  };
  return {
    valid: violations.length === 0, violations,
    branch: "WITH_HEALER", panaceaResurrection: "Same target restricted by the current 3v3 healer branch.",
    royalRemedyT6Exception: royalRemedyT6,
  };
}

export const COMBAT_STATES = Object.freeze([
  "NEUTRAL", "HIT_STAGGER", "CONTROLLED", "IMMOBILIZED", "AIRBORNE", "KNOCKBACK", "KNOCKDOWN",
  "TENACITY", "SUPER_ARMOR", "CONTROL_IMMUNITY", "INVINCIBILITY", "DEFENSE", "DEFLECT",
  "CONTINUOUS_DEFLECT", "PERFECT_DODGE", "DODGE_IFRAME", "SPRINT", "DASH", "BREAK_DEFENSE",
  "EXECUTION", "EXECUTED_KNOCKDOWN", "GET_UP_PROTECTION", "PASSIVE_BREAK_CONTROL", "GUARDING_QI_CORE",
]);

export function createArenaCombatState(overrides = {}) {
  return {
    t: 0, state: "NEUTRAL", tags: [], hp: 100, qi: 100, endurance: 100, vitality: 100,
    pathResource: 0, mysticCooldowns: {}, breakControlProgress: 0, breakControlFrozen: false,
    qiDamageImmune: false, invincibleUntil: 0, log: [], ...overrides,
  };
}

function logState(state, type, note) {
  return { ...state, log: [...state.log, { t: state.t, type, note }] };
}

export function applyCombatEvent(input, event) {
  let s = { ...input, tags: [...input.tags], mysticCooldowns: { ...input.mysticCooldowns }, log: [...input.log] };
  if (Number.isFinite(event.t)) s.t = Math.max(s.t, Number(event.t));
  switch (event.type) {
    case "HIT_STAGGER": s.state = "HIT_STAGGER"; return logState(s, event.type, "Hit Stagger is distinct from controlled/immobilized.");
    case "CONTROLLED": s.state = "CONTROLLED"; return logState(s, event.type, "Controlled state entered.");
    case "IMMOBILIZED": s.state = "IMMOBILIZED"; return logState(s, event.type, "Immobilized is not generic control immunity state.");
    case "AIRBORNE": s.state = "AIRBORNE"; return logState(s, event.type, "Airborne state entered.");
    case "KNOCKBACK": s.state = "KNOCKBACK"; return logState(s, event.type, "Knockback state entered.");
    case "DEFLECT": s.state = event.continuous ? "CONTINUOUS_DEFLECT" : "DEFLECT"; return logState(s, event.type, "Deflect state; Qi effects resolve separately.");
    case "PERFECT_DODGE": s.state = "PERFECT_DODGE"; return logState(s, event.type, "Perfect Dodge event.");
    case "DODGE_IFRAME": s.state = "DODGE_IFRAME"; s.invincibleUntil = Math.max(s.invincibleUntil, s.t + Math.max(0, Number(event.duration || 0))); return logState(s, event.type, "Dodge invulnerability timing is an event input unless client-measured.");
    case "EXECUTION": s.state = "EXECUTION"; return logState(s, event.type, "Execute hit and Execute knockdown are separate events.");
    case "EXECUTED_KNOCKDOWN": s.state = "EXECUTED_KNOCKDOWN"; s.qiDamageImmune = true; s.breakControlFrozen = true; return logState(s, event.type, "Qi Damage immunity during applicable Execute knockdown; Break Control progression freezes briefly.");
    case "QI_DAMAGE": if (!s.qiDamageImmune) s.qi = Math.max(0, s.qi - Math.max(0, Number(event.amount || 0))); return logState(s, event.type, s.qiDamageImmune ? "Qi Damage ignored during applicable Execute knockdown." : "Qi Damage applied.");
    case "GET_UP": s.state = "GET_UP_PROTECTION"; s.qiDamageImmune = false; s.tags = [...new Set([...s.tags, "TENACITY", "CONTROL_IMMUNITY", "SUPER_ARMOR"])]; return logState(s, event.type, "Get-up protection has distinct Tenacity, Control Immunity and Super Armor flags; duration is not fabricated.");
    case "GUARDING_QI_CORE": {
      const inHitState = ["HIT_STAGGER", "CONTROLLED", "IMMOBILIZED", "AIRBORNE", "KNOCKBACK", "KNOCKDOWN"].includes(s.state);
      s.hp = Math.min(100, s.hp + Math.max(0, Number(event.hpRestore || 0)));
      s.qi = Math.min(100, s.qi + Math.max(0, Number(event.qiRestore || 0)));
      if (inHitState) s.tags = s.tags.filter((tag) => !["CONTROLLED", "IMMOBILIZED"].includes(tag));
      s.state = "INVINCIBILITY";
      s.invincibleUntil = Math.max(s.invincibleUntil, s.t + 0.5);
      if (event.inescapableHitStaggerUntil && Number(event.inescapableHitStaggerUntil) > s.invincibleUntil) s.invincibleUntil = Number(event.inescapableHitStaggerUntil);
      return logState(s, event.type, inHitState ? "Restore HP/Qi, qualifying control clear, 0.5s Invincibility; inescapable Hit Stagger can extend protection through that state." : "Restore HP/Qi + 0.5s Invincibility; inherent control-clear does not trigger outside Hit Stagger state.");
    }
    case "BREAK_CONTROL_PROGRESS":
      if (!s.breakControlFrozen) s.breakControlProgress = Math.max(0, Math.min(100, s.breakControlProgress + Number(event.delta || 0)));
      s.state = "PASSIVE_BREAK_CONTROL";
      return logState(s, event.type, "Progress uses observed/event deltas only; exact fill duration remains UNKNOWN.");
    case "BREAK_CONTROL_UNFREEZE": s.breakControlFrozen = false; return logState(s, event.type, "Break Control progression can resume after the temporary freeze.");
    case "SERENE_BREEZE": s.tags = [...new Set([...s.tags, "SUPER_ARMOR"])]; return logState(s, event.type, "Current V2 interaction grants brief Super Armor; it is not modeled as Tenacity + Control Immunity.");
    default: return logState(s, event.type || "UNKNOWN_EVENT", "No fabricated numeric effect was applied.");
  }
}

export function clampEnduranceReduction(percent) {
  const n = Number(percent);
  return Math.max(0, Math.min(40, Number.isFinite(n) ? n : 0));
}

export function enduranceRule(event) {
  if (event === "CONTINUOUS_SPRINT") return { thresholdSeconds: 1, rule: "Increased consumption after >1s continuous Sprint", exactCoefficient: null, evidence: OFFICIAL };
  if (event === "BOW_CHARGE") return { thresholdSeconds: 1.2, rule: "Charge >1.2s consumes Endurance; charge progress stops at 0 Endurance", exactCoefficient: null, evidence: OFFICIAL };
  if (event === "DEFENSE_RECOVERY") return { rule: "Current Arena adjustment reduced the Defense recovery penalty", exactCoefficient: null, evidence: OFFICIAL };
  return { rule: "Skill-specific charge consumption must be supplied by current evidence", exactCoefficient: null, evidence: UNKNOWN };
}

export const NETWORK_RESOLUTION = Object.freeze({
  reverseHitValidation: true,
  semantics: "Server validates defender dodge invulnerability before resolving a hit; use this as reliability/state-resolution metadata only.",
  latencyDamageCoefficient: null,
  attackerLatency: "metadata only",
  defenderLatency: "metadata only",
  hostServer: "metadata only",
  evidence: OFFICIAL,
});

export const ARENA_ATTUNEMENT_CATALOG = Object.freeze([
  { id: "chest-martial-origin-dr", slot: "Chestpiece", rarity: "Epic/Gold", path: "ALL", martialArt: null, effect: "Damage reduction against Martial-Art-origin damage in current stagger/control scope", trigger: "Hit Stagger or controlled", duration: null, cooldown: null, stacks: null, cap: null, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "2.0", evidence: OFFICIAL },
  { id: "bracer-deflect-qi-gold", slot: "Bracer", rarity: "Gold", path: "ALL", martialArt: null, effect: "Consecutive Deflect Qi Damage progression", trigger: "Successful consecutive Deflects", duration: null, cooldown: null, stacks: [25,30,35,40], cap: 40, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "1.7+", evidence: OFFICIAL },
  { id: "weapon-execute-vitality", slot: "Weapon", rarity: "Epic/Gold", path: "ALL", martialArt: null, effect: "Execution restores 20 Vitality; healing chain +2 Vitality up to 5; Gold +20% Mystic DMG window", trigger: "Execution", duration: 8, cooldown: null, stacks: 5, cap: null, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "1.7+", evidence: OFFICIAL },
  { id: "weapon-defense-counter-qi", slot: "Weapon", rarity: "Epic/Gold", path: "ALL", martialArt: null, effect: "Direct Damage to a staggered/controlled marked target deals extra Qi Damage", trigger: "Defense Counter hit then qualifying Direct Damage", duration: 6, cooldown: null, stacks: 4, cap: 4, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "1.7+", evidence: OFFICIAL },
  { id: "disc-stonesplit-might", slot: "Disc", rarity: "Epic/Gold", path: "Stonesplit-Might", martialArt: "Thunder Shock", effect: "Predator Shield interaction; Aug 2 current trigger fix for successful hit/control and 2s Super Armor", trigger: "Current Stonesplit trigger", duration: 2, cooldown: null, stacks: null, cap: null, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "2.0 / Aug 2", evidence: OFFICIAL },
  { id: "disc-bellstrike-splendor", slot: "Disc", rarity: "Epic/Gold", path: "Bellstrike-Splendor", martialArt: "Qiankun's Lock", effect: "Refund 4s Break Control cooldown; combined reductions cap 4s", trigger: "Qiankun's Lock hit", duration: null, cooldown: null, stacks: null, cap: 4, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "1.7+", evidence: OFFICIAL },
  { id: "pendant-bamboocut-wind", slot: "Pendant", rarity: "Epic/Gold", path: "Bamboocut-Wind", martialArt: "Dual Blades Light Attack", effect: "Epic Vulnerability +2% per stack, max 3", trigger: "Specified Light Attack hit", duration: null, cooldown: null, stacks: 3, cap: 3, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "1.7+", evidence: OFFICIAL },
  { id: "weapon-bamboocut-dust-scarlet", slot: "Weapon", rarity: "Epic/Gold", path: "Bamboocut-Dust", martialArt: "Scarlet Spin", effect: "Attunement trigger requires actually causing Hit Stagger/Control", trigger: "Successful Hit Stagger/Control", duration: null, cooldown: null, stacks: null, cap: null, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "2.0", evidence: OFFICIAL },
  { id: "peak-springless-silence", slot: "Path effect", rarity: "Epic/Gold", path: "supported path", martialArt: null, effect: "Successful Hit Stagger/Control → target DMG taken +12% 5s; Gold additionally self Tenacity 2s", trigger: "Successful Hit Stagger/Control", duration: 5, cooldown: null, stacks: null, cap: null, scope: EFFECT_SCOPE.ARENA_ONLY, patch: "1.7+", evidence: OFFICIAL },
]);

export const PATH_COMPETITIVE_PROFILES = Object.freeze({
  "Bamboocut-Dust": { weapons: ["Everspring Umbrella", "Unfettered Rope Dart"], range: "mixed/ranged control", mobility: ["Umbrella repositioning", "Rope Dart pursuit"], stagger: ["Scarlet Spin current stagger/tracking"], control: ["Soul/rope control tools"], tenacity: ["Piercing Dart after 0.5s", "retained briefly after cast where current-compatible"], superArmor: ["Serene Breeze current V2 interaction"], breakDefense: ["Burn and Bury unblockable"], qiPressure: ["control/execute conversion; no fake coefficient"], healing: ["Everspring utility; exact Arena coefficients not inferred"], shielding: [], antiHeal: [], dot: ["Soul Loss pressure"], burst: ["Soulbreak/Soul Return windows"], escape: ["reposition/reset tools"], resourceEconomy: ["Fading Crimson initial resource where applicable"], arenaTalents: ["Scarlet Spin trigger requires actual stagger/control"], mysticSynergies: ["Serene Breeze"], counters: ["golden warning on Burn and Bury", "charge windows are punishable"], evidence: OFFICIAL },
  "Stonesplit-Might": { weapons: ["Thundercry Blade", "Stormbreaker Spear"], range: "frontline", mobility: [], stagger: ["Thunder Shock"], control: [], tenacity: [], superArmor: ["current Arena trigger can grant 2s Super Armor"], breakDefense: [], qiPressure: [], healing: [], shielding: ["Predator Shield"], antiHeal: [], dot: [], burst: [], escape: [], resourceEconomy: [], arenaTalents: ["Disc trigger fixed Aug 2"], mysticSynergies: [], counters: [], evidence: OFFICIAL },
  "Bellstrike-Splendor": { weapons: ["Nameless Sword", "Nameless Spear"], range: "mixed", mobility: [], stagger: [], control: ["Qiankun's Lock interaction"], tenacity: [], superArmor: [], breakDefense: [], qiPressure: ["Break Control cooldown interaction"], healing: [], shielding: [], antiHeal: [], dot: [], burst: [], escape: [], resourceEconomy: [], arenaTalents: ["Disc cooldown refund"], mysticSynergies: [], counters: [], evidence: OFFICIAL },
  "Bamboocut-Wind": { weapons: ["Infernal Twinblades", "Mortal Rope Dart"], range: "melee/pursuit", mobility: ["pursuit"], stagger: [], control: [], tenacity: [], superArmor: [], breakDefense: [], qiPressure: [], healing: [], shielding: [], antiHeal: [], dot: [], burst: ["player burst profile remains matchup-sensitive"], escape: [], resourceEconomy: [], arenaTalents: ["Pendant Vulnerability max 3"], mysticSynergies: [], counters: [], evidence: OFFICIAL },
});

export const BAMBOOCUT_DUST_ARENA = Object.freeze({
  cycloneWaltz: { recast: "Current V2 recast immediately applies one damage instance", evidence: OFFICIAL },
  scarletSpin: { staggerImproved: true, trackingImproved: true, perfectCatchDistinct: true, attunementRequiresStaggerOrControl: true, evidence: OFFICIAL },
  phantomRally: { resonanceMustNotInterruptTenacity: true, evidence: OFFICIAL },
  fadingCrimson: { initialResource: "full where current Arena rule applies", evidence: OFFICIAL },
  piercingDart: { chargingStance: true, tenacityStartsAfterSeconds: 0.5, retainsTenacityBrieflyPostCast: true, evidence: OFFICIAL },
  soulSweep: { cancelEarlier: true, evidence: OFFICIAL },
  burnAndBury: { unblockable: true, warning: "golden flash", evidence: OFFICIAL },
  soulLoss: { currentStacking: true, evidence: OFFICIAL },
  soulbreakSoulReturn: { cooldownSeconds: 21, evidence: OFFICIAL },
  pveLeakRejected: { dreamwroughtNonPlayerBonusPct: 20, scope: EFFECT_SCOPE.NON_PLAYER_ONLY, allowedInArena: false, allowedInGvg: false },
});

export const PERCEPTION_FOREST = Object.freeze({
  poisonZone: { active: true, damageGrowsOverTime: true, exactCurve: null, evidence: OFFICIAL },
  eventBosses: { active: true, evidence: OFFICIAL },
  duelArena: { active: true, evidence: OFFICIAL },
  returnInvincibility: { active: true, endsWhenLandingHit: true, evidence: OFFICIAL },
  specialSkillsItems: { active: true, evidence: OFFICIAL },
  blazingBow: { explosionCooldownSeconds: 3, evidence: OFFICIAL },
  rodentHunt: { durationSeconds: 10, healingReceivedReductionPct: 50, settlementPctDamageTaken: 30, oneActivePerTarget: true, scope: EFFECT_SCOPE.PERCEPTION_FOREST_ONLY, evidence: OFFICIAL },
  isolation: ["1V1_ARENA", "3V3_ARENA", "GROUP_STRATEGY", "5V5_ARENA", "GUILD_WAR", "PVE"],
});

export function matchupAnalysis({ myPath, opponentPath, mode }) {
  const mine = PATH_COMPETITIVE_PROFILES[myPath];
  const theirs = PATH_COMPETITIVE_PROFILES[opponentPath];
  if (!mine || !theirs) return {
    mode, advantages: [], risks: [], keyInteractions: [], punishWindows: [], defensiveAnswers: [], unknowns: ["One or both paths lack a current evidence-backed competitive profile."], confidence: UNKNOWN,
  };
  return {
    mode,
    advantages: [...mine.mobility, ...mine.breakDefense].slice(0, 4),
    risks: [...theirs.burst, ...theirs.stagger, ...theirs.control].slice(0, 4),
    keyInteractions: [`${myPath}: ${mine.range}`, `${opponentPath}: ${theirs.range}`, ...mine.tenacity, ...mine.superArmor].slice(0, 6),
    punishWindows: [...(mine.counters || []), ...(theirs.counters || [])].slice(0, 4),
    defensiveAnswers: [...mine.shielding, ...mine.escape, ...mine.tenacity, ...mine.superArmor].slice(0, 5),
    unknowns: ["Player skill, exact animation timing, current client stat normalization and unpublished coefficients remain outside this model."],
    confidence: mine.evidence === OFFICIAL && theirs.evidence === OFFICIAL ? OFFICIAL : EVIDENCE_STATE.MODELED,
  };
}

export const GVG_PHASES = Object.freeze([
  { id: "PREPARATION", fixedStart: null, evidence: UNKNOWN },
  { id: "OPENING", fixedStart: null, evidence: UNKNOWN },
  { id: "LANE_RESOURCE_CONTROL", fixedStart: null, evidence: UNKNOWN },
  { id: "OUTPOST_PHASE", fixedStart: 180, evidence: OFFICIAL },
  { id: "HALFTIME", fixedStart: null, evidence: EVIDENCE_STATE.COMMUNITY_CONFLICTING },
  { id: "BULWARK_PRESSURE", fixedStart: null, evidence: UNKNOWN },
  { id: "GOOSE_PRESSURE", fixedStart: null, evidence: UNKNOWN },
  { id: "FORTUNE_TREE_ESCORT", fixedStart: null, evidence: UNKNOWN },
  { id: "ENDGAME", fixedStart: null, evidence: UNKNOWN },
]);

export const GVG_OFFICIAL_RULES = Object.freeze({
  rosterCapacity: { value: 30, evidence: OFFICIAL },
  schedule: { value: "Sat/Sun 20:30 battlegroup local published schedule; current in-game schedule authoritative", evidence: OFFICIAL },
  outposts: { count: 2, names: ["TOP", "BOTTOM"], spawnSeconds: 180, reviveOption: true, ownershipLockSeconds: 60, evidence: OFFICIAL },
  panaceaSameTargetLockSeconds: { value: 60, evidence: OFFICIAL },
  bulwark: { proximityStackCap: 15, drPerStack: null, breakingBulwarkReducesEnemyGooseAttributes: true, evidence: OFFICIAL },
  goose: { proximityStackCap: 30, drPerStack: null, evidence: OFFICIAL },
  qiDamageReceivedMultiplier: { value: 0.5, evidence: OFFICIAL },
  fortuneTree: { interceptionSlowdownReduced: true, ignoreInterceptionBreachesWindWall: true, evidence: OFFICIAL },
  jungle: { neutralMobsPerCamp: 1, higherAttributes: true, reward: "Fun Coins", evidence: OFFICIAL },
  neutralBosses: { names: ["Zhang Bao", "Zhuxie Gule"], randomSpawnJitterSeconds: 60, baseTimes: null, evidence: OFFICIAL },
  commandSkills: { exactCosts: null, exactCooldowns: null, quickOperationDoesNotInterruptCombat: true, evidence: OFFICIAL },
  halftime: { triggerSeconds: null, initialDamageBonusPct: 0, stepPct: 30, stepSeconds: 30, participants: null, duelStructure: null, winnerEffect: null, duration: null, evidence: OFFICIAL },
  victory: { exactCurrentOrdering: null, evidence: UNKNOWN },
  duration: { totalSeconds: null, preparationSeconds: null, evidence: EVIDENCE_STATE.COMMUNITY_CORROBORATED },
  buildSwapping: { outOfCombat: null, evidence: EVIDENCE_STATE.COMMUNITY_CORROBORATED },
});

export function halftimeDamageBonus(secondsSinceEntry) {
  const seconds = Math.max(0, Number(secondsSinceEntry || 0));
  return Math.floor(seconds / 30) * 30;
}

export const GVG_LEAGUE_SCALING = Object.freeze({
  DIVINARCHE: { objectiveHpMultiplier: 0.75, neutralHpMultiplier: 0.75, objectiveAttackMultiplier: 0.75, neutralAttackMultiplier: 1, evidence: OFFICIAL },
  JESTING_HERO: { objectiveHpMultiplier: 0.50, neutralHpMultiplier: 0.50, objectiveAttackMultiplier: 0.50, neutralAttackMultiplier: 1, evidence: OFFICIAL },
  STEALTH_JESTER: { objectiveHpMultiplier: 0.25, neutralHpMultiplier: 0.25, objectiveAttackMultiplier: 0.25, neutralAttackMultiplier: 1, evidence: OFFICIAL },
});

export const COMMAND_CATALOG = Object.freeze([
  { id: "QUICK_OPERATION", name: "Quick Operation", effect: "Can be used without interrupting combat under current official Guild War optimization", cost: null, cooldown: null, target: "commander operation", duration: null, evidence: OFFICIAL },
]);

export const GUILD_TECHNIQUES = Object.freeze([
  { id: "BREAKING_ARMY", name: "Breaking Army", effect: "Current competitive Guild Technique; exact owned-guild values must come from client", values: null, evidence: UNRESOLVED },
  { id: "TRIAL", name: "Trial", effect: "Current competitive Guild Technique; trigger interval is exposed in current UI where applicable", values: null, evidence: UNRESOLVED },
  { id: "GUARDING_QI_CORE", name: "Guarding Qi Core-related Guild Technique", effect: "Current Guild Technique UI exposes trigger interval where applicable", values: null, evidence: UNRESOLVED },
  { id: "ATTRIBUTE_ATTACK", name: "Attribute Attack Bonus", effect: "Current official note says applicable Guild Techniques can apply to Formless Attacks", values: null, evidence: OFFICIAL },
]);

export const GVG_EX_CATALOG = Object.freeze([
  { id: "NAMELESS_SWORD_EX", name: "Nameless Sword EX", cooldownFamily: null, values: { lv3AlliedQiRestore: 60 }, effect: "Lv3 allied Qi restore 60", range: null, duration: null, targetCap: null, tags: ["QI_SUPPORT"], evidence: OFFICIAL },
  { id: "STRATEGIC_SWORD_EX", name: "Strategic Sword EX", cooldownFamily: null, values: { bleedDetonationStacks: 5 }, effect: "Expanded Sword Horizon; sword energy can detonate 5 Bleeding into High Bleeding; dash cannot be blocked", range: null, duration: null, targetCap: null, tags: ["PRESSURE", "UNBLOCKABLE_DASH"], evidence: OFFICIAL },
  { id: "HEAVENQUAKER_SPEAR_EX", name: "Heavenquaker Spear EX", cooldownFamily: null, values: { storedUses: 2 }, effect: "Accumulates 2 uses and can cause Airborne", range: null, duration: null, targetCap: null, tags: ["AIRBORNE", "CONTROL"], evidence: OFFICIAL },
  { id: "STORMBREAKER_SPEAR_EX", name: "Stormbreaker Spear EX", cooldownFamily: null, values: { selfDamageReductionPct: 75 }, effect: "Self damage reduction 75%", range: null, duration: null, targetCap: null, tags: ["FRONTLINE"], evidence: OFFICIAL },
  { id: "VERNAL_UMBRELLA_EX", name: "Vernal Umbrella EX", cooldownFamily: null, values: { ballisticDamagePctPerStack: 10, maxStacks: 5 }, effect: "Build Momentum: +10% Ballistic Damage per stack, max 5", range: null, duration: null, targetCap: null, tags: ["BACKLINE_DPS"], evidence: OFFICIAL },
  { id: "MORTAL_ROPE_DART_EX", name: "Mortal Rope Dart EX", cooldownFamily: null, values: { immobilizeWindowSeconds: 8 }, effect: "For the next 8s, Rodents briefly Immobilize", range: null, duration: 8, targetCap: null, tags: ["CONTROL"], evidence: OFFICIAL },
  { id: "SOULSHADE_UMBRELLA_EX", name: "Soulshade Umbrella EX", cooldownFamily: null, values: { alliedEndurancePerSecond: 20 }, effect: "Allied Endurance recovery 20/s", range: null, duration: null, targetCap: null, tags: ["SUPPORT", "ENDURANCE"], evidence: OFFICIAL },
  { id: "EVERSPRING_UMBRELLA_EX", name: "Everspring Umbrella EX", cooldownFamily: null, values: { healingReductionPct: 45, lv3HealingReductionPct: 65 }, effect: "Healing Reduction area 45%; Lv3 65%", range: null, duration: null, targetCap: null, tags: ["ANTI_HEAL", "ZONE"], evidence: OFFICIAL },
  { id: "UNFETTERED_ROPE_DART_EX", name: "Unfettered Rope Dart EX", cooldownFamily: null, values: { radiusMeters: 12 }, effect: "Hit radius 12m", range: 12, duration: null, targetCap: null, tags: ["ZONE", "CONTROL"], evidence: OFFICIAL },
  { id: "SNOWPARTING_BLADE_EX", name: "Snowparting Blade EX", cooldownFamily: null, values: { maxShieldedAllies: 5 }, effect: "Shield up to 5 nearby allies; shield break triggers counter", range: null, duration: null, targetCap: 5, tags: ["SHIELD", "FRONTLINE"], evidence: OFFICIAL },
  { id: "PHALANXBANE_BLADE_EX", name: "Phalanxbane Blade EX", cooldownFamily: null, values: { triggerIntervalSeconds: 1.2, lv1Triggers: 10, lv3EnduranceDrain: 30 }, effect: "Airborne; trigger interval 1.2s; Lv1 10 triggers; Lv3 Endurance drain 30", range: null, duration: null, targetCap: null, tags: ["AIRBORNE", "ENDURANCE_PRESSURE"], evidence: OFFICIAL },
]);

export const GVG_EX_COOLDOWN_RULE = Object.freeze({ base120FamilyCurrentSeconds: 80, base90FamilyCurrentSeconds: 60, familyAssignmentRequiresVerifiedBaseCooldown: true, evidence: OFFICIAL });

export const BAMBOOCUT_DUST_GVG = Object.freeze({
  path: "Bamboocut-Dust", weapons: ["Everspring Umbrella", "Unfettered Rope Dart"],
  antiHeal: { basePct: 45, lv3Pct: 65, evidence: OFFICIAL },
  unfetteredRadiusMeters: { value: 12, evidence: OFFICIAL },
  qiPressureMultiplierFromGuildWarRule: 0.5,
  postDeathImmobilize: { allowed: false, regression: "Aug 2 bug fix: must not continuously Immobilize after death", evidence: OFFICIAL },
  phaseCapabilities: {
    MAIN_BALL: ["anti-heal zone", "control/stagger", "12m EX coverage"],
    OUTPOST_CONTROL: ["zone pressure", "anti-heal", "control"],
    ESCORT: ["anti-heal", "peel/control"],
    ANTI_ESCORT: ["anti-heal", "zone pressure", "control"],
    OBJECTIVE_BURN: ["personal damage is not promoted to exact objective DPS without calibration"],
  },
  metaClaim: false,
});

export const GVG_ROLES_V2 = Object.freeze(["MAIN_BALL", "FRONTLINE", "BACKLINE_DPS", "HEALER", "PEEL", "FLEX", "JUNGLER", "OBJECTIVE_BURN", "OUTPOST_CONTROL", "ESCORT", "ANTI_ESCORT", "ANTI_HEAL", "DUELIST", "COMMANDER"]);

export const DOCTRINE_TEMPLATES = Object.freeze([
  { id: "TOP100_EU_OLD_REFERENCE", source: "MetaForge Jan 2026", evidence: EVIDENCE_STATE.OUTDATED, ranges: {}, note: "Historical doctrine only; old Green Points terminology and old pacing are not current official rules." },
  { id: "GLOBAL_COMMUNITY", source: "Multiple current Global community references", evidence: EVIDENCE_STATE.COMMUNITY_CORROBORATED, ranges: {}, note: "Use mechanic diagnostics, not fixed healer/tank counts." },
  { id: "CN_REFERENCE", source: "CN comparative reference", evidence: EVIDENCE_STATE.OUTDATED, ranges: {}, note: "Region/version-labeled comparison only." },
  { id: "CUSTOM", source: "Owner-defined", evidence: EVIDENCE_STATE.MODELED, ranges: {}, note: "No composition count is asserted as meta." },
]);

export function gvgCapabilitySummary(member) {
  const tags = new Set(member?.capabilities || []);
  return {
    healing: tags.has("HEALING"), antiHeal: tags.has("ANTI_HEAL"), frontline: tags.has("FRONTLINE"), peel: tags.has("PEEL"),
    aoeControl: tags.has("AOE_CONTROL"), qiPressure: tags.has("QI_PRESSURE"), exCoverage: tags.has("EX_COVERAGE"), objectiveBurn: tags.has("OBJECTIVE_BURN"),
    mobility: tags.has("MOBILITY"), duelist: tags.has("DUELIST"), resurrection: tags.has("RESURRECTION"), commander: tags.has("COMMANDER"),
  };
}

export function objectiveSensitivity({ objective, baseHp, teamDps, nearbyPlayers, drPerStack, league = null }) {
  const cap = objective === "GOOSE" ? 30 : 15;
  const stacks = Math.min(cap, Math.max(0, Number(nearbyPlayers || 0)));
  const leagueRow = league ? GVG_LEAGUE_SCALING[league] : null;
  const scaledHp = Number.isFinite(Number(baseHp)) ? Number(baseHp) * (leagueRow?.objectiveHpMultiplier ?? 1) : null;
  if (scaledHp == null || !Number.isFinite(Number(teamDps)) || Number(teamDps) <= 0 || drPerStack == null) {
    return { objective, stacks, scaledHp, effectiveDps: null, killTimeSeconds: null, evidence: drPerStack == null ? UNKNOWN : EVIDENCE_STATE.MODELED, note: "No fake exact kill time: base HP/team DPS/DR-per-stack must be known or manually supplied." };
  }
  const multiplier = Math.max(0, 1 - stacks * Number(drPerStack));
  const effectiveDps = Number(teamDps) * multiplier;
  return { objective, stacks, scaledHp, effectiveDps, killTimeSeconds: effectiveDps > 0 ? scaledHp / effectiveDps : null, evidence: EVIDENCE_STATE.MODELED, note: "Manual sensitivity scenario; not an official kill-time prediction." };
}

export function effectAllowed(scope, mode) {
  if (scope === EFFECT_SCOPE.ALL_MODES) return true;
  if (scope === EFFECT_SCOPE.NON_PLAYER_ONLY) return !["1V1_ARENA","3V3_ARENA","GROUP_STRATEGY","5V5_ARENA","PERCEPTION_FOREST","GUILD_WAR"].includes(mode);
  if (scope === EFFECT_SCOPE.ARENA_ONLY) return ["1V1_ARENA","3V3_ARENA","GROUP_STRATEGY","5V5_ARENA"].includes(mode);
  if (scope === EFFECT_SCOPE.PERCEPTION_FOREST_ONLY) return mode === "PERCEPTION_FOREST";
  if (scope === EFFECT_SCOPE.GVG_ONLY) return mode === "GUILD_WAR";
  if (scope === EFFECT_SCOPE.PVE_ONLY) return mode === "PVE";
  if (scope === EFFECT_SCOPE.PLAYER_TARGET) return mode !== "PVE";
  return false;
}

export const EVIDENCE_MATRIX = Object.freeze([
  { id: "arena-battlegroups", mode: "ARENA", patch: "2026-04-30+", source: "Official PVP427", sourceDate: "2026-04-30", claim: "Five current battlegroups and server mapping", scope: "Global Arena/Guild War", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-1v1-247", mode: "1V1_ARENA", patch: "2026-04-30+", source: "Official PVP427", sourceDate: "2026-04-30", claim: "1v1 available 24/7", scope: "schedule", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-cross-server", mode: "ARENA", patch: "2026-05-22+", source: "Official 522update", sourceDate: "2026-05-22", claim: "Cross-server toggle, timeout expansion, host-server rule", scope: "matchmaking", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-level-adjustment", mode: "3V3_ARENA/GROUP_STRATEGY", patch: "2026-05-27+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Modes are Level Adjustment contexts for custom Mystic branch trial; exact stat normalization not published", scope: "normalization", numeric: null, evidence: UNRESOLVED, implementation: IMPLEMENTATION_STATE.GUARDED_UNKNOWN },
  { id: "arena-3v3-revive", mode: "3V3_ARENA", patch: "2026-05-27+", source: "Official 527update", sourceDate: "2026-05-27", claim: "No-healer and healer revive branches are distinct", scope: "team rules", numeric: { rangeMeters: 10, windowSeconds: 15, noHealerOpportunities: 1 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-same-ma-max2", mode: "3V3_ARENA", patch: "2026-05-27+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Same Martial Art maximum two per team", scope: "composition", numeric: 2, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-endurance-cap", mode: "ARENA", patch: "1.7+", source: "Official Adjustment528", sourceDate: "2026-05-28", claim: "Endurance consumption reduction cap 40%", scope: "resource", numeric: 40, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-gqc", mode: "ARENA", patch: "1.7+", source: "Official Adjustment528", sourceDate: "2026-05-28", claim: "Guarding Qi Core restores HP/Qi, grants 0.5s Invincibility, control-clear branch depends on hit state", scope: "combat state", numeric: { invincibilitySeconds: 0.5 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-execute-getup", mode: "ARENA", patch: "1.7+", source: "Official Adjustment528", sourceDate: "2026-05-28", claim: "Execute knockdown Qi immunity and distinct get-up Tenacity/Control Immunity/Super Armor", scope: "combat state", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-reverse-hit-validation", mode: "ARENA", patch: "2.0", source: "Official 723update rolling patch", sourceDate: "2026-07-23", claim: "Reverse hit validation uses defender dodge invulnerability; no latency damage coefficient", scope: "network", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "arena-bamboocut-v2", mode: "ARENA", patch: "2.0", source: "Official 723update + Adjustment528", sourceDate: "2026-07-23", claim: "Bamboocut-Dust current stagger/Tenacity/unblockable interactions", scope: "path", numeric: { piercingTenacityStart: 0.5, soulbreakCooldown: 21 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "pf-rodent-hunt", mode: "PERCEPTION_FOREST", patch: "1.7+", source: "Official Adjustment528", sourceDate: "2026-05-28", claim: "Rodent Hunt 10s, -50% received Healing, settles 30% damage taken, one active per target", scope: "Perception Forest only", numeric: { duration: 10, healReductionPct: 50, settlementPct: 30 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "training-preliminary", mode: "TRAINING_TERRACE", patch: "2.0", source: "Official July Preliminary notes", sourceDate: "2026-07-17", claim: "Training Terrace Preliminary is a test/calibration environment", scope: "training", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.DISPLAY_ONLY },
  { id: "gvg-outposts", mode: "GUILD_WAR", patch: "1.7+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Top/bottom Outposts at 3:00, revive option, 60s ownership lock", scope: "objective", numeric: { spawnSeconds: 180, lockSeconds: 60 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "gvg-proximity-qi", mode: "GUILD_WAR", patch: "1.7+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Bulwark cap15, Goose cap30, Guild War Qi Damage received x0.5; DR/stack unpublished", scope: "objective", numeric: { bulwarkCap: 15, gooseCap: 30, qiMultiplier: 0.5 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "gvg-halftime", mode: "GUILD_WAR", patch: "1.7+", source: "Official 527update", sourceDate: "2026-05-27", claim: "On entering Halftime initial DMG Bonus 0%; +30% every30s; trigger timestamp unpublished/conflicting", scope: "phase", numeric: { initialPct: 0, stepPct: 30, stepSeconds: 30, triggerSeconds: null }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.GUARDED_UNKNOWN },
  { id: "gvg-league-scaling", mode: "GUILD_WAR", patch: "1.7+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Divinarche/Jesting Hero/Stealth Jester objective and neutral scaling", scope: "league", numeric: { divinarche: 0.75, jestingHero: 0.5, stealthJester: 0.25 }, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "gvg-ex", mode: "GUILD_WAR", patch: "1.7+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Current EX effects and 120→80 / 90→60 cooldown-family rule", scope: "Martial Art Techniques", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "gvg-command-costs", mode: "GUILD_WAR", patch: "1.7+", source: "Official 527update", sourceDate: "2026-05-27", claim: "Command cost/CD changed; exact current values not published in reviewed evidence", scope: "Commander", numeric: null, evidence: UNKNOWN, implementation: IMPLEMENTATION_STATE.GUARDED_UNKNOWN },
  { id: "gvg-bamboocut-death-fix", mode: "GUILD_WAR", patch: "2.0 Aug2", source: "Official 723update rolling patch", sourceDate: "2026-08-02", claim: "Bamboocut-Dust must not continuously Immobilize after death", scope: "path regression", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED },
  { id: "gvg-attunement", mode: "GUILD_WAR", patch: "current", source: "Official sources reviewed", sourceDate: "2026-08-18 review", claim: "Normal/Arena Attunement applicability to Guild War is not established", scope: "build applicability", numeric: null, evidence: UNKNOWN, implementation: IMPLEMENTATION_STATE.GUARDED_UNKNOWN },
  { id: "gvg-victory-order", mode: "GUILD_WAR", patch: "current", source: "Community claims conflict / no current official rule found", sourceDate: "2026-08-18 review", claim: "Exact current victory/tiebreak ordering remains manual/current-unknown", scope: "victory", numeric: null, evidence: UNKNOWN, implementation: IMPLEMENTATION_STATE.GUARDED_UNKNOWN },
  { id: "old-green-points", mode: "GUILD_WAR", patch: "historical", source: "MetaForge Jan 2026", sourceDate: "2026-01", claim: "Green Points terminology is historical; current official terminology is Fun Coins", scope: "terminology", numeric: null, evidence: EVIDENCE_STATE.OUTDATED, implementation: IMPLEMENTATION_STATE.HISTORICAL_ONLY },
]);

export const P0_CLIENT_CAPTURE_CHECKLIST = Object.freeze([
  "3v3 Level Adjustment: detailed stat panel before/after entering queue or Training Terrace equivalent",
  "Group Strategy: detailed stat panel before/after Level Adjustment",
  "Guild War: gear detail showing which Attunement profile is active",
  "Guild War: Commander skill tooltips with current Fun Coin costs and cooldowns",
  "Guild War: Bulwark/Goose status tooltip showing any DR-per-stack value",
  "Guild War: Halftime timer/entry screen and duel selection/outcome screens",
  "Guild War: settlement/victory screen showing current win/tiebreak rule",
  "Arena/Guild War: Player Target Boost detailed stat before/inside each mode",
]);

export function validateCompetitiveResearch(records = EVIDENCE_MATRIX) {
  const errors = [];
  for (const record of records) {
    for (const key of ["id","mode","patch","source","sourceDate","claim","scope","evidence","implementation"]) {
      if (record[key] == null || record[key] === "") errors.push(`${record.id || "unknown"}: missing ${key}`);
    }
    if (record.evidence === UNKNOWN && record.numeric != null) errors.push(`${record.id}: UNKNOWN mechanic cannot masquerade as confirmed numeric value`);
    if (/community/i.test(record.source) && record.evidence === OFFICIAL) errors.push(`${record.id}: community source labeled official`);
    if (record.evidence === EVIDENCE_STATE.OUTDATED && record.patch === "current") errors.push(`${record.id}: outdated evidence marked current`);
  }
  return errors;
}
