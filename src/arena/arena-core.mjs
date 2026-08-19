export const ARENA_SCHEMA_VERSION = 1;
export const ARENA_PATCH = "2.0 / 2026-08-07";
export const ARENA_STORAGE_KEY = "wwm_arena_state_v1";
export const ARENA_LEGACY_MODE_KEY = "wwm_arena_mode_v2";
export const ARENA_HISTORY_KEY = "wwm_arena_history_v1";
export const PVE_INVENTORY_KEY = "wwm_chars_v3";

export const EVIDENCE = Object.freeze({
  CONFIRMED_CLIENT: "CONFIRMED_CLIENT",
  CONFIRMED_OFFICIAL: "CONFIRMED_OFFICIAL",
  COMMUNITY_CORROBORATED: "COMMUNITY_CORROBORATED",
  COMMUNITY_CONFLICTING: "COMMUNITY_CONFLICTING",
  MODELED: "MODELED",
  UNKNOWN: "UNKNOWN",
});

export const ARENA_MODES = Object.freeze(["1v1", "3v3", "5v5"]);
export const ARENA_STATES = Object.freeze([
  "NEUTRAL", "ATTACKING", "DEFENDING", "DEFLECT", "PERFECT_DODGE", "DODGE_IFRAME",
  "SPRINT", "DASH", "HIT_STAGGER", "CONTROLLED", "IMMOBILIZED", "AIRBORNE", "KNOCKDOWN",
  "TENACITY", "SUPER_ARMOR", "CONTROL_IMMUNITY", "INVINCIBLE", "QI_IMBALANCE", "EXHAUSTED",
  "EXECUTED", "GET_UP_PROTECTION", "BREAK_CONTROL_READY",
]);

export const ARCHETYPES = Object.freeze([
  "BURST_DIVE", "SUSTAIN_DOT", "RANGED_KITE", "TANK_CONTROL", "ASSASSIN",
  "HEALER_SUPPORT", "BRUISER", "ANTI_CONTROL",
]);

const OFFICIAL_17 = "https://www.wherewindsmeetgame.com/news/official/Adjustment528.html";
const OFFICIAL_20 = "https://www.wherewindsmeetgame.com/news/official/723update.html";
const OFFICIAL_527 = "https://www.wherewindsmeetgame.com/news/official/527update.html";
const OFFICIAL_PVP427 = "https://www.wherewindsmeetgame.com/m/news/official/PVP427.html";

export const ARENA_ATTUNEMENTS = Object.freeze([
  {
    id: "arena-chest-martial-source-dr",
    slot: "Chestpiece", rarity: "Epic/Gold", effectCategory: "SURVIVAL",
    trigger: "While in Hit Stagger or controlled", duration: null, cooldown: null,
    eligible: ["ALL"], effect: "Reduces damage originating from Martial Arts while in Hit Stagger or under control effects.",
    evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "2.0", source: OFFICIAL_20,
  },
  {
    id: "arena-bracer-deflect-qi-gold",
    slot: "Bracer", rarity: "Gold", effectCategory: "QI_PRESSURE",
    trigger: "Consecutive successful Deflects", duration: null, cooldown: null,
    eligible: ["ALL"], effect: "Consecutive-Deflect Qi Damage boost uses the current 25/30/35/40% Gold progression.",
    values: [25, 30, 35, 40], evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "1.7+", source: OFFICIAL_17,
  },
  {
    id: "arena-weapon-execution-vitality",
    slot: "Weapon", rarity: "Epic/Gold", effectCategory: "RECOVERY",
    trigger: "After Execution Skill", duration: 8, cooldown: null,
    eligible: ["ALL"], effect: "Restore 20 Vitality; for 8s, healing caused restores +2 Vitality up to 5 triggers. Gold also grants +20% Mystic Skill DMG for 8s.",
    values: { immediateVitality: 20, healingVitality: 2, healingTriggers: 5, goldMysticDamagePct: 20 },
    evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "1.7+", source: OFFICIAL_17,
  },
  {
    id: "arena-weapon-defense-counter-qi",
    slot: "Weapon", rarity: "Epic/Gold", effectCategory: "QI_PRESSURE",
    trigger: "Defense Counter hit, then Direct Damage while target is Hit Stagger/Controlled", duration: 6, cooldown: null,
    eligible: ["ALL"], effect: "Within 6s after the marked Defense Counter hit, qualifying Direct Damage can deal extra Qi Damage up to 4 triggers.",
    values: { triggerCap: 4 }, evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "1.7+", source: OFFICIAL_17,
  },
  {
    id: "arena-disc-bellstrike-splendor",
    slot: "Disc", rarity: "Epic/Gold", effectCategory: "BREAK_CONTROL",
    trigger: "Qiankun's Lock hit", duration: null, cooldown: null,
    eligible: ["Bellstrike-Splendor"], effect: "Refund 4s of Break Control Skill cooldown; simultaneous Attunement reductions are capped at 4s.",
    values: { cooldownRefundSeconds: 4, simultaneousCapSeconds: 4 }, evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "1.7+", source: OFFICIAL_17,
  },
  {
    id: "arena-disc-stonesplit-might",
    slot: "Disc", rarity: "Epic/Gold", effectCategory: "SURVIVAL",
    trigger: "Predator's Shield Arena Attunement trigger", duration: null, cooldown: null,
    eligible: ["Stonesplit-Might"], effect: "Immediately grants the Predator's Shield HP Shield; Version 2.0 also permits immediate skill chaining after trigger.",
    evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "2.0", source: OFFICIAL_20,
  },
  {
    id: "arena-pendant-bamboocut-wind",
    slot: "Pendant", rarity: "Epic/Gold", effectCategory: "HP_PRESSURE",
    trigger: "Specified Dual Blades Light Attack hit", duration: null, cooldown: null,
    eligible: ["Bamboocut-Wind"], effect: "Epic Vulnerability is 2% per stack, max 3 stacks; Gold max stacks also 3.",
    values: { epicPct: 2, maxStacks: 3 }, evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "1.7+", source: OFFICIAL_17,
  },
  {
    id: "arena-everspring-scarlet-spin",
    slot: "Weapon", rarity: "Epic/Gold", effectCategory: "CONTROL",
    trigger: "Scarlet Spin successfully puts target into Hit Stagger or Controlled state", duration: null, cooldown: null,
    eligible: ["Bamboocut-Dust"], effect: "Current trigger is successful Hit Stagger/Control, not merely hitting a target outside Defense; Version 2.0 fixed a trigger bug.",
    evidence: EVIDENCE.CONFIRMED_OFFICIAL, patch: "2.0", source: OFFICIAL_20,
  },
]);

