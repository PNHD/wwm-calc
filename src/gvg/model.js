export const EVIDENCE = Object.freeze({
  CONFIRMED_OFFICIAL: "CONFIRMED_OFFICIAL",
  CONFIRMED_CLIENT: "CONFIRMED_CLIENT",
  COMMUNITY_CORROBORATED: "COMMUNITY_CORROBORATED",
  COMMUNITY_CONFLICTING: "COMMUNITY_CONFLICTING",
  MODELED: "MODELED",
  UNKNOWN: "UNKNOWN",
});

export const SCENARIOS = Object.freeze(["PVE_BOSS", "ARENA", "GUILD_WAR"]);
export const GVG_ROLES = Object.freeze([
  "MAIN_BALL",
  "FRONTLINE_TANK",
  "HEALER",
  "FLEX_ASSASSIN",
  "JUNGLER_OBJECTIVE",
  "DUELIST",
  "ESCORT",
  "ANTI_ESCORT",
]);

export const DIMENSIONS = Object.freeze([
  "playerDamage",
  "objectiveDamage",
  "aoePressure",
  "healing",
  "survivability",
  "cc",
  "antiHeal",
  "mobility",
  "qiPressure",
  "teamShields",
  "reviveUtility",
  "exUtility",
  "zoneControl",
]);

export const OFFICIAL_GVG = Object.freeze({
  evidence: EVIDENCE.CONFIRMED_OFFICIAL,
  outpostSpawnSeconds: 180,
  outpostOwnershipLockSeconds: 60,
  resurrectionSameTargetLockSeconds: 60,
  bulwarkMaxProximityStacks: 15,
  gooseMaxProximityStacks: 30,
  qiDamageTakenMultiplier: 0.5,
  neutralMonstersPerCamp: 1,
  neutralBossSpawnJitterSeconds: 60,
  bulwarkDrPerStack: null,
  gooseDrPerStack: null,
  neutralBossBaseTimes: null,
  commandCosts: null,
  commandCooldowns: null,
  halftimeTime: null,
  halftimeReward: null,
  halftimeTimeEvidence: EVIDENCE.COMMUNITY_CONFLICTING,
  halftimeRewardEvidence: EVIDENCE.COMMUNITY_CONFLICTING,
  halftimeInitialDamageBonusPct: 0,
  halftimeRampDamageBonusPct: 30,
  halftimeRampIntervalSeconds: 30,
  ignoreInterceptionBreachesWindWall: true,
});

export const LEAGUE_SCALING = Object.freeze({
  STANDARD: { label: "Standard / unverified league", hpMultiplier: 1, attackMultiplier: 1, evidence: EVIDENCE.UNKNOWN },
  DIVINARCHE: { label: "Divinarche", hpMultiplier: 0.75, attackMultiplier: 0.75, evidence: EVIDENCE.CONFIRMED_OFFICIAL },
  JESTING_HERO: { label: "Jesting Hero", hpMultiplier: 0.5, attackMultiplier: 0.5, evidence: EVIDENCE.CONFIRMED_OFFICIAL },
  STEALTH_JESTER: { label: "Stealth Jester", hpMultiplier: 0.25, attackMultiplier: 0.25, evidence: EVIDENCE.CONFIRMED_OFFICIAL },
});