export const PATH_PROFILES = Object.freeze({
  "Bamboocut-Dust": {
    path: "Bamboocut-Dust", weapons: ["Everspring Umbrella", "Unfettered Rope Dart"],
    role: "CONTROL / PRESSURE", archetypes: ["RANGED_KITE", "BRUISER", "ANTI_CONTROL"],
    dimensions: { burst: 3.6, sustain: 4.1, survival: 3.1, control: 4.4, mobility: 3.9, qi: 3.7, recovery: 3.1, antiHeal: 2.4 },
    strengths: ["Scarlet Spin stagger/tracking pressure", "Soul Loss/Soulbreak pressure", "Umbrella repositioning"],
    risks: ["Charging creates punish windows", "Piercing Dart Tenacity begins only after 0.5s", "Burn and Bury is telegraphed by a golden flash"],
    evidence: EVIDENCE.MODELED,
  },
  "Bamboocut-Wind": {
    path: "Bamboocut-Wind", weapons: ["Infernal Twinblades", "Mortal Rope Dart"], role: "BURST / PURSUIT",
    archetypes: ["BURST_DIVE", "ASSASSIN"], dimensions: { burst: 4.5, sustain: 3.7, survival: 2.7, control: 3.3, mobility: 4.6, qi: 3.9, recovery: 2.7, antiHeal: 2.1 },
    strengths: ["High pursuit", "Burst conversion", "Perfect-Dodge interactions"], risks: ["Fragile under sustained pressure", "Deflection can tax offensive sequences"], evidence: EVIDENCE.MODELED,
  },
  "Bellstrike-Splendor": {
    path: "Bellstrike-Splendor", weapons: ["Nameless Sword", "Nameless Spear"], role: "TEMPO / QI PRESSURE",
    archetypes: ["BRUISER", "ANTI_CONTROL"], dimensions: { burst: 3.8, sustain: 3.8, survival: 3.5, control: 3.9, mobility: 3.7, qi: 4.4, recovery: 3.3, antiHeal: 1.3 }, evidence: EVIDENCE.MODELED,
  },
  "Bellstrike-Umbra": {
    path: "Bellstrike-Umbra", weapons: ["Strategic Sword", "Heavenquaker Spear"], role: "SUSTAINED DOT",
    archetypes: ["SUSTAIN_DOT", "BRUISER"], dimensions: { burst: 3.4, sustain: 4.5, survival: 3.3, control: 3.5, mobility: 3.2, qi: 3.7, recovery: 3.2, antiHeal: 1.4 }, evidence: EVIDENCE.MODELED,
  },
  "Stonesplit-Might": {
    path: "Stonesplit-Might", weapons: ["Thundercry Blade", "Stormbreaker Spear"], role: "TANK / CONTROL",
    archetypes: ["TANK_CONTROL", "BRUISER"], dimensions: { burst: 3.0, sustain: 3.4, survival: 4.8, control: 4.3, mobility: 2.6, qi: 3.8, recovery: 4.0, antiHeal: 1.1 }, evidence: EVIDENCE.MODELED,
  },
  "Silkbind-Jade": {
    path: "Silkbind-Jade", weapons: ["Vernal Umbrella", "Inkwell Fan"], role: "RANGED CONTROL",
    archetypes: ["RANGED_KITE", "ANTI_CONTROL"], dimensions: { burst: 3.7, sustain: 4.1, survival: 3.0, control: 4.2, mobility: 4.2, qi: 3.2, recovery: 3.5, antiHeal: 1.4 }, evidence: EVIDENCE.MODELED,
  },
});

export const ARENA_REFERENCE_PRESETS = Object.freeze(Object.values(PATH_PROFILES).map((profile) => ({
  id: `arena-ref-${profile.path.toLowerCase()}`,
  type: "ARENA_BUILD",
  path: profile.path,
  weapons: profile.weapons,
  arenaMode: profile.path === "Stonesplit-Might" ? "3v3" : "1v1",
  role: profile.role,
  patch: "2.0",
  source: "WWM Calc Arena mechanic reference",
  maturity: profile.path === "Bamboocut-Dust" ? "OFFICIAL + MODELED" : "MODELED REFERENCE",
  lastReviewed: "2026-08-18",
  gear: null,
}))); 

export function clampEnduranceReduction(value) {
  const n = Number(value);
  return Math.min(40, Math.max(0, Number.isFinite(n) ? n : 0));
}

export function createCombatState(overrides = {}) {
  return {
    t: 0, state: "NEUTRAL", hp: 100, qi: 100, endurance: 100, vitality: 100,
    breakControlProgress: 0, qiDamageBlocked: false, invincibleUntil: 0,
    tenacityUntil: 0, superArmorUntil: 0, controlImmunityUntil: 0,
    tags: [], log: [], ...overrides,
  };
}

const pushLog = (state, event, note) => ({ ...state, log: [...state.log, { t: state.t, event, note }] });

export function applyArenaEvent(input, event) {
  let s = { ...input, tags: [...(input.tags || [])], log: [...(input.log || [])] };
  if (Number.isFinite(event.t)) s.t = Math.max(s.t, event.t);
  switch (event.type) {
    case "ATTACK": s.state = "ATTACKING"; return pushLog(s, event.type, "HP, Qi and control value remain separate outputs.");
    case "DEFEND": s.state = "DEFENDING"; return pushLog(s, event.type, "Defense affects state/resource recovery; it is not a damage coefficient.");
    case "DEFLECT": s.state = "DEFLECT"; return pushLog(s, event.type, "Deflect window entered.");
    case "PERFECT_DODGE": s.state = "PERFECT_DODGE"; return pushLog(s, event.type, "Perfect Dodge confirmed by scenario event.");
    case "DODGE": s.state = "DODGE_IFRAME"; s.invincibleUntil = Math.max(s.invincibleUntil, s.t + Math.max(0, event.duration ?? 0)); return pushLog(s, event.type, "Dodge invulnerability window; duration is scenario input unless client verified.");
    case "SPRINT": s.state = "SPRINT"; s.endurance = Math.max(0, s.endurance - Math.max(0, event.cost ?? 0)); return pushLog(s, event.type, "Continuous Sprint after 1s has increased Endurance consumption in current Arena rules.");
    case "DASH": s.state = "DASH"; return pushLog(s, event.type, "Version 2.0 adds a slight Sprint→Dash delay when Sprint begins without a dodge.");
    case "CONTROL": s.state = event.kind === "IMMOBILIZED" ? "IMMOBILIZED" : "CONTROLLED"; return pushLog(s, event.type, "Control state entered.");
    case "HIT_STAGGER": s.state = "HIT_STAGGER"; return pushLog(s, event.type, "Hit Stagger state entered.");
    case "EXECUTE_KNOCKDOWN": s.state = "KNOCKDOWN"; s.qiDamageBlocked = true; return pushLog(s, event.type, "Execute knockdown: Qi Damage is blocked by current official Arena rule.");
    case "GET_UP_AFTER_EXECUTE":
      s.state = "GET_UP_PROTECTION"; s.qiDamageBlocked = false;
      s.tags = [...new Set([...s.tags, "TENACITY", "CONTROL_IMMUNITY", "SUPER_ARMOR"])];
      return pushLog(s, event.type, "Brief Tenacity + Control Immunity + Super Armor; official note does not publish an exact duration.");
    case "GUARDING_QI_CORE": {
      const wasHit = ["HIT_STAGGER", "CONTROLLED", "IMMOBILIZED", "AIRBORNE", "KNOCKDOWN"].includes(s.state);
      s.hp = Math.min(100, s.hp + Math.max(0, event.hpRestore ?? 0));
      s.qi = Math.min(100, s.qi + Math.max(0, event.qiRestore ?? 0));
      if (wasHit) s.tags = s.tags.filter((tag) => !["CONTROLLED", "IMMOBILIZED"].includes(tag));
      s.state = "INVINCIBLE"; s.invincibleUntil = s.t + 0.5;
      return pushLog(s, event.type, wasHit ? "HP/Qi restore, qualifying control clear, 0.5s Invincibility." : "HP/Qi restore and 0.5s Invincibility; inherent crowd-control removal does not trigger outside hit stagger.");
    }
    case "BREAK_CONTROL_PROGRESS": {
      const delta = Math.max(0, event.delta ?? 0);
      s.breakControlProgress = Math.min(100, s.breakControlProgress + delta);
      if (s.breakControlProgress >= 100) s.state = "BREAK_CONTROL_READY";
      return pushLog(s, event.type, "Passive Break Control progress is scenario/client input; no fabricated fill rate.");
    }
    case "QI_DAMAGE":
      if (!s.qiDamageBlocked) s.qi = Math.max(0, s.qi - Math.max(0, event.amount ?? 0));
      return pushLog(s, event.type, s.qiDamageBlocked ? "Qi Damage ignored during Execute knockdown." : "Qi Damage applied independently of HP Damage.");
    case "HP_DAMAGE":
      if (s.t >= s.invincibleUntil) s.hp = Math.max(0, s.hp - Math.max(0, event.amount ?? 0));
      return pushLog(s, event.type, s.t < s.invincibleUntil ? "HP Damage negated by Invincibility." : "HP Damage applied.");
    default: return pushLog(s, event.type || "UNKNOWN_EVENT", "Unknown/configurable Arena event retained without fabricated effect.");
  }
}