export const EX_TECHNIQUES = Object.freeze([
  { id: "nameless-sword", name: "Nameless Sword: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Lv3 restores 60 Qi to allies.", values: { lv3AlliedQiRestore: 60 } },
  { id: "strategic-sword", name: "Strategic Sword: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Expanded Sword Horizon; Sword Energy detonates targets at 5 Bleeding stacks for High Bleeding damage.", values: { bleedDetonationStacks: 5 } },
  { id: "heavenquaker-spear", name: "Heavenquaker Spear: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Stores up to 2 uses.", values: { storedUses: 2 } },
  { id: "stormbreaker-spear", name: "Stormbreaker Spear: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "75% self DMG Reduction after casting.", values: { selfDamageReductionPct: 75 } },
  { id: "vernal-umbrella", name: "Vernal Umbrella: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Build Momentum grants +10% Ballistic Skill DMG per stack, max 5.", values: { ballisticDamagePctPerStack: 10, maxStacks: 5 } },
  { id: "mortal-rope-dart", name: "Mortal Rope Dart: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "For 8s after cast, Rodent attacks briefly Immobilize targets hit.", values: { immobilizeWindowSeconds: 8 } },
  { id: "soulshade-umbrella", name: "Soulshade Umbrella: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Restores 20 Endurance/s to allies.", values: { alliedEndurancePerSecond: 20 } },
  { id: "everspring-umbrella", name: "Everspring Umbrella: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Healing Reduction zone: 45%; Lv3: 65%.", values: { healingReductionPct: 45, lv3HealingReductionPct: 65 } },
  { id: "unfettered-rope-dart", name: "Unfettered Rope Dart: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "12m hit radius after casting.", values: { radiusMeters: 12 } },
  { id: "snowparting-blade", name: "Snowparting Blade: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Shields up to 5 nearby allies; shield break triggers an Anxi Soldier counterattack.", values: { maxShieldedAllies: 5 } },
  { id: "phalanxbane-blade", name: "Phalanxbane Blade: EX", evidence: EVIDENCE.CONFIRMED_OFFICIAL, current: "Airborne downward strike; 1.2s trigger interval; Lv1 10 triggers; Lv3 drains 30 Endurance.", values: { triggerIntervalSeconds: 1.2, lv1Triggers: 10, lv3EnduranceDrain: 30 } },
]);

export const EX_COOLDOWN_RULE = Object.freeze({
  evidence: EVIDENCE.CONFIRMED_OFFICIAL,
  mappings: Object.freeze([{ from: 120, to: 80 }, { from: 90, to: 60 }]),
  note: "Do not assign an EX to an original cooldown bucket unless current client/source evidence identifies that bucket.",
});

export const COMMUNITY_PRESETS = Object.freeze({
  BALANCED_GLOBAL_COMMUNITY: {
    label: "Balanced Global Community",
    evidence: EVIDENCE.COMMUNITY_CORROBORATED,
    date: "2026-08-17 synthesis",
    authoritative: false,
    targets: { healer: [5, 9], frontlineTank: [3, 6], flex: [4, 10], duelistReady: [3, 8] },
    note: "Broad coverage envelope synthesized from multiple Global guides; intentionally not an exact composition.",
  },
  TOP_100_STYLE: {
    label: "Top-100 Style",
    evidence: EVIDENCE.COMMUNITY_CORROBORATED,
    date: "2026-01-26",
    authoritative: false,
    targets: { healer: [6, 8], frontlineTank: [4, 4], flexGroups: [2, 2] },
    note: "MetaForge Top-100 EU example; predates the May pacing/EX update and is advisory only.",
  },
  CN_REFERENCE_HIGH_SUSTAIN: {
    label: "CN-reference High-sustain",
    evidence: EVIDENCE.COMMUNITY_CORROBORATED,
    region: "CN-derived comparative evidence",
    date: "2026-01-19 relay",
    authoritative: false,
    targets: { healer: [8, 10], tankLike: [2, 4], twinBlade: [2, 2], supportControl: [2, 4] },
    note: "Never promoted to current Global truth and never auto-selected as best.",
  },
  CUSTOM: {
    label: "Custom",
    evidence: EVIDENCE.MODELED,
    authoritative: false,
    targets: {},
    note: "No composition assumptions.",
  },
});

const ROLE_WEIGHTS = Object.freeze({
  MAIN_BALL: { playerDamage: 1.0, aoePressure: 1.4, survivability: 1.1, cc: 1.2, antiHeal: 0.9, qiPressure: 0.8, teamShields: 0.6, exUtility: 0.9, zoneControl: 1.2 },
  FRONTLINE_TANK: { survivability: 1.8, cc: 1.4, teamShields: 1.2, reviveUtility: 0.3, exUtility: 0.8, zoneControl: 0.9, playerDamage: 0.25 },
  HEALER: { healing: 2.0, survivability: 1.0, reviveUtility: 1.7, teamShields: 1.0, exUtility: 1.2, mobility: 0.5, zoneControl: 0.4 },
  FLEX_ASSASSIN: { playerDamage: 1.4, mobility: 1.7, cc: 0.8, antiHeal: 1.0, qiPressure: 0.8, zoneControl: 0.5, survivability: 0.5 },
  JUNGLER_OBJECTIVE: { objectiveDamage: 1.7, mobility: 1.4, survivability: 0.6, playerDamage: 0.5, cc: 0.5, exUtility: 0.5 },
  DUELIST: { playerDamage: 1.5, survivability: 1.2, cc: 1.2, mobility: 1.2, qiPressure: 0.9, antiHeal: 0.5 },
  ESCORT: { survivability: 1.4, mobility: 1.2, healing: 0.8, teamShields: 1.0, cc: 0.7, zoneControl: 0.8, reviveUtility: 0.5 },
  ANTI_ESCORT: { playerDamage: 1.0, aoePressure: 1.1, cc: 1.4, antiHeal: 1.3, mobility: 1.0, zoneControl: 1.3, qiPressure: 0.6 },
});

export const ARCHETYPES = Object.freeze([
  {
    id: "bamboocut-dust-zone",
    name: "Bamboocut-Dust — Anti-heal / Zone Pressure",
    kind: "MY BUILD",
    evidence: EVIDENCE.MODELED,
    weapons: ["Everspring Umbrella", "Unfettered Rope Dart"],
    dimensions: { playerDamage: 61, objectiveDamage: 48, aoePressure: 82, healing: 10, survivability: 54, cc: 76, antiHeal: 96, mobility: 78, qiPressure: 55, teamShields: 8, reviveUtility: 0, exUtility: 96, zoneControl: 96 },
    why: ["Everspring EX supplies the official 45%/65% Healing Reduction zone.", "Unfettered EX supplies the official 12m radius.", "Current official Bamboocut-Dust updates support control/ranged pressure, while survivability remains a separate tradeoff rather than inferred from PvE DPS."],
  },
  {
    id: "stonesplit-frontline-reference",
    name: "Stonesplit — Frontline reference",
    kind: "REFERENCE BUILD",
    evidence: EVIDENCE.MODELED,
    weapons: ["Thundercry Blade", "Stormbreaker Spear"],
    dimensions: { playerDamage: 52, objectiveDamage: 50, aoePressure: 60, healing: 0, survivability: 94, cc: 82, antiHeal: 0, mobility: 45, qiPressure: 58, teamShields: 78, reviveUtility: 0, exUtility: 82, zoneControl: 70 },
    why: ["Reference profile emphasizes current Path tank/frontline identity and official Stormbreaker EX 75% self DR.", "Numbers are modeled role dimensions, not current-client measured percentages."],
  },
  {
    id: "silkbind-healer-reference",
    name: "Silkbind-Deluge — Healer reference",
    kind: "REFERENCE BUILD",
    evidence: EVIDENCE.MODELED,
    weapons: ["Panacea Fan", "Soulshade Umbrella"],
    dimensions: { playerDamage: 24, objectiveDamage: 18, aoePressure: 25, healing: 98, survivability: 62, cc: 45, antiHeal: 0, mobility: 55, qiPressure: 42, teamShields: 72, reviveUtility: 100, exUtility: 92, zoneControl: 55 },
    why: ["Panacea Resurrection has an official 60s same-target GvG lockout.", "Soulshade EX officially restores 20 Endurance/s to allies."],
  },
  {
    id: "bamboocut-wind-flex-reference",
    name: "Bamboocut-Wind — Flex reference",
    kind: "COMMUNITY BUILD",
    evidence: EVIDENCE.COMMUNITY_CORROBORATED,
    weapons: ["Infernal Twinblades", "Mortal Rope Dart"],
    dimensions: { playerDamage: 88, objectiveDamage: 58, aoePressure: 58, healing: 0, survivability: 48, cc: 78, antiHeal: 70, mobility: 96, qiPressure: 72, teamShields: 0, reviveUtility: 0, exUtility: 78, zoneControl: 58 },
    why: ["Global community guides repeatedly use mobile assassin/flex groups to pressure side lanes and backlines.", "Mortal Rope Dart EX has an official 8s Rodent Immobilize window."],
  },
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function applyGuildWarQiDamage(rawQiDamage) {
  return Math.max(0, Number(rawQiDamage) || 0) * OFFICIAL_GVG.qiDamageTakenMultiplier;
}

export function canChangeOutpostOwnership(capturedAtSeconds, nowSeconds) {
  return Number(nowSeconds) - Number(capturedAtSeconds) >= OFFICIAL_GVG.outpostOwnershipLockSeconds;
}

export function canResurrectSameTarget(lastResurrectionAtSeconds, nowSeconds) {
  if (lastResurrectionAtSeconds == null) return true;
  return Number(nowSeconds) - Number(lastResurrectionAtSeconds) >= OFFICIAL_GVG.resurrectionSameTargetLockSeconds;
}

export function proximityStacks(objective, nearbyPlayers) {
  const cap = objective === "GOOSE" ? OFFICIAL_GVG.gooseMaxProximityStacks : OFFICIAL_GVG.bulwarkMaxProximityStacks;
  return clamp(Math.floor(Number(nearbyPlayers) || 0), 0, cap);
}

export function proximitySensitivity(objective, manualDrPerStack = null) {
  return [5, 10, 20, 30].map((nearbyPlayers) => {
    const stacks = proximityStacks(objective, nearbyPlayers);
    const dr = manualDrPerStack == null || manualDrPerStack === "" ? null : clamp(Number(manualDrPerStack), 0, 1);
    return {
      nearbyPlayers,
      stacks,
      damageMultiplier: dr == null ? null : clamp(1 - stacks * dr, 0.05, 1),
      evidence: dr == null ? EVIDENCE.UNKNOWN : EVIDENCE.MODELED,
    };
  });
}

export function neutralBossWindow(baseTimeSeconds) {
  if (baseTimeSeconds == null || baseTimeSeconds === "" || !Number.isFinite(Number(baseTimeSeconds))) return null;
  const base = Number(baseTimeSeconds);
  return { earliest: Math.max(0, base - 60), latest: base + 60, evidence: EVIDENCE.CONFIRMED_OFFICIAL };
}

export function selectAttunementProfile(profiles, selected) {
  if (selected === "ARENA") return profiles?.arena ?? null;
  return profiles?.normal ?? null;
}

export function normalizeDimensions(input = {}) {
  return Object.fromEntries(DIMENSIONS.map((key) => [key, clamp(Number(input[key]) || 0, 0, 100)]));
}

export function scoreRole(dimensions, role) {
  const weights = ROLE_WEIGHTS[role] ?? {};
  const normalized = normalizeDimensions(dimensions);
  const entries = Object.entries(weights);
  const weightTotal = entries.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  const weighted = entries.reduce((sum, [key, weight]) => sum + normalized[key] * weight, 0) / weightTotal;
  const contributions = entries
    .map(([key, weight]) => ({ key, value: normalized[key], contribution: normalized[key] * weight }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
  return {
    role,
    score: Math.round(weighted),
    evidence: EVIDENCE.MODELED,
    contributions,
    explanation: contributions.map((entry) => `${entry.key} ${entry.value}/100`).join(" · "),
  };
}

export function scoreAllRoles(dimensions) {
  return GVG_ROLES.map((role) => scoreRole(dimensions, role)).sort((a, b) => b.score - a.score);
}

export function getBamboocutDustProfile(exLevel = 3) {
  const base = ARCHETYPES[0];
  const antiHeal = Number(exLevel) >= 3 ? 100 : 92;
  const dimensions = { ...base.dimensions, antiHeal, exUtility: Number(exLevel) >= 3 ? 100 : 94 };
  return {
    ...base,
    exLevel: Number(exLevel) || 1,
    antiHealPct: Number(exLevel) >= 3 ? 65 : 45,
    unfetteredRadiusMeters: 12,
    dimensions,
    roleScores: scoreAllRoles(dimensions),
  };
}

export function compareBuildsByRole(buildA, buildB) {
  return GVG_ROLES.map((role) => {
    const a = scoreRole(buildA.dimensions, role);
    const b = scoreRole(buildB.dimensions, role);
    return {
      role,
      a: a.score,
      b: b.score,
      delta: a.score - b.score,
      winner: a.score === b.score ? "TIE" : a.score > b.score ? "A" : "B",
      whyA: a.explanation,
      whyB: b.explanation,
    };
  });
}

export function leagueObjectiveMultiplier(league, objective) {
  const row = LEAGUE_SCALING[league] ?? LEAGUE_SCALING.STANDARD;
  if (league === "STANDARD") return { hpMultiplier: 1, attackMultiplier: 1, evidence: EVIDENCE.UNKNOWN };
  if (["BULWARK", "ZHANG_BAO", "ZHUXIE_GULE"].includes(objective)) {
    return { hpMultiplier: row.hpMultiplier, attackMultiplier: 1, evidence: row.evidence };
  }
  if (["GOOSE", "NEUTRAL_MONSTER"].includes(objective)) {
    return { hpMultiplier: row.hpMultiplier, attackMultiplier: row.attackMultiplier, evidence: row.evidence };
  }
  return { hpMultiplier: 1, attackMultiplier: 1, evidence: EVIDENCE.UNKNOWN };
}

const objectiveSimulationCache = new Map();
export function objectiveSimulationCacheKey(input) {
  const stable = {
    scenario: "GUILD_WAR",
    rosterSignature: input.rosterSignature ?? "",
    role: input.role ?? "",
    build: input.build ?? "",
    objective: input.objective ?? "BULWARK",
    objectiveHp: Number(input.objectiveHp) || 0,
    teamObjectiveDps: Number(input.teamObjectiveDps) || 0,
    nearbyPlayers: Number(input.nearbyPlayers) || 0,
    manualDrPerStack: input.manualDrPerStack == null || input.manualDrPerStack === "" ? null : Number(input.manualDrPerStack),
    league: input.league ?? "STANDARD",
    timeline: input.timeline ?? "",
  };
  return JSON.stringify(stable);
}

export function simulateObjective(input) {
  const cacheKey = objectiveSimulationCacheKey(input);
  if (objectiveSimulationCache.has(cacheKey)) return { ...objectiveSimulationCache.get(cacheKey), cacheHit: true };
  const objective = input.objective === "GOOSE" ? "GOOSE" : "BULWARK";
  const baseHp = Math.max(0, Number(input.objectiveHp) || 0);
  const teamDps = Math.max(0, Number(input.teamObjectiveDps) || 0);
  const leagueScale = leagueObjectiveMultiplier(input.league ?? "STANDARD", objective);
  const scaledHp = baseHp * leagueScale.hpMultiplier;
  const stacks = proximityStacks(objective, input.nearbyPlayers);
  const manualDr = input.manualDrPerStack == null || input.manualDrPerStack === "" ? null : clamp(Number(input.manualDrPerStack), 0, 1);
  const damageMultiplier = manualDr == null ? null : clamp(1 - stacks * manualDr, 0.05, 1);
  const effectiveDps = damageMultiplier == null ? null : teamDps * damageMultiplier;
  const breakTimeSeconds = effectiveDps && scaledHp ? scaledHp / effectiveDps : null;
  const result = {
    scenario: "GUILD_WAR",
    model: "DISCRETE_EVENT_SCENARIO",
    objective,
    scaledHp,
    stacks,
    manualDrPerStack: manualDr,
    damageMultiplier,
    effectiveDps,
    breakTimeSeconds,
    drEvidence: manualDr == null ? EVIDENCE.UNKNOWN : EVIDENCE.MODELED,
    leagueEvidence: leagueScale.evidence,
    winProbability: null,
    cacheHit: false,
  };
  objectiveSimulationCache.set(cacheKey, result);
  return result;
}

export function computeFunCoinCurve(events, startingCoins = 0) {
  let balance = Number(startingCoins) || 0;
  return [...(events ?? [])]
    .sort((a, b) => Number(a.timeSeconds) - Number(b.timeSeconds))
    .map((event) => {
      balance += Number(event.amount) || 0;
      return { ...event, balance };
    });
}

export function commandAvailability(lastUsedSeconds, cooldownSeconds, atSeconds) {
  if (cooldownSeconds == null || cooldownSeconds === "") return { available: null, evidence: EVIDENCE.UNKNOWN };
  const readyAt = Number(lastUsedSeconds || 0) + Number(cooldownSeconds);
  return { available: Number(atSeconds) >= readyAt, readyAt, evidence: EVIDENCE.MODELED };
}

export function rosterSignature(roster = []) {
  return [...roster]
    .map((member) => `${member.id}:${member.path}:${(member.roles ?? []).join(",")}:${member.exLevel ?? 1}:${member.gvgSelectedProfile ?? "ARENA"}:${member.availability !== false}`)
    .sort()
    .join("|");
}

export function validateRoster(roster = []) {
  const errors = [];
  if (roster.length > 30) errors.push("Guild War roster supports a maximum of 30 members.");
  const ids = new Set();
  for (const member of roster) {
    if (!member.id) errors.push("Every roster member requires an id.");
    if (ids.has(member.id)) errors.push(`Duplicate roster id: ${member.id}`);
    ids.add(member.id);
  }
  return { valid: errors.length === 0, errors };
}

export function rosterDiagnostics(roster = []) {
  const active = roster.filter((member) => member.availability !== false);
  const hasRole = (role) => active.filter((member) => (member.roles ?? []).includes(role)).length;
  const exDiversity = new Set(active.map((member) => member.exTechnique).filter(Boolean)).size;
  return {
    members: active.length,
    healingCoverage: hasRole("HEALER"),
    frontlineCoverage: hasRole("FRONTLINE_TANK") + hasRole("MAIN_BALL"),
    antiHealCoverage: active.filter((member) => member.antiHeal === true || /Everspring|Twinblades/i.test((member.weapons ?? []).join(" "))).length,
    aoeCcCoverage: active.filter((member) => member.aoeCc === true || (member.roles ?? []).includes("ANTI_ESCORT")).length,
    flexMobility: hasRole("FLEX_ASSASSIN") + hasRole("JUNGLER_OBJECTIVE"),
    duelistReadiness: hasRole("DUELIST"),
    objectiveDamageCoverage: hasRole("JUNGLER_OBJECTIVE"),
    exDiversity,
    reviveCapacity: active.filter((member) => /Panacea Fan/i.test((member.weapons ?? []).join(" "))).length,
  };
}

export const SHARE_SCHEMA_VERSION = 1;
export const SHARE_KINDS = Object.freeze(["INDIVIDUAL_BUILD", "GVG_ROLE_BUILD", "ROSTER", "STRATEGY", "FULL_GUILD_WAR_PLAN"]);

export function createShareEnvelope(kind, payload, options = {}) {
  if (!SHARE_KINDS.includes(kind)) throw new Error(`Unsupported share kind: ${kind}`);
  return {
    schema: "wwm-gvg-share",
    version: SHARE_SCHEMA_VERSION,
    kind,
    createdAt: options.createdAt ?? new Date().toISOString(),
    privacy: { playerNamesRedacted: Boolean(options.redactPlayerNames) },
    payload: options.redactPlayerNames ? redactPlayerNames(payload) : payload,
  };
}

export function validateShareEnvelope(envelope) {
  if (!envelope || envelope.schema !== "wwm-gvg-share") return { valid: false, error: "Not a WWM GvG share payload." };
  if (Number(envelope.version) !== SHARE_SCHEMA_VERSION) return { valid: false, error: `Unsupported share schema version: ${envelope.version}` };
  if (!SHARE_KINDS.includes(envelope.kind)) return { valid: false, error: `Unsupported share kind: ${envelope.kind}` };
  return { valid: true, error: null };
}

export function redactPlayerNames(value) {
  const clone = typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  const names = new Map();
  let counter = 1;
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node.name === "string" && ("roles" in node || "path" in node || "weapons" in node)) {
      if (!names.has(node.name)) names.set(node.name, `Player ${String(counter++).padStart(2, "0")}`);
      node.name = names.get(node.name);
    }
    Object.values(node).forEach(walk);
  };
  walk(clone);
  return clone;
}

export function defaultWorkspace() {
  return {
    schema: "wwm-gvg-workspace",
    version: 1,
    scenario: "GUILD_WAR",
    doctrine: "CUSTOM",
    halftime: { timeSeconds: null, reward: "", evidence: EVIDENCE.COMMUNITY_CONFLICTING },
    objectiveParams: { bulwarkDrPerStack: null, gooseDrPerStack: null, zhangBaoBaseSeconds: null, zhuxieGuleBaseSeconds: null },
    roster: [],
    strategy: { positions: {}, arrows: [], rallyPoints: [], notes: "" },
    timeline: [],
    commander: { startingCoins: 0, events: [] },
    duelist: { primary: null, backup1: null, backup2: null },
    healerCalibration: { hps: null, burstHealing: null, sustainedHealing: null, reviveUtility: null, enduranceSupport: null, antiHealExposure: null, survivability: null },
    matchLogs: [],
    attunementProfiles: { normal: { name: "PvE / Normal", source: "legacy-compatible" }, arena: { name: "Arena", source: "separate-profile" }, gvgSelected: "ARENA" },
  };
}

export function migrateWorkspace(input) {
  if (!input || typeof input !== "object") return defaultWorkspace();
  if (input.schema === "wwm-gvg-workspace" && Number(input.version) === 1) {
    return { ...defaultWorkspace(), ...input, version: 1, scenario: "GUILD_WAR" };
  }
  // Deterministic v0 migration. Legacy PvE data is referenced, never mutated or reinterpreted as GvG values.
  if (Number(input.version ?? 0) === 0) {
    return { ...defaultWorkspace(), legacyReference: input.legacyReference ?? null };
  }
  return defaultWorkspace();
}

export function createMatchLog(input = {}) {
  return {
    id: input.id ?? `match-${Date.now()}`,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    patch: input.patch ?? "",
    league: input.league ?? "",
    opponent: input.opponent ?? "",
    result: input.result ?? "",
    roster: input.roster ?? [],
    roles: input.roles ?? {},
    kills: Number(input.kills) || 0,
    deaths: Number(input.deaths) || 0,
    damage: Number(input.damage) || 0,
    healing: Number(input.healing) || 0,
    objectiveDamage: Number(input.objectiveDamage) || 0,
    outpostCaptureTimes: input.outpostCaptureTimes ?? [],
    neutralBosses: input.neutralBosses ?? [],
    funCoinUsage: input.funCoinUsage ?? [],
    duelOutcome: input.duelOutcome ?? "",
    bulwarkBreakSeconds: input.bulwarkBreakSeconds ?? null,
    gooseBreakSeconds: input.gooseBreakSeconds ?? null,
    tree: input.tree ?? { pickupSeconds: null, distance: null, delivered: false },
    calibrationApplied: false,
  };
}