export const BAMBOOCUT_DUST_RULES = Object.freeze({
  burnAndBury: { unblockable: true, warning: "golden flash", patch: "2.0", evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: OFFICIAL_20 },
  piercingDart: { tenacityStartSeconds: 0.5, patch: "2.0", evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: OFFICIAL_20 },
  scarletSpin: { staggerImproved: true, attunementTrigger: "HIT_STAGGER_OR_CONTROLLED", patch: "2.0", evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: OFFICIAL_20 },
  resonance: { canInterruptSomeTenacity: false, patch: "1.7+", evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: OFFICIAL_17 },
  soulEffects: { soulLossPerPiercingSweepHit: 1, soulbreakDurationSeconds: 21, soulReturnDurationSeconds: 21, evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: OFFICIAL_17 },
  pveOnly: ["Returning Umbrella +20% HP Damage to non-player targets under Fragrant Song", "Dreamwrought Bubbles +20% vs non-player units"],
});

const DIMENSION_LABELS = { burst: "Burst pressure", sustain: "Sustained pressure", survival: "Survivability", control: "Control", mobility: "Mobility", qi: "Qi pressure", recovery: "Recovery", antiHeal: "Anti-heal" };
const qualitative = (delta) => delta >= 0.65 ? "ADVANTAGED" : delta <= -0.65 ? "DISADVANTAGED" : "CLOSE";

export function matchupCompare(myPath, opponentPath, mode = "1v1") {
  const mine = PATH_PROFILES[myPath];
  const theirs = PATH_PROFILES[opponentPath];
  if (!mine || !theirs) return { verdict: "INSUFFICIENT EVIDENCE", confidence: "EXPERIMENTAL", dimensions: [], why: ["One or both Path profiles are not represented safely yet."] };
  const modeAdjust = mode === "3v3" ? { survival: 0.15, control: 0.2, recovery: 0.2 } : mode === "5v5" ? { control: 0.25, mobility: 0.1, recovery: 0.15 } : {};
  const dimensions = Object.keys(DIMENSION_LABELS).map((key) => {
    const delta = (mine.dimensions[key] + (modeAdjust[key] || 0)) - theirs.dimensions[key];
    return { key, label: DIMENSION_LABELS[key], my: mine.dimensions[key], opponent: theirs.dimensions[key], delta: Number(delta.toFixed(2)), result: qualitative(delta) };
  });
  const favored = dimensions.filter((d) => d.result === "ADVANTAGED");
  const disadvantaged = dimensions.filter((d) => d.result === "DISADVANTAGED");
  const margin = dimensions.reduce((sum, d) => sum + d.delta, 0) / dimensions.length;
  const verdict = Math.abs(margin) < 0.28 ? "CLOSE MATCHUP" : margin > 0 ? "FAVORED TOOLS" : "DISADVANTAGED TOOLS";
  const confidence = Math.abs(margin) < 0.18 ? "CLOSE CALL" : "MODELED";
  return {
    myPath, opponentPath, mode, verdict, confidence, dimensions,
    favoredTools: favored.map((d) => d.label), disadvantagedTools: disadvantaged.map((d) => d.label),
    why: [
      favored.length ? `Tool advantages: ${favored.map((d) => d.label).join(", ")}.` : "No large modeled tool advantage.",
      disadvantaged.length ? `Primary risks: ${disadvantaged.map((d) => d.label).join(", ")}.` : "No large modeled tool deficit.",
      "This is a deterministic mechanic comparison, not an empirical win probability.",
    ],
  };
}

export function compareArenaBuilds(a, b, context = {}) {
  const pa = PATH_PROFILES[a.path] || PATH_PROFILES["Bamboocut-Dust"];
  const pb = PATH_PROFILES[b.path] || PATH_PROFILES["Bamboocut-Dust"];
  const statShift = (build, key) => Number(build?.arenaDimensions?.[key] || 0);
  const dimensions = Object.keys(DIMENSION_LABELS).map((key) => {
    const av = pa.dimensions[key] + statShift(a, key);
    const bv = pb.dimensions[key] + statShift(b, key);
    return { key, label: DIMENSION_LABELS[key], a: Number(av.toFixed(2)), b: Number(bv.toFixed(2)), delta: Number((av - bv).toFixed(2)) };
  });
  const objective = context.objective || "1V1_GENERAL";
  const weights = objectiveWeights(objective);
  const score = (side) => dimensions.reduce((sum, d) => sum + d[side] * (weights[d.key] || 0), 0);
  const delta = score("a") - score("b");
  return {
    objective, dimensions, arenaAttunementChanged: JSON.stringify(a.arenaAttunementIds || []) !== JSON.stringify(b.arenaAttunementIds || []),
    verdict: Math.abs(delta) < 0.35 ? "NO UNIVERSAL WINNER / CLOSE CALL" : delta > 0 ? "A BETTER FOR THIS OBJECTIVE" : "B BETTER FOR THIS OBJECTIVE",
    explanation: "PvE modeled DPS is intentionally excluded from Arena comparison.",
  };
}

function objectiveWeights(objective) {
  const map = {
    "1V1_GENERAL": { burst: 0.18, sustain: 0.14, survival: 0.16, control: 0.16, mobility: 0.14, qi: 0.12, recovery: 0.08, antiHeal: 0.02 },
    "VS_BURST": { survival: 0.30, recovery: 0.18, control: 0.15, mobility: 0.15, burst: 0.08, sustain: 0.06, qi: 0.08 },
    "VS_RANGED": { mobility: 0.28, control: 0.20, burst: 0.16, survival: 0.12, sustain: 0.08, qi: 0.08, recovery: 0.08 },
    "VS_TANK": { sustain: 0.22, qi: 0.24, control: 0.12, recovery: 0.10, antiHeal: 0.14, burst: 0.08, survival: 0.10 },
    "3V3_BURST": { burst: 0.24, control: 0.22, mobility: 0.12, qi: 0.14, survival: 0.12, recovery: 0.10, antiHeal: 0.06 },
    "3V3_SUPPORT": { survival: 0.18, control: 0.20, recovery: 0.25, mobility: 0.12, qi: 0.08, antiHeal: 0.10, sustain: 0.07 },
  };
  return map[objective] || map["1V1_GENERAL"];
}

export function rankArenaCandidates(candidates, objective = "1V1_GENERAL", opponentPath = null) {
  const weights = objectiveWeights(objective);
  const scored = candidates.map((candidate) => {
    const base = PATH_PROFILES[candidate.path] || PATH_PROFILES["Bamboocut-Dust"];
    let score = Object.keys(weights).reduce((sum, key) => sum + (base.dimensions[key] + Number(candidate.arenaDimensions?.[key] || 0)) * weights[key], 0);
    if (opponentPath && PATH_PROFILES[opponentPath]) {
      const matchup = matchupCompare(candidate.path, opponentPath, objective.startsWith("3V3") ? "3v3" : "1v1");
      score += matchup.dimensions.reduce((sum, d) => sum + d.delta, 0) * 0.02;
    }
    return { ...candidate, arenaObjectiveScore: Number(score.toFixed(3)) };
  }).sort((a, b) => b.arenaObjectiveScore - a.arenaObjectiveScore).slice(0, 3);
  if (scored.length > 1 && Math.abs(scored[0].arenaObjectiveScore - scored[1].arenaObjectiveScore) < 0.18) scored[0].rankingConfidence = "CLOSE CALL";
  else if (scored[0]) scored[0].rankingConfidence = "MODELED";
  return scored;
}

export function validate3v3Composition(players) {
  const list = Array.isArray(players) ? players.slice(0, 3) : [];
  const counts = new Map();
  for (const p of list) for (const art of (p.martialArts || []).slice(0, 2)) counts.set(art, (counts.get(art) || 0) + 1);
  const violations = [...counts.entries()].filter(([, count]) => count > 2).map(([art]) => `${art} appears more than twice.`);
  return { valid: list.length === 3 && violations.length === 0, violations, revive: "No-healer teams: one revive opportunity; fallen teammate may be revived within 10m for 15s. Healer teams use the current Resurrection restriction.", evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: OFFICIAL_527 };
}

export function simulateTeamArena({ mode = "3v3", players = [], healer = false } = {}) {
  const validation = mode === "3v3" ? validate3v3Composition(players) : { valid: true, violations: [] };
  return {
    mode, valid: validation.valid, violations: validation.violations,
    abstraction: "TEAM_EVENT_STATE",
    dimensions: ["burst coordination", "peel", "sustain", "control coverage", "anti-heal", "revive utility", "focus pressure"],
    reviveAvailable: mode === "3v3" ? !healer : null,
    note: mode === "5v5" ? "Group Strategy context models roles/AoE/peel/focus without six/ten-player frame simulation." : validation.revive,
  };
}

export const REACTION_PRESETS = Object.freeze({
  conservative: { label: "Conservative", assumption: "Late response band; leaves wider punish windows." },
  average: { label: "Average", assumption: "Middle response band for scenario comparison only." },
  perfect: { label: "Perfect-response laboratory", assumption: "Immediate legal response when a state allows it; not a player skill rating." },
});

export function simulateTimeline({ horizon = 15, reaction = "average", includeGuardingQiCore = true } = {}) {
  const h = Math.min(120, Math.max(5, Number(horizon) || 15));
  const events = [
    { t: 0, type: "NEUTRAL", label: "Neutral / spacing" },
    { t: Math.min(2, h * 0.14), type: "ENGAGE", label: "Engage" },
    { t: Math.min(4, h * 0.28), type: "CONTROL_WINDOW", label: "First control / pressure window" },
  ];
  if (includeGuardingQiCore && h >= 8) events.push({ t: Math.min(8, h * 0.52), type: "GUARDING_QI_CORE", label: "Guarding Qi Core scenario" });
  if (h >= 12) events.push({ t: Math.min(12, h * 0.72), type: "EXECUTE_OPPORTUNITY", label: "Execute opportunity / get-up protection check" });
  if (h >= 15) events.push({ t: Math.min(h, 15), type: "RESET", label: "Resource recovery / reset checkpoint" });
  return { horizon: h, reaction, reactionAssumption: REACTION_PRESETS[reaction]?.assumption || REACTION_PRESETS.average.assumption, events, evidence: EVIDENCE.MODELED, note: "Event ordering is a bounded scenario scaffold, not human reaction frame prediction." };
}

export function readPveInventorySnapshot(storage = globalThis?.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(PVE_INVENTORY_KEY) || "null");
    const activeChar = parsed?.chars?.find((c) => c.id === parsed.activeCharId) || parsed?.chars?.[0];
    const activeScheme = activeChar?.schemes?.find((s) => s.id === parsed.activeSchemeId) || activeChar?.schemes?.[0];
    if (!activeScheme) return null;
    return JSON.parse(JSON.stringify({ characterId: activeChar?.id || null, characterName: activeChar?.name || "Current character", schemeId: activeScheme.id, schemeName: activeScheme.name || "Current PvE scheme", gear: activeScheme.gear || [], panel: activeScheme.panel || null }));
  } catch { return null; }
}

export function defaultArenaState() {
  return {
    schemaVersion: ARENA_SCHEMA_VERSION, patch: ARENA_PATCH, activeProfileId: "arena-main",
    profiles: [{ id: "arena-main", name: "My Arena Build", path: "Bamboocut-Dust", weapons: ["Everspring Umbrella", "Unfettered Rope Dart"], mode: "1v1", normalAttunementProfile: null, arenaAttunementIds: ["arena-everspring-scarlet-spin"], mysticSkills: [], innerWays: [], gearSnapshot: null, battlegroup: "Jiangzhu", latency: "Moderate latency" }],
    activeModeV2: "1V1_ARENA", opponentPath: "Bamboocut-Wind", objective: "1V1_GENERAL", onboardingComplete: false,
  };
}

export function loadArenaState(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(ARENA_STORAGE_KEY);
    if (!raw) return defaultArenaState();
    return sanitizeArenaState(JSON.parse(raw));
  } catch { return defaultArenaState(); }
}

export function saveArenaState(state, storage = globalThis?.localStorage) {
  const safe = sanitizeArenaState(state);
  storage?.setItem?.(ARENA_STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

function cleanText(value, max = 120) { return String(value ?? "").replace(/[<>]/g, "").slice(0, max); }
function allowedPath(path) { return PATH_PROFILES[path] ? path : "Bamboocut-Dust"; }
function sanitizeArenaState(input) {
  const base = defaultArenaState();
  if (!input || typeof input !== "object" || Array.isArray(input)) return base;
  const profiles = (Array.isArray(input.profiles) ? input.profiles : base.profiles).slice(0, 12).map((p, index) => {
    const path = allowedPath(p?.path);
    return {
      id: cleanText(p?.id || `arena-${index}`, 64), name: cleanText(p?.name || "Arena Build", 80), path,
      weapons: PATH_PROFILES[path].weapons.slice(), mode: ARENA_MODES.includes(p?.mode) ? p.mode : "1v1",
      normalAttunementProfile: null,
      arenaAttunementIds: (Array.isArray(p?.arenaAttunementIds) ? p.arenaAttunementIds : []).filter((id) => ARENA_ATTUNEMENTS.some((a) => a.id === id)).slice(0, 8),
      mysticSkills: (Array.isArray(p?.mysticSkills) ? p.mysticSkills : []).map((v) => cleanText(v, 80)).slice(0, 8),
      innerWays: (Array.isArray(p?.innerWays) ? p.innerWays : []).map((v) => cleanText(v, 80)).slice(0, 8),
      gearSnapshot: p?.gearSnapshot && typeof p.gearSnapshot === "object" ? JSON.parse(JSON.stringify(p.gearSnapshot)) : null,
      battlegroup: cleanText(p?.battlegroup || "Jiangzhu", 40), latency: ["Low latency", "Moderate latency", "High latency"].includes(p?.latency) ? p.latency : "Moderate latency",
      arenaDimensions: sanitizeDimensions(p?.arenaDimensions),
    };
  });
  const activeModeV2 = ["1V1_ARENA", "3V3_ARENA", "GROUP_STRATEGY", "5V5_ARENA", "PERCEPTION_FOREST", "TRAINING_TERRACE"].includes(input.activeModeV2) ? input.activeModeV2 : base.activeModeV2;
  return { schemaVersion: ARENA_SCHEMA_VERSION, patch: ARENA_PATCH, activeProfileId: profiles.some((p) => p.id === input.activeProfileId) ? input.activeProfileId : profiles[0]?.id, profiles, activeModeV2, opponentPath: allowedPath(input.opponentPath || base.opponentPath), objective: cleanText(input.objective || base.objective, 40), onboardingComplete: Boolean(input.onboardingComplete) };
}
function sanitizeDimensions(input) {
  const out = {};
  if (!input || typeof input !== "object") return out;
  for (const key of Object.keys(DIMENSION_LABELS)) { const n = Number(input[key]); if (Number.isFinite(n)) out[key] = Math.min(1.5, Math.max(-1.5, n)); }
  return out;
}

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
function rejectPrototypeKeys(value, depth = 0) {
  if (depth > 8) throw new Error("Payload too deep");
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) { if (FORBIDDEN_KEYS.has(key)) throw new Error("Prototype key rejected"); rejectPrototypeKeys(value[key], depth + 1); }
}

export function validateArenaShare(payload) {
  rejectPrototypeKeys(payload);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Arena share payload");
  if (payload.schemaVersion !== ARENA_SCHEMA_VERSION) throw new Error("Unsupported Arena share schema");
  if (!["ARENA_BUILD", "ARENA_MATCHUP", "ARENA_PROFILE"].includes(payload.type)) throw new Error("Unsupported Arena share type");
  const path = allowedPath(payload.path);
  if (path !== payload.path) throw new Error("Unknown Arena path");
  const mode = ARENA_MODES.includes(payload.mode) ? payload.mode : null;
  if (!mode) throw new Error("Invalid Arena mode");
  if (JSON.stringify(payload).length > 24000) throw new Error("Arena share payload too large");
  return {
    schemaVersion: ARENA_SCHEMA_VERSION, type: payload.type, name: cleanText(payload.name || "Shared Arena Build", 80), path,
    weapons: PATH_PROFILES[path].weapons.slice(), mode, arenaAttunementIds: (Array.isArray(payload.arenaAttunementIds) ? payload.arenaAttunementIds : []).filter((id) => ARENA_ATTUNEMENTS.some((a) => a.id === id)).slice(0, 8),
    strengths: (Array.isArray(payload.strengths) ? payload.strengths : []).map((v) => cleanText(v, 160)).slice(0, 8),
    risks: (Array.isArray(payload.risks) ? payload.risks : []).map((v) => cleanText(v, 160)).slice(0, 8),
    maturity: cleanText(payload.maturity || "MODELED", 40), patch: cleanText(payload.patch || ARENA_PATCH, 40),
  };
}

function bytesToB64url(text) {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return Buffer.from(text, "utf8").toString("base64url");
}
function b64urlToText(text) {
  if (typeof atob === "function") return decodeURIComponent(escape(atob(text.replace(/-/g, "+").replace(/_/g, "/"))));
  return Buffer.from(text, "base64url").toString("utf8");
}
export function encodeArenaShare(payload) { return bytesToB64url(JSON.stringify(validateArenaShare(payload))); }
export function decodeArenaShare(encoded) {
  if (typeof encoded !== "string" || encoded.length > 32000) throw new Error("Invalid Arena share token");
  return validateArenaShare(JSON.parse(b64urlToText(encoded)));
}

export function sanitizeHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") throw new Error("Invalid history entry");
  return {
    id: cleanText(entry.id || `match-${Date.now()}`, 64), date: cleanText(entry.date || new Date().toISOString().slice(0, 10), 10), patch: cleanText(entry.patch || ARENA_PATCH, 40),
    mode: ARENA_MODES.includes(entry.mode) ? entry.mode : "1v1", battlegroup: cleanText(entry.battlegroup || "", 40), opponentPath: allowedPath(entry.opponentPath),
    opponentWeapons: (Array.isArray(entry.opponentWeapons) ? entry.opponentWeapons : []).map((v) => cleanText(v, 80)).slice(0, 2), result: ["WIN", "LOSS", "DRAW", "UNKNOWN"].includes(entry.result) ? entry.result : "UNKNOWN",
    durationSeconds: Math.min(7200, Math.max(0, Number(entry.durationSeconds) || 0)), myBuildRef: cleanText(entry.myBuildRef || "", 64), arenaAttunementRef: cleanText(entry.arenaAttunementRef || "", 120), notes: cleanText(entry.notes || "", 1000),
    observed: { damageDealt: boundedMetric(entry.observed?.damageDealt), damageTaken: boundedMetric(entry.observed?.damageTaken), healing: boundedMetric(entry.observed?.healing), qiBreaks: boundedMetric(entry.observed?.qiBreaks), executes: boundedMetric(entry.observed?.executes), revives: boundedMetric(entry.observed?.revives) },
  };
}
function boundedMetric(value) { if (value === "" || value == null) return null; const n = Number(value); return Number.isFinite(n) ? Math.min(1e9, Math.max(0, n)) : null; }
export function loadArenaHistory(storage = globalThis?.localStorage) { try { const rows = JSON.parse(storage?.getItem?.(ARENA_HISTORY_KEY) || "[]"); return (Array.isArray(rows) ? rows : []).slice(0, 250).map(sanitizeHistoryEntry); } catch { return []; } }
export function saveArenaHistory(rows, storage = globalThis?.localStorage) { const safe = (Array.isArray(rows) ? rows : []).slice(0, 250).map(sanitizeHistoryEntry); storage?.setItem?.(ARENA_HISTORY_KEY, JSON.stringify(safe)); return safe; }
export function summarizeHistory(rows) {
  const groups = new Map();
  for (const row of rows || []) { const key = `${row.mode}:${row.opponentPath}`; const g = groups.get(key) || { mode: row.mode, opponentPath: row.opponentPath, wins: 0, losses: 0, draws: 0, n: 0, totalDuration: 0 }; g.n++; if (row.result === "WIN") g.wins++; if (row.result === "LOSS") g.losses++; if (row.result === "DRAW") g.draws++; g.totalDuration += row.durationSeconds || 0; groups.set(key, g); }
  return [...groups.values()].map((g) => ({ ...g, averageDurationSeconds: g.n ? Math.round(g.totalDuration / g.n) : 0, disclosure: `n=${g.n}; descriptive record only, not a true win probability.` }));
}

export const BATTLEGROUPS = Object.freeze([
  { id: "Yougu", region: "US East" }, { id: "Linhe", region: "US West" }, { id: "Yunya", region: "Europe" }, { id: "Canglang", region: "Asia / HK-MO-TW" }, { id: "Jiangzhu", region: "Southeast Asia" },
]);

export const OFFICIAL_RULE_REFERENCES = Object.freeze({ OFFICIAL_17, OFFICIAL_20, OFFICIAL_527, OFFICIAL_PVP427 });
